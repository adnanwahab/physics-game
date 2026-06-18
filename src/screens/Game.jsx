import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import WASDControls from '../components/WASDControls';

import { loadGLTFModel } from "../utils/gltf-loader.js";
import { loadOBJModel } from "../utils/obj-loader.js";
import deskObjUrl from "../obj/desk.obj?url";
import sittingPersonObjUrl from "../obj/sitting_person.obj?url";
import { Clock } from "three";
import { initGraphics } from "../initGraphics.js";
import { onWindowResize as handleWindowResize } from "../onWindowResize.js";
import { initPhysics } from "../initPhysics.js";
import { renderLoop } from "../utils/renderLoop.js";
import { setupExample } from "../utils/setupExample.js";
import { handleUserInput } from "../utils/handleUserInput.js";
import initJolt from "../utils/jolt-physics.wasm-compat.js";
import * as THREE from "three";
import editScene from "../utils/edit_scene.js";
import { setupLighting } from "../lighting.js";
import { createBox } from "../utils/createBox.js";
import { addToScene } from "../utils/addToScene.js";
import { getThreeObjectForBody } from "../utils/getThreeObjectForBody.js";
import initGenerateObject from "../mutateScene.ts";
import { SelectionSystem } from "../selectionSystem.js";
import { WebSocketClient } from "../utils/websocket.js";
import { createSoundWaveRings } from "../createSoundWaveRings.js";

import loadLevelCuboids from "../utils/loadLevelCuboids.js";
import GameVideoSeekBar from "../components/GameVideoSeekBar.jsx";
import AnnotationsPanel from "../components/AnnotationsPanel.jsx";


