import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import WASDControls from '../components/WASDControls';
import { Clock } from 'three';
import { initGraphics } from '../initGraphics.js';
import { onWindowResize as handleWindowResize } from '../onWindowResize.js';
import { initPhysics } from '../initPhysics.js';
import { renderLoop } from '../utils/renderLoop.js';
import { setupExample } from '../utils/setupExample.js';
import { handleUserInput } from '../utils/handleUserInput.js';
import initJolt from '../utils/jolt-physics.wasm-compat.js';
import { setupLighting } from '../lighting.js';
import initGenerateObject from '../mutateScene.ts';
import loadLevelCuboids from '../utils/loadLevelCuboids.js';
import { setupCanvas2 } from '../utils/setupCanvas2.js';
import { setupWebSocketPenguins } from '../utils/setupWebSocketPenguins.js';
import { setupSelectionSystem } from '../utils/setupSelectionSystem.js';
import { usePlayerSync } from '../utils/usePlayerSync.js';
import GameVideoSeekBar from '../components/GameVideoSeekBar.jsx';
import AnnotationsPanel from '../components/AnnotationsPanel.jsx';

export default function Game() {
    const { game_id } = useParams();
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const canvasRef2 = useRef(null);
    const [showWinMessage, setShowWinMessage] = useState(false);
    const [pointCloudCount, setPointCloudCount] = useState(0);
    const [canvas2Visible, setCanvas2Visible] = useState(true);
    const [annotationsPanelVisible, setAnnotationsPanelVisible] = useState(false);
    const [, setRemotePenguinsTick] = useState(0);
    const penguinsRef = useRef({});
    const myPlayerIdRef = useRef(null);
    const [playerCount, setPlayerCount] = useState(0);
    const [annotations, setAnnotations] = useState([
        { title: 'Golden Cheese', text: 'Find and touch the golden cheese block to complete the level!', location: { x: 6, y: 4, z: 17 }, color: '#ffd700' },
        { title: 'Physics Tower', text: 'This tower can be climbed. Try jumping from ledge to ledge.', location: { x: -5, y: 0, z: 38 }, color: '#12d9fb' },
        { title: 'Desk Zone', text: 'NPCs sitting at this desk. Maybe they are working on the next puzzle!', location: { x: -12, y: 0, z: -22 }, color: '#a5a9ff' },
        { title: 'Gate Platform', text: 'Try jumping on the spiked gate for a better view—you might spot secret paths.', location: { x: 0, y: 4, z: -39.9 }, color: '#ff69b4' },
    ]);
    const inputStateRef = useRef({ forwardPressed: false, backwardPressed: false, leftPressed: false, rightPressed: false, jump: false, crouched: false });
    const gameStateRef = useRef({ renderer: null, scene: null, camera: null, controls: null, clock: null, inputState: null, onExampleUpdateRef: null, joltInterface: null, physicsSystem: null, bodyInterface: null, dynamicObjects: null, Jolt: null, generateObject: null, wsClient: null, penguins: penguinsRef.current });

    usePlayerSync(setPlayerCount);

    useEffect(() => {
        if (!containerRef.current || !canvasRef.current || !canvasRef2.current) return;
        const canvas = canvasRef.current;
        const canvas2 = canvasRef2.current;
        const { renderer, scene, camera, controls } = initGraphics(canvas, containerRef.current, { width: window.innerWidth * 0.9, height: window.innerHeight * 0.9 });
        setupLighting(scene);
        const clock = new Clock();
        const onExampleUpdateRef = { fn: null };
        Object.assign(gameStateRef.current, { renderer, scene, camera, controls, clock, inputState: inputStateRef.current, onExampleUpdateRef });
        const cleanupFunctions = [];
        let isMounted = true;
        const isMountedRef = { current: true };

        const { renderer2, camera2 } = setupCanvas2(canvas2, isMountedRef, cleanupFunctions, setPointCloudCount);

        const handleResize = () => {
            if (!isMounted) return;
            handleWindowResize({ width: window.innerWidth * 0.9, height: window.innerHeight * 0.9 }, camera, renderer);
            const r2 = canvas2.getBoundingClientRect();
            camera2.aspect = r2.width / r2.height;
            camera2.updateProjectionMatrix();
            renderer2.setSize(r2.width, r2.height, false);
        };

        // On mount, fetch to add a new player and store the returned id locally
        fetch('http://localhost:5173/newPlayer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ x: 0, y: 0, z: 0 }) // Optionally customize initial position
        })
        .then(res => res.json())
        .then(data => {
            if (data && typeof data.id === 'number') {
                myPlayerIdRef.current = data.id;
            }
        })
        .catch(e => console.error('Failed to create new player:', e));


        
        window.addEventListener("keydown", (event) => {
            console.log('fetch keyodwn    getplayers')
            //console.log(event.key);  // e.g. "a", "Enter", "ArrowUp"
          // On keydown, send a fetch to the server to move all players
          fetch('http://localhost:5173/getPlayers')
            .then(res => res.json())
            .then(players => {
                players.forEach(player => {
                    fetch('http://localhost:5173/playerMove', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            id: player.id,   // move each player by dx=1, dy=1, dz=0 (defaults are provided server side)
                        })
                    });
                });
            })
            .catch(e => console.error('Error moving all players:', e));
  
          });


        window.addEventListener('resize', handleResize);
        cleanupFunctions.push(() => window.removeEventListener('resize', handleResize));

        initJolt().then(async (Jolt) => {
            if (!isMounted) return;
            try { if (typeof renderer.init === 'function') await renderer.init(); } catch (e) { console.warn('Error initializing renderer:', e); }
            const { joltInterface, physicsSystem, bodyInterface } = initPhysics(Jolt);
            if (!isMounted) return;
            Object.assign(gameStateRef.current, { joltInterface, physicsSystem, bodyInterface, Jolt });
            const dynamicObjects = [];
            gameStateRef.current.dynamicObjects = dynamicObjects;

            const wsClient = setupWebSocketPenguins({ game_id, scene, penguinsRef, myPlayerIdRef, setRemotePenguinsTick, setPlayerCount, cleanupFunctions });
            gameStateRef.current.wsClient = wsClient;
            gameStateRef.current.selectionSystem = setupSelectionSystem(scene, camera, canvas, cleanupFunctions);

            const charBody = setupExample(Jolt, bodyInterface, scene, dynamicObjects, onExampleUpdateRef, game_id);
            gameStateRef.current.charBody = charBody;

            loadLevelCuboids(game_id, Jolt, bodyInterface, scene, dynamicObjects)
                .then(({ cheesePosition, effectUpdaters, effectDisposers }) => {
                    Object.assign(gameStateRef.current, { cheesePosition, effectUpdaters, effectDisposers });
                }).catch(e => console.error('Error loading level cuboids:', e));

            handleUserInput(inputStateRef.current);

            function sendPenguinPositionToServer() {
                if (!wsClient?.connected || !charBody) return;
                const pos = bodyInterface.GetPosition(charBody.GetID());
                const quat = bodyInterface.GetRotation(charBody.GetID());
                wsClient.sendJson({ type: 'player_update', game_id, pos: { x: pos.GetX(), y: pos.GetY(), z: pos.GetZ() }, quat: { x: quat.GetX(), y: quat.GetY(), z: quat.GetZ(), w: quat.GetW() } });
            }

            let netSyncTick = 0;
            function onExampleUpdate(time, deltaTime) {
                if (onExampleUpdateRef.fn) onExampleUpdateRef.fn(time, deltaTime, inputStateRef.current);
                if (gameStateRef.current.effectUpdaters) gameStateRef.current.effectUpdaters.forEach(u => u(deltaTime));
                if (++netSyncTick % 2 === 0) sendPenguinPositionToServer();
            }

            const generateObject = initGenerateObject(Jolt, physicsSystem, scene);
            gameStateRef.current.generateObject = generateObject;
            const addBtn = document.getElementById('add-objects');
            if (addBtn) {
                const onClick = () => generateObject();
                addBtn.addEventListener('click', onClick);
                cleanupFunctions.push(() => addBtn.removeEventListener('click', onClick));
            }

            renderLoop(clock, onExampleUpdate, renderer, scene, camera, joltInterface, dynamicObjects, Jolt, controls, {});
        }).catch(e => console.error('Error initializing game:', e));

        return () => {
            isMounted = false;
            isMountedRef.current = false;
            gameStateRef.current.effectDisposers?.forEach(d => d());
            cleanupFunctions.forEach(fn => fn());
            try { gameStateRef.current.wsClient?.disconnect(); } catch (e) { console.error('WebSocket disconnect failed:', e); }
            gameStateRef.current.wsClient = null;
            try { gameStateRef.current.renderer?.dispose(); } catch (_) {}
            Object.assign(gameStateRef.current, { renderer: null, scene: null, camera: null, controls: null });
        };
    }, [game_id]);

    const handleAddAnnotation = useCallback(() => {
        const note = prompt('What would you like to note?');
        if (note?.trim()) {
            const pastelColors = ['#ffd700', '#12d9fb', '#a5a9ff', '#ff69b4', '#baffc9', '#bdb2ff', '#f7a8b8'];
            setAnnotations(prev => [...prev, { title: 'Custom Note', text: note.trim(), location: { x: 0, y: 5, z: 0 }, color: pastelColors[Math.floor(Math.random() * pastelColors.length)] }]);
            setAnnotationsPanelVisible(true);
        }
    }, []);

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>
                <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>Level {game_id}</h1>
                <div style={{ display: 'inline-block', background: '#292a36', color: '#ffd700', fontWeight: '600', fontSize: '1.03rem', borderRadius: 7, padding: '4px 15px', marginBottom: '8px', marginRight: '14px', marginLeft: '8px', letterSpacing: '0.5px', border: '2px solid #ffd700' }}>
                    🐧 {playerCount} playing
                </div>
                <button onClick={() => setCanvas2Visible(v => !v)}>{canvas2Visible ? 'Hide' : 'Show'} Canvas2</button>
                <GameVideoSeekBar annotations={annotations} />
                <button style={{ marginLeft: 10, background: annotationsPanelVisible ? '#ffd700' : '#353535', color: annotationsPanelVisible ? '#111' : '#ffd700', border: 'none', borderRadius: 6, padding: '7px 18px', fontWeight: 'bold', fontSize: '1.05rem', cursor: 'pointer', boxShadow: annotationsPanelVisible ? '0 0 0 3px #ffd70055' : '0 1px 3px #111' }} onClick={() => setAnnotationsPanelVisible(x => !x)}>
                    {annotationsPanelVisible ? 'Hide' : 'Show'} Annotations
                </button>
            </div>
            <div ref={containerRef} id="container" style={{ width: '100%', height: '90vh', position: 'relative' }}>
                <canvas ref={canvasRef} id="canvas" style={{ width: '500px', height: '200px', display: 'block' }} />
                {canvas2Visible && (
                    <canvas ref={canvasRef2} onClick={() => {}} onMouseDown={handleAddAnnotation} id="canvas2"
                        style={{ width: '250px', height: '220px', border: '6px dashed white', position: 'absolute', top: '12px', left: '12px', zIndex: 1010, backgroundColor: 'rgba(0,0,0,0.42)' }} />
                )}
                <p style={{ color: 'white', fontSize: '1rem', position: 'absolute', top: '242px', left: '18px', zIndex: 1012, pointerEvents: 'none', background: 'rgba(0,0,0,0.28)', borderRadius: '6px', padding: '4px 10px' }}>
                    Point Cloud Count: {pointCloudCount} particles rendered
                </p>
                <AnnotationsPanel annotations={annotations} visible={annotationsPanelVisible} onClose={() => setAnnotationsPanelVisible(false)} />
            </div>
            <WASDControls inputState={inputStateRef.current} />
            {showWinMessage && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, flexDirection: 'column' }}>
                    <div style={{ backgroundColor: '#1a1a1a', padding: '40px 60px', borderRadius: '16px', border: '2px solid #ffd700', boxShadow: '0 0 30px rgba(255,215,0,0.5)', textAlign: 'center' }}>
                        <h2 style={{ color: '#ffd700', fontSize: '3rem', margin: '0 0 20px 0', textShadow: '0 0 20px rgba(255,215,0,0.8)' }}>🎉 Congratulations! 🎉</h2>
                        <p style={{ color: '#fff', fontSize: '1.5rem', margin: 0 }}>You found the cheese!</p>
                        <p style={{ color: '#aaa', fontSize: '1rem', marginTop: '10px' }}>Returning to level select...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
