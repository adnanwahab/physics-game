import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WASDControls from '../components/WASDControls';

import { loadGLTFModel } from "../utils/gltf-loader.js";
import { loadOBJModel } from "../utils/obj-loader.js";
import deskObjUrl from "../obj/desk.obj?url";
import sittingPersonObjUrl from "../obj/sitting_person.obj?url";
import { Clock } from "three";
import { initGraphics } from "../initGraphics.js";
import { onWindowResize as handleWindowResize } from "../onWindowResize.js";
import { initPhysics } from "../initPhysics.js";
import { renderLoop } from "../renderLoop.js";
import { setupExample } from "../setupExample.js";
import { handleUserInput } from "../utils/handleUserInput.js";
import initJolt from "../utils/jolt-physics.wasm-compat.js";
import * as THREE from "three";
import editScene from "../utils/edit_scene.js";
import { setupLighting } from "../lighting.js";
import { createBox } from "../utils/createBox.js";
import { addToScene } from "../utils/addToScene.js";
import { getThreeObjectForBody } from "../getThreeObjectForBody.js";
import initGenerateObject from "../mutateScene.ts";
import { SelectionSystem } from "../selectionSystem.js";
import { WebSocketClient } from "../utils/websocket.js";
import { createSoundWaveRings } from "../createSoundWaveRings.js";

// --- Multiplayer Penguin Helper ---
function createRemotePenguinMesh(color = 0x2299ff) {
    const geom = new THREE.SphereGeometry(0.6, 16, 12); // penguin-ish
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.1 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
}

function colorFromId(id) {
    // Deterministic color from string/id (not perfect, but fine for demo/multipenguin)
    if (typeof id !== 'string') return 0x2299ff;
    const hash = [...id].reduce((h, ch) => h * 31 + ch.charCodeAt(0), 7);
    return (0x222222 | ((hash & 0xFFFFFF) >>> 0));
}

function GameVideoSeekBar() {
    const [value, setValue] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
      if (isPlaying) {
        intervalRef.current = setInterval(() => {
          setValue(prev => {
            if (prev < 100) {
              return prev + 1;
            } else {
              setIsPlaying(false);
              return 0;
            }
          });
        }, 50);
      } else if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, [isPlaying]);

    const handlePlayClick = () => {
      if (!isPlaying) {
        setIsPlaying(true);
      }
    };

    return (
      <div style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 1000 }}>
        <button onClick={handlePlayClick}>Play</button>
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={e => setValue(Number(e.target.value))}
        />
      </div>
    )
}

async function loadLevelCuboids(levelId, Jolt, bodyInterface, scene, dynamicObjects) {
    let cheesePosition = null;
    const effectUpdaters = [];
    const effectDisposers = [];
    try {
        const levelModule = await import(`../levels/${levelId}.json`);
        const levelData = levelModule.default || levelModule;
        if (levelData && levelData.length > 0 && levelData[0].objects) {
            const objects = levelData[0].objects;

            const redMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xff0000,
                metalness: 0.3,
                roughness: 0.7
            });
            
            const cheeseMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xffd700,
                metalness: 0.5,
                roughness: 0.3,
                emissive: 0xffaa00,
                emissiveIntensity: 0.3
            });

            const deskMaterial = new THREE.MeshStandardMaterial({
                color: 0x8b4513,
                metalness: 0.1,
                roughness: 0.8
            });

            const personMaterial = new THREE.MeshStandardMaterial({
                color: 0x4a6fa5,
                metalness: 0.1,
                roughness: 0.7
            });
            
            const LAYER_NON_MOVING = 0;
            
            for (let index = 0; index < objects.length; index++) {
                const obj = objects[index];

                if (obj.type === 'desk') {
                    const halfExtent = new Jolt.Vec3(obj.size[0] / 2, obj.size[1] / 2, obj.size[2] / 2);
                    const position = new Jolt.RVec3(obj.position[0], obj.position[1], obj.position[2]);

                    let rotation;
                    if (obj.rotation[0] === 0 && obj.rotation[1] === 0 && obj.rotation[2] === 0) {
                        rotation = Jolt.Quat.prototype.sIdentity();
                    } else {
                        const euler = new THREE.Euler(obj.rotation[0], obj.rotation[1], obj.rotation[2], 'XYZ');
                        const quat = new THREE.Quaternion();
                        quat.setFromEuler(euler);
                        rotation = new Jolt.Quat(quat.x, quat.y, quat.z, quat.w);
                    }

                    createBox(
                        Jolt,
                        bodyInterface,
                        async (body) => {
                            const placeholder = addToScene(body, Jolt, bodyInterface, scene, dynamicObjects, getThreeObjectForBody);

                            try {
                                const desk = await loadOBJModel(deskObjUrl);
                                desk.traverse((child) => {
                                    if (child.isMesh) {
                                        child.material = deskMaterial;
                                        child.geometry.translate(0, -obj.size[1] / 2, 0);
                                    }
                                });

                                desk.position.copy(placeholder.position);
                                desk.quaternion.copy(placeholder.quaternion);
                                desk.userData.body = body;

                                scene.remove(placeholder);
                                const placeholderIndex = dynamicObjects.indexOf(placeholder);
                                if (placeholderIndex > -1) {
                                    dynamicObjects[placeholderIndex] = desk;
                                }
                                const soundWaves = createSoundWaveRings({
                                    position: new THREE.Vector3(0, obj.size[1] / 2 + 0.02, 0),
                                    maxRadius: 3.5,
                                    speed: 1.5,
                                });
                                desk.add(soundWaves.group);
                                effectUpdaters.push(soundWaves.update);
                                effectDisposers.push(soundWaves.dispose);

                                const person = await loadOBJModel(sittingPersonObjUrl);
                                person.traverse((child) => {
                                    if (child.isMesh) {
                                        child.material = personMaterial;
                                    }
                                });
                                person.position.set(0, obj.size[1] / 2 - 0.75, -0.15);
                                desk.add(person);

                                scene.add(desk);
                            } catch (error) {
                                console.error('Error loading desk model:', error);
                            }
                        },
                        position,
                        rotation,
                        halfExtent,
                        Jolt.EMotionType_Static,
                        LAYER_NON_MOVING
                    );
                    continue;
                }

                if (obj.type === 'cuboid' || obj.type === 'cheese') {
                    const halfExtent = new Jolt.Vec3(obj.size[0] / 2, obj.size[1] / 2, obj.size[2] / 2);
                    const position = new Jolt.RVec3(obj.position[0], obj.position[1], obj.position[2]);
                    
                    let rotation;
                    if (obj.rotation[0] === 0 && obj.rotation[1] === 0 && obj.rotation[2] === 0) {
                        rotation = Jolt.Quat.prototype.sIdentity();
                    } else {
                        const euler = new THREE.Euler(obj.rotation[0], obj.rotation[1], obj.rotation[2], 'XYZ');
                        const quat = new THREE.Quaternion();
                        quat.setFromEuler(euler);
                        rotation = new Jolt.Quat(quat.x, quat.y, quat.z, quat.w);
                    }
                    
                    const material = obj.type === 'cheese' ? cheeseMaterial : redMaterial;
                    
                    if (obj.type === 'cheese') {
                        cheesePosition = new THREE.Vector3(obj.position[0], obj.position[1], obj.position[2]);
                    }
                    
                    createBox(
                        Jolt,
                        bodyInterface,
                        (body) => addToScene(body, Jolt, bodyInterface, scene, dynamicObjects, getThreeObjectForBody, material),
                        position,
                        rotation,
                        halfExtent,
                        Jolt.EMotionType_Static,
                        LAYER_NON_MOVING
                    );
                }
            }
        }
    } catch (error) {
        console.error('Error loading level cuboids:', error);
    }
    
    return { cheesePosition, effectUpdaters, effectDisposers };
}