export default function Game() {
    const { game_id } = useParams();
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const canvasRef2 = useRef(null);
    const [showWinMessage, setShowWinMessage] = useState(false);
    const [pointCloudCount, setPointCloudCount] = useState(0);

    // === Canvas2 visibility state ===
    const [canvas2Visible, setCanvas2Visible] = useState(true);

    // === Annotations side panel state ===
    const [annotationsPanelVisible, setAnnotationsPanelVisible] = useState(false);

    // Used to force re-render of penguin list if ever needed
    const [, setRemotePenguinsTick] = useState(0);

    // Multiplayer penguin references
    const penguinsRef = useRef({}); // { [id]: { mesh: THREE.Mesh, color: string } }
    const myPlayerIdRef = useRef(null);

    // State to show how many players are currently playing
    const [playerCount, setPlayerCount] = useState(0);

    const inputStateRef = useRef({
        forwardPressed: false,
        backwardPressed: false,
        leftPressed: false,
        rightPressed: false,
        jump: false,
        crouched: false,
    });

    const gameStateRef = useRef({
        renderer: null,
        scene: null,
        camera: null,
        controls: null,
        clock: null,
        inputState: null,
        onExampleUpdateRef: null,
        joltInterface: null,
        physicsSystem: null,
        bodyInterface: null,
        dynamicObjects: null,
        Jolt: null,
        generateObject: null,
        cleanup: null,
        wsClient: null,
        penguins: penguinsRef.current,
    });

    // Demo annotations data for level/category game
    const annotations = [
        {
            title: "Golden Cheese",
            text: "Find and touch the golden cheese block to complete the level!",
            location: { x: 6, y: 4, z: 17 },
            color: "#ffd700"
        },
        {
            title: "Physics Tower",
            text: "This tower can be climbed. Try jumping from ledge to ledge. Good test of your parkour skills.",
            location: { x: -5, y: 0, z: 38 },
            color: "#12d9fb"
        },
        {
            title: "Desk Zone",
            text: "NPCs sitting at this desk. Maybe they are working on the next puzzle!",
            location: { x: -12, y: 0, z: -22 },
            color: "#a5a9ff"
        },
        {
            title: "Gate Platform",
            text: "Try jumping on the spiked gate for a better view—you might spot secret paths.",
            location: { x: 0, y: 4, z: -39.9 },
            color: "#ff69b4"
        }
    ];

    useEffect(() => {
        if (!containerRef.current || !canvasRef.current || !canvasRef2.current) return;

        const container = containerRef.current;
        const canvas = canvasRef.current;
        const canvas2 = canvasRef2.current;
        const size = { width: window.innerWidth * 0.9, height: window.innerHeight * 0.9 };

        // === Init Main Graphics ===
        const { renderer, scene, camera, controls } = initGraphics(canvas, container, size);
        setupLighting(scene);

        const clock = new Clock();
        const onExampleUpdateRef = { fn: null };

        gameStateRef.current.renderer = renderer;
        gameStateRef.current.scene = scene;
        gameStateRef.current.camera = camera;
        gameStateRef.current.controls = controls;
        gameStateRef.current.clock = clock;
        gameStateRef.current.inputState = inputStateRef.current;
        gameStateRef.current.onExampleUpdateRef = onExampleUpdateRef;

        let cleanupFunctions = [];
        let isMounted = true;

        // === Canvas2 code: render a chair made of shiny silver particles ===
        const rect2 = canvas2.getBoundingClientRect();
        const renderer2 = new THREE.WebGLRenderer({ canvas: canvas2, alpha: true, antialias: true });
        renderer2.setSize(rect2.width, rect2.height, false);
        renderer2.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        const scene2 = new THREE.Scene();
        const camera2 = new THREE.PerspectiveCamera(45, rect2.width / rect2.height, 0.1, 100);
        camera2.position.z = 30;

        // Lights for shiny effect
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene2.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
        directionalLight.position.set(10, 20, 20);
        scene2.add(directionalLight);

        // --- Chair Model as Point Cloud ---
        const particleCount = 3000; // Fewer than previously to allow for real placement
        const positions = new Float32Array(particleCount * 3);

        // Chair dimensions (in arbitrary units)
        const seatWidth = 8, seatDepth = 8, seatHeight = 8;
        const legHeight = 10, legRadius = 0.5;
        const backrestHeight = 10, backrestThickness = 0.7;

        // Distribute particles
        let n = 0;

        // Helper to place a particle
        function place(x, y, z) {
            if (n >= particleCount) return;
            positions[n * 3] = x;
            positions[n * 3 + 1] = y;
            positions[n * 3 + 2] = z;
            n++;
        }

        // Seat (flat square, some thickness)
        for (let i = 0; i < 1100; i++) {
            const x = THREE.MathUtils.lerp(-seatWidth / 2, seatWidth / 2, Math.random());
            const z = THREE.MathUtils.lerp(-seatDepth / 2, seatDepth / 2, Math.random());
            const y = 0;
            const t = THREE.MathUtils.lerp(-0.7, 0.7, Math.random());
            place(x, y + t, z);
        }

        // Four legs - simple vertical cylinders at the corners
        for (let leg = 0; leg < 4; leg++) {
            const lx = leg < 2 ? -seatWidth / 2 + 0.8 : seatWidth / 2 - 0.8;
            const lz = (leg % 2 === 0) ? -seatDepth / 2 + 0.8 : seatDepth / 2 - 0.8;
            for (let i = 0; i < 300; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = legRadius * Math.sqrt(Math.random());
                const x = lx + Math.cos(angle) * radius;
                const z = lz + Math.sin(angle) * radius;
                const y = -1.5 - Math.random() * legHeight;
                place(x, y, z);
            }
        }

        // Backrest (upright plane, some thickness at the seat's back)
        for (let i = 0; i < 800; i++) {
            const x = THREE.MathUtils.lerp(-seatWidth / 2, seatWidth / 2, Math.random());
            const z = seatDepth / 2 + backrestThickness * THREE.MathUtils.randFloat(-0.2, 1.2);
            const y = THREE.MathUtils.lerp(1.5, 1.5 + backrestHeight, Math.random());
            place(x, y, z);
        }

        // Optionally: sides/top of backrest bars
        for (let i = 0; i < 400; i++) {
            const x = THREE.MathUtils.lerp(-seatWidth / 2 + 0.1, seatWidth / 2 - 0.1, Math.random());
            const z = seatDepth / 2 + 0.7;
            const y = THREE.MathUtils.lerp(7.5, 9 + backrestHeight, Math.random());
            place(x, y, z);
        }

        // Create geometry
        const geometry2 = new THREE.BufferGeometry();
        geometry2.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        setPointCloudCount(n);

        // Create the shiny material for particles (removing unsupported shininess/specular)
        const silverColor = new THREE.Color(0xeaeaea);
        const pinkColor = new THREE.Color(0xff69b4);

        const spriteMap = (() => {
            const size = 64;
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = size;
            const ctx = canvas.getContext('2d');
            const gradient = ctx.createRadialGradient(
                size / 2,
                size / 2,
                0,
                size / 2,
                size / 2,
                size / 2
            );
            gradient.addColorStop(0.1, '#fff');
            gradient.addColorStop(0.25, '#dddddd');
            gradient.addColorStop(1, '#bbbbbb00');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
            ctx.fill();
            return new THREE.CanvasTexture(canvas);
        })();

        const material2 = new THREE.PointsMaterial({
            color: silverColor,
            size: 0.55,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.86,
            map: spriteMap,
            alphaTest: 0.13,
            depthWrite: false
        });

        const pointCloud = new THREE.Points(geometry2, material2);
        scene2.add(pointCloud);
        let canvas2AnimationFrameId;

        const handlePointerEnter = () => {
            material2.color.copy(pinkColor);
            material2.needsUpdate = true;
        };
        const handlePointerLeave = () => {
            material2.color.copy(silverColor);
            material2.needsUpdate = true;
        };

        // Attach native DOM events for hover tracking
        canvas2.addEventListener('mouseenter', handlePointerEnter);
        canvas2.addEventListener('mouseleave', handlePointerLeave);
        cleanupFunctions.push(() => {
            canvas2.removeEventListener('mouseenter', handlePointerEnter);
            canvas2.removeEventListener('mouseleave', handlePointerLeave);
        });

        const animateCanvas2 = () => {
            if (!isMounted) return;
            canvas2AnimationFrameId = requestAnimationFrame(animateCanvas2);
            pointCloud.rotation.x += 0.003;
            pointCloud.rotation.y += 0.005;
            renderer2.render(scene2, camera2);
        };
        animateCanvas2();
        cleanupFunctions.push(() => {
            cancelAnimationFrame(canvas2AnimationFrameId);
            geometry2.dispose();
            material2.dispose();
            renderer2.dispose();
        });

        // === Resize for both contexts ===
        const handleResize = () => {
            if (!isMounted) return;
            const newSize = { width: window.innerWidth * 0.9, height: window.innerHeight * 0.9 };
            handleWindowResize(newSize, camera, renderer);
            const r2 = canvas2.getBoundingClientRect();
            camera2.aspect = r2.width / r2.height;
            camera2.updateProjectionMatrix();
            renderer2.setSize(r2.width, r2.height, false);
        };
        window.addEventListener('resize', handleResize);
        cleanupFunctions.push(() => window.removeEventListener('resize', handleResize));

        // === Physics & Jolt Init ===
        initJolt().then(async (Jolt) => {
            if (!isMounted) return;

            // Try/catch in case .init() doesn't exist or fails
            try {
                if (typeof renderer.init === 'function') {
                    await renderer.init();
                }
            } catch (e) {
                console.warn('Error initializing renderer:', e);
            }

            const { joltInterface, physicsSystem, bodyInterface } = initPhysics(Jolt);
            if (!isMounted) return;

            gameStateRef.current.joltInterface = joltInterface;
            gameStateRef.current.physicsSystem = physicsSystem;
            gameStateRef.current.bodyInterface = bodyInterface;
            gameStateRef.current.Jolt = Jolt;
            const dynamicObjects = [];
            gameStateRef.current.dynamicObjects = dynamicObjects;

            // === Multiplayer Penguin WebSocket Setup ===
            // Use the game_id as the roomId in the websocket.
            const wsUrl = `ws://localhost:3000/?room=${encodeURIComponent(game_id)}`;
            const wsClient = new WebSocketClient(wsUrl);

            // Defensive: wrap connect() and all listeners with error handlers
            try {
                gameStateRef.current.wsClient = wsClient;
                wsClient.connect();

                penguinsRef.current = {};
                gameStateRef.current.penguins = penguinsRef.current;

                wsClient.on('assign_id', (msg) => {
                    myPlayerIdRef.current = msg.id;
                });

                wsClient.on('player_state', (stateMsg) => {
                    // This should be: { players: { [id]: { pos: {x, y, z}, quat, color } } }
                    if (!stateMsg.players) return;
                    Object.entries(stateMsg.players).forEach(([id, pdata]) => {
                        if (!penguinsRef.current[id]) {
                            // Create a mesh for each remote penguin (including the current player)
                            const color = pdata.color !== undefined ? pdata.color : colorFromId(id);
                            const mesh = createRemotePenguinMesh(color);
                            scene.add(mesh);
                            penguinsRef.current[id] = { mesh, color };
                        }
                        penguinsRef.current[id].mesh.position.set(
                            pdata.pos.x,
                            pdata.pos.y,
                            pdata.pos.z
                        );
                        if (pdata.quat) {
                            penguinsRef.current[id].mesh.quaternion.set(
                                pdata.quat.x,
                                pdata.quat.y,
                                pdata.quat.z,
                                pdata.quat.w
                            );
                        }
                    });
                    // Remove penguins for ids not present in player state
                    const currentIds = Object.keys(stateMsg.players);
                    for (const existingId of Object.keys(penguinsRef.current)) {
                        if (!currentIds.includes(existingId)) {
                            scene.remove(penguinsRef.current[existingId].mesh);
                            delete penguinsRef.current[existingId];
                        }
                    }
                    setRemotePenguinsTick(t => t + 1);
                    setPlayerCount(Object.keys(stateMsg.players).length);
                });

                // Clean-up multiplayer penguin meshes on dismount
                cleanupFunctions.push(() => {
                    Object.values(penguinsRef.current).forEach(({ mesh }) => scene.remove(mesh));
                    penguinsRef.current = {};
                });
            } catch (e) {
                console.error("Websocket setup failed:", e);
            }

            // Selection system as before:
            const selectionSystem = new SelectionSystem(scene, camera, canvas);
            gameStateRef.current.selectionSystem = selectionSystem;
            let allowSelection = true;
            let mouseDownPos = null;

            const handlePointerDown = (event) => {
                if (event.button === 0) {
                    mouseDownPos = { x: event.clientX, y: event.clientY };
                    allowSelection = true;
                }
            };
            const handlePointerMove = (event) => {
                if (mouseDownPos && event.buttons === 1) {
                    const dx = Math.abs(event.clientX - mouseDownPos.x);
                    const dy = Math.abs(event.clientY - mouseDownPos.y);
                    if (dx > 5 || dy > 5) allowSelection = false;
                }
            };
            const handlePointerUp = (event) => {
                if (event.button === 0 && allowSelection && mouseDownPos) {
                    setTimeout(() => selectionSystem.handleClick(event), 10);
                }
                mouseDownPos = null;
                allowSelection = true;
            };
            canvas.addEventListener('pointerdown', handlePointerDown);
            canvas.addEventListener('pointermove', handlePointerMove);
            canvas.addEventListener('pointerup', handlePointerUp);
            cleanupFunctions.push(() => {
                canvas.removeEventListener('pointerdown', handlePointerDown);
                canvas.removeEventListener('pointermove', handlePointerMove);
                canvas.removeEventListener('pointerup', handlePointerUp);
                selectionSystem.dispose();
            });

            // Main player character
            const charBody = setupExample(Jolt, bodyInterface, scene, dynamicObjects, onExampleUpdateRef, game_id);
            gameStateRef.current.charBody = charBody;

            let cheesePosition = null;
            loadLevelCuboids(game_id, Jolt, bodyInterface, scene, dynamicObjects)
                .then(({ cheesePosition: cheesePos, effectUpdaters, effectDisposers }) => {
                    cheesePosition = cheesePos;
                    gameStateRef.current.cheesePosition = cheesePos;
                    gameStateRef.current.effectUpdaters = effectUpdaters;
                    gameStateRef.current.effectDisposers = effectDisposers;
                }).catch((error) => console.error('Error loading level cuboids:', error));

            handleUserInput(inputStateRef.current);

            // === Send *your* penguin position and orientation to server over websocket ===
            function sendPenguinPositionToServer() {
                if (!wsClient || !wsClient.connected) return;
                if (!(charBody && bodyInterface)) return;
                const bodyId = charBody.GetID();
                const pos = bodyInterface.GetPosition(bodyId);
                const quat = bodyInterface.GetRotation(bodyId);
                wsClient.sendJson({
                    type: 'player_update',
                    game_id, // for server to know which room
                    pos: { x: pos.GetX(), y: pos.GetY(), z: pos.GetZ() },
                    quat: { x: quat.GetX(), y: quat.GetY(), z: quat.GetZ(), w: quat.GetW() }
                });
            }

            // Render loop hook: update our position to server, update effects, and check win
            let netSyncTick = 0, netSyncEvery = 2;
            function onExampleUpdate(time, deltaTime) {
                if (onExampleUpdateRef.fn) {
                    onExampleUpdateRef.fn(time, deltaTime, inputStateRef.current);
                }

                const effectUpdaters = gameStateRef.current.effectUpdaters;
                if (effectUpdaters) {
                    for (const updateEffect of effectUpdaters) {
                        updateEffect(deltaTime);
                    }
                }

                // Multiplayer: send our pos every Nth frame for smoothness w/o spamming server
                netSyncTick = (netSyncTick + 1) % netSyncEvery;
                if (netSyncTick === 0) sendPenguinPositionToServer();

                // Check for cheese win
                if (!showWinMessage) {
                    const cheesePos = gameStateRef.current.cheesePosition;
                    const charBodyRef = gameStateRef.current.charBody;
                    if (cheesePos && charBodyRef) {
                        const playerPos = bodyInterface.GetPosition(charBodyRef.GetID());
                        const playerVec = new THREE.Vector3(playerPos.GetX(), playerPos.GetY(), playerPos.GetZ());
                        const distance = playerVec.distanceTo(cheesePos);
                        if (distance < 1.5) {
                            setShowWinMessage(true);
                            setTimeout(() => navigate('/level-list'), 2000);
                        }
                    }
                }
            }

            // Object creation mutation
            const generateObject = initGenerateObject(Jolt, physicsSystem, scene);
            gameStateRef.current.generateObject = generateObject;
            const addObjectsButton = document.getElementById('add-objects');
            if (addObjectsButton) {
                const handleClick = () => generateObject();
                addObjectsButton.addEventListener('click', handleClick);
                cleanupFunctions.push(() => addObjectsButton.removeEventListener('click', handleClick));
            }

            renderLoop(clock, onExampleUpdate, renderer, scene, camera, joltInterface, dynamicObjects, Jolt, controls, {});
        }).catch((error) => console.error('Error initializing game:', error));

        return () => {
            isMounted = false;
            if (gameStateRef.current.effectDisposers) {
                gameStateRef.current.effectDisposers.forEach((dispose) => dispose());
            }
            cleanupFunctions.forEach(fn => fn());
            // Defensive websocket cleanup
            if (gameStateRef.current.wsClient) {
                try {
                    gameStateRef.current.wsClient.disconnect();
                } catch (e) {
                    console.error("WebSocket disconnect failed:", e)
                }
                gameStateRef.current.wsClient = null;
            }
            for (const id in penguinsRef.current) {
                if (penguinsRef.current[id] && penguinsRef.current[id].mesh && gameStateRef.current.scene) {
                    gameStateRef.current.scene.remove(penguinsRef.current[id].mesh);
                }
            }
            penguinsRef.current = {};
            // Defensive renderer cleanup
            const renderer = gameStateRef.current.renderer;
            if (renderer && typeof renderer.dispose === 'function') {
                try {
                    renderer.dispose();
                } catch (e) {
                    // Some renderers (like WebGPURenderer) might throw if not inited or something is null
                    // Swallow or log but do not crash
                    console.error("Renderer dispose error:", e);
                }
            }
            gameStateRef.current.renderer = null;
            gameStateRef.current.scene = null;
            gameStateRef.current.camera = null;
            gameStateRef.current.controls = null;
        };
    }, [game_id]);

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>
                <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>
                    Level {game_id}
                </h1>
                {/* People playing counter */}
                <div style={{
                    display: 'inline-block',
                    background: '#292a36',
                    color: '#ffd700',
                    fontWeight: '600',
                    fontSize: '1.03rem',
                    borderRadius: 7,
                    padding: '4px 15px',
                    marginBottom: '8px',
                    marginRight: '14px',
                    marginLeft: '8px',
                    letterSpacing: '0.5px',
                    border: '2px solid #ffd700',
                }}>
                    🐧 {playerCount} playing
                </div>
                <button onClick={() => setCanvas2Visible(v => !v)}>
                    {canvas2Visible ? "Hide" : "Show"} Canvas2
                </button>
                <GameVideoSeekBar />

                <button
                    style={{
                        marginLeft: 10,
                        background: annotationsPanelVisible ? '#ffd700' : '#353535',
                        color: annotationsPanelVisible ? '#111' : '#ffd700',
                        border: 'none',
                        borderRadius: 6,
                        padding: '7px 18px',
                        fontWeight: 'bold',
                        fontSize: "1.05rem",
                        cursor: 'pointer',
                        boxShadow: annotationsPanelVisible
                            ? '0 0 0 3px #ffd70055'
                            : '0 1px 3px #111'
                    }}
                    onClick={() => setAnnotationsPanelVisible(x => !x)}
                >
                    {annotationsPanelVisible ? "Hide" : "Show"} Annotations
                </button>
            </div>
            
            <div 
                ref={containerRef} 
                id="container" 
                style={{ width: '100%', height: '90vh', position: 'relative' }}
            >
                {/* Main Canvas Context */}
                <canvas 
                    ref={canvasRef} 
                    id="canvas" 
                    style={{ width: '500px', height: '400px', display: 'block' }} 
                />

                {/* Point Cloud Isolated Canvas Context in top-left of the first canvas */}
                {canvas2Visible && (
                    <canvas
                        ref={canvasRef2}
                        id="canvas2"
                        style={{
                            width: '250px',
                            height: '220px',
                            border: '6px dashed white',
                            position: 'absolute',
                            top: '12px',
                            left: '12px',
                            zIndex: 1010,
                            backgroundColor: 'rgba(0,0,0,0.42)'
                        }}
                    />
                )}
                {/* Count can be outside the overlayed canvas but visually related */}
                <p 
                    style={{ 
                        color: 'white', 
                        fontSize: '1rem', 
                        textAlign: 'left', 
                        marginTop: '10px', 
                        position: 'absolute', 
                        top: '242px', left: '18px', 
                        zIndex: 1012,
                        pointerEvents: 'none',
                        background: 'rgba(0,0,0,0.28)',
                        borderRadius: '6px',
                        padding: '4px 10px'
                    }}
                >
                    Point Cloud Count: {pointCloudCount} particles rendered
                </p>

                {/* Side panel for annotations */}
                <AnnotationsPanel
                    annotations={annotations}
                    visible={annotationsPanelVisible}
                    onClose={() => setAnnotationsPanelVisible(false)}
                />
            </div>

            <WASDControls inputState={inputStateRef.current} />
       
            {showWinMessage && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 10000, flexDirection: 'column'
                }}>
                    <div style={{
                        backgroundColor: '#1a1a1a', padding: '40px 60px', borderRadius: '16px',
                        border: '2px solid #ffd700', boxShadow: '0 0 30px rgba(255, 215, 0, 0.5)', textAlign: 'center'
                    }}>
                        <h2 style={{ color: '#ffd700', fontSize: '3rem', margin: '0 0 20px 0', textShadow: '0 0 20px rgba(255, 215, 0, 0.8)' }}>
                            🎉 Congratulations! 🎉
                        </h2>
                        <p style={{ color: '#fff', fontSize: '1.5rem', margin: 0 }}>You found the cheese!</p>
                        <p style={{ color: '#aaa', fontSize: '1rem', marginTop: '10px' }}>Returning to level select...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
