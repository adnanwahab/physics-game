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
import { setupSelectionSystem } from '../utils/setupSelectionSystem.js';
import createRemotePenguinMesh from '../utils/createRemotePenguinMesh.js';
import { colorFromId } from '../utils/colorFromId.js';
import GameVideoSeekBar from '../components/GameVideoSeekBar.jsx';
import AnnotationsPanel from '../components/AnnotationsPanel.jsx';

const SERVER = 'http://localhost:3000';

export default function Game() {
const { game_id } = useParams();
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const canvasRef2 = useRef(null);
    const [showWinMessage, setShowWinMessage] = useState(false);
    const [pointCloudCount, setPointCloudCount] = useState(0);
    const [canvas2Visible, setCanvas2Visible] = useState(true);
    const [annotationsPanelVisible, setAnnotationsPanelVisible] = useState(false);
    const [playerCount, setPlayerCount] = useState(0);
    const [annotations, setAnnotations] = useState([
        { title: 'Golden Cheese', text: 'Find and touch the golden cheese block to complete the level!', location: { x: 6, y: 4, z: 17 }, color: '#ffd700' },
        { title: 'Physics Tower', text: 'This tower can be climbed. Try jumping from ledge to ledge.', location: { x: -5, y: 0, z: 38 }, color: '#12d9fb' },
        { title: 'Desk Zone', text: 'NPCs sitting at this desk.', location: { x: -12, y: 0, z: -22 }, color: '#a5a9ff' },
        { title: 'Gate Platform', text: 'Try jumping on the spiked gate for a better view.', location: { x: 0, y: 4, z: -39.9 }, color: '#ff69b4' },
    ]);
    const inputStateRef = useRef({ forwardPressed: false, backwardPressed: false, leftPressed: false, rightPressed: false, jump: false, crouched: false });
    const gameStateRef = useRef({ renderer: null, scene: null, camera: null, controls: null, clock: null, inputState: null, onExampleUpdateRef: null, joltInterface: null, physicsSystem: null, bodyInterface: null, dynamicObjects: null, Jolt: null, generateObject: null, charBody: null });

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
        const penguinMeshes = {};
        window.penguins = penguinMeshes
        //debugger
        //console.log(scene)
        // --- Register this client as a player ---
        let myPlayerId = null;

        fetch(`${SERVER}/addPlayerToRoom`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game_id, x: 0, y: 0, z: 0 }),
        }).then(r => r.json()).then(d => { 
            console.log('wtf')
            myPlayerId = d.id;
        
            penguinMeshes[d.id] = true
        }).catch((e) => {
            //debugger
        });

        // --- Penguin mesh registry: id → THREE.Mesh ---
   

        // --- Poll server every 100ms for other players in the same room ---

        // Fix for ERR_CONNECTION_REFUSED:
        // Use window.location.hostname (and protocol), so fetch will use the correct address in deployed/preview mode.
        // This will work for localhost, IP, or remote hosts.

        function getServerUrl() {
            // Attempt to use same hostname and protocol as the page itself,
            // but default to port 3000 (where Bun server is running)
            const { protocol, hostname } = window.location;
            return `${protocol}//${hostname}:3000`;
        }

        const pollInterval = setInterval(() => {
            const serverUrl = getServerUrl();
         
            // fetch(`${serverUrl}/getPlayersInRoom?game_id=${encodeURIComponent(game_id)}`)
            //     .then(r => r.json())
            //     .then(remotePlayers => {
            //         if (!isMounted) return;
            //         const activeIds = new Set(remotePlayers.map(p => String(p.id)));

            //         // Create or update a penguin for every other player
            //         remotePlayers.forEach(p => {
            //             const pid = String(p.id);
            //             if (pid === String(myPlayerId)) return; // skip self
            //             if (!penguinMeshes[pid]) {
            //                 penguinMeshes[pid] = createRemotePenguinMesh(colorFromId(pid));
            //                 scene.add(penguinMeshes[pid]);
            //             }
            //             penguinMeshes[pid].position.set(p.x, p.y, p.z);
            //         });
 

            //         // Remove penguins for players who left
            //         for (const pid of Object.keys(penguinMeshes)) {
            //             if (!activeIds.has(pid)) {
            //                 scene.remove(penguinMeshes[pid]);
            //                 delete penguinMeshes[pid];
            //             }
            //         }
            //         setPlayerCount(remotePlayers.length);
            //     }).catch(() => {});
        }, 100);
        cleanupFunctions.push(() => clearInterval(pollInterval));

        const { renderer2, camera2 } = setupCanvas2(canvas2, isMountedRef, cleanupFunctions, setPointCloudCount);

        const handleResize = () => {
            if (!isMounted) return;
            handleWindowResize({ width: window.innerWidth * 0.9, height: window.innerHeight * 0.9 }, camera, renderer);
            const r2 = canvas2.getBoundingClientRect();
            camera2.aspect = r2.width / r2.height;
            camera2.updateProjectionMatrix();
            renderer2.setSize(r2.width, r2.height, false);
        };
        window.addEventListener('resize', handleResize);
        cleanupFunctions.push(() => window.removeEventListener('resize', handleResize));

        initJolt().then(async (Jolt) => {
            if (!isMounted) return;
            try { if (typeof renderer.init === 'function') await renderer.init(); } catch (e) { console.warn(e); }
            const { joltInterface, physicsSystem, bodyInterface } = initPhysics(Jolt);
            if (!isMounted) return;
            Object.assign(gameStateRef.current, { joltInterface, physicsSystem, bodyInterface, Jolt });
            const dynamicObjects = [];
            gameStateRef.current.dynamicObjects = dynamicObjects;

            gameStateRef.current.selectionSystem = setupSelectionSystem(scene, camera, canvas, cleanupFunctions);

            const charBody = setupExample(Jolt, bodyInterface, scene, dynamicObjects, onExampleUpdateRef, game_id);
            
            gameStateRef.current.charBody = charBody;

            loadLevelCuboids(game_id, Jolt, bodyInterface, scene, dynamicObjects)
                .then(({ cheesePosition, effectUpdaters, effectDisposers }) => {
                    Object.assign(gameStateRef.current, { cheesePosition, effectUpdaters, effectDisposers });
                }).catch(e => console.error('Error loading level cuboids:', e));

            handleUserInput(inputStateRef.current);

            // Send this player's position to the server every 3 frames
            let syncTick = 0;
            function onExampleUpdate(time, deltaTime) {
                if (onExampleUpdateRef.fn) onExampleUpdateRef.fn(time, deltaTime, inputStateRef.current);
                if (gameStateRef.current.effectUpdaters) gameStateRef.current.effectUpdaters.forEach(u => u(deltaTime));
                if (++syncTick % 3 === 0 && myPlayerId && charBody) {
                    const pos = bodyInterface.GetPosition(charBody.GetID());
                    fetch(`${SERVER}/playerMoveInRoom`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: myPlayerId, x: pos.GetX(), y: pos.GetY(), z: pos.GetZ() }),
                    }).catch(() => {});
                }
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
            // Tell server this player is gone
            if (myPlayerId) {
                fetch(`${SERVER}/removePlayerFromRoom`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: myPlayerId }),
                }).catch(() => {});
            }
            // Remove all remote penguin meshes
            Object.values(penguinMeshes).forEach(m => scene.remove(m));
            gameStateRef.current.effectDisposers?.forEach(d => d());
            cleanupFunctions.forEach(fn => fn());
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
                <button style={{ marginLeft: 10, background: annotationsPanelVisible ? '#ffd700' : '#353535', color: annotationsPanelVisible ? '#111' : '#ffd700', border: 'none', borderRadius: 6, padding: '7px 18px', fontWeight: 'bold', fontSize: '1.05rem', cursor: 'pointer' }} onClick={() => setAnnotationsPanelVisible(x => !x)}>
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
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                    <div style={{ backgroundColor: '#1a1a1a', padding: '40px 60px', borderRadius: '16px', border: '2px solid #ffd700', textAlign: 'center' }}>
                        <h2 style={{ color: '#ffd700', fontSize: '3rem', margin: '0 0 20px 0' }}>🎉 Congratulations! 🎉</h2>
                        <p style={{ color: '#fff', fontSize: '1.5rem', margin: 0 }}>You found the cheese!</p>
                    </div>
                </div>
            )}
        </div>
    );
}