export default function Game() {
    const { game_id } = useParams();
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const canvasRef2 = useRef(null);
    const [showWinMessage, setShowWinMessage] = useState(false);

    // Used to force re-render of penguin list if ever needed
    const [, setRemotePenguinsTick] = useState(0);

    // Multiplayer penguin references
    const penguinsRef = useRef({}); // { [id]: { mesh: THREE.Mesh, color: string } }
    const myPlayerIdRef = useRef(null);

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

        // === Canvas2 code (not related to penguins, unchanged) ===
        const rect2 = canvas2.getBoundingClientRect();
        const renderer2 = new THREE.WebGLRenderer({ canvas: canvas2, alpha: true, antialias: true });
        renderer2.setSize(rect2.width, rect2.height, false);
        renderer2.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        const scene2 = new THREE.Scene();
        const camera2 = new THREE.PerspectiveCamera(45, rect2.width / rect2.height, 0.1, 100);
        camera2.position.z = 30;
        const particleCount = 10000;
        const geometry2 = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = Math.random() * 10;
            positions[i + 1] = Math.random() * 10;
            positions[i + 2] = Math.random() * 10;
        }
        geometry2.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material2 = new THREE.PointsMaterial({
            color: new THREE.Color('blue'),
            size: 0.25,
            opacity: 0.1
        });
        const pointCloud = new THREE.Points(geometry2, material2);
        scene2.add(pointCloud);
        let canvas2AnimationFrameId;
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

            await renderer.init();
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
            const wsUrl = `ws://localhost:3000?room=${encodeURIComponent(game_id)}`;
            const wsClient = new WebSocketClient(wsUrl);
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
            });

            // Clean-up multiplayer penguin meshes on dismount
            cleanupFunctions.push(() => {
                Object.values(penguinsRef.current).forEach(({ mesh }) => scene.remove(mesh));
                penguinsRef.current = {};
            });

            // === End Multiplayer Setup ===

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
            if (gameStateRef.current.wsClient) {
                gameStateRef.current.wsClient.disconnect();
                gameStateRef.current.wsClient = null;
            }
            for (const id in penguinsRef.current) {
                if (penguinsRef.current[id] && penguinsRef.current[id].mesh && gameStateRef.current.scene) {
                    gameStateRef.current.scene.remove(penguinsRef.current[id].mesh);
                }
            }
            penguinsRef.current = {};
            const renderer = gameStateRef.current.renderer;
            if (renderer && typeof renderer.dispose === 'function') {
                try { renderer.dispose(); } catch (e) { console.error(e); }
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
            </div>
            
            <div ref={containerRef} id="container" style={{ width: '100%', height: '90vh', position: 'relative' }}>
                {/* Main Canvas Context */}
                <canvas ref={canvasRef} id="canvas" style={{ width: '50%', height: '100%' }}></canvas>
                
                {/* Point Cloud Isolated Canvas Context */}
                <canvas
                    ref={canvasRef2}
                    id="canvas2"
                    style={{
                        display: 'none',
                        width: '45%',
                        height: '100%',
                        border: '10px dashed white',
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        zIndex: 1000,
                        backgroundColor: 'rgba(0,0,0,0.4)'
                    }}
                />
            </div>
            
            <WASDControls inputState={inputStateRef.current} />
            <GameVideoSeekBar />
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
