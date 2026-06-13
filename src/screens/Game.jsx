import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WASDControls from '../components/WASDControls';

//playgame

//import particles from './particles.ts';
//particles();

//import tsl_test from './tsl_test.ts';
///tsl_test();

import { loadGLTFModel } from "../utils/gltf-loader.js";
import { loadOBJModel } from "../utils/obj-loader.js";
import deskObjUrl from "../desk.obj?url";
import sittingPersonObjUrl from "../sitting_person.obj?url";
import { Clock } from "three";
import { initGraphics } from "../initGraphics.js";
import { onWindowResize as handleWindowResize } from "../onWindowResize.js";
import { initPhysics } from "../initPhysics.js";
import { renderLoop } from "../renderLoop.js";
import { setupExample } from "../setupExample.js";
import { handleUserInput } from "../utils/handleUserInput.js";
import initJolt from "../utils/jolt-physics.wasm-compat.js";
//import AudioVisualizer from "../utils/play_karaoke.js";
//import lyricDetector from './utils/lyricDetector.js';
import * as THREE from "three";
import editScene from "../utils/edit_scene.js";
//new AudioVisualizer();
//import tsl from 'three/tsl'
import { setupLighting } from "../lighting.js";
import { createBox } from "../createBox.js";
import { addToScene } from "../addToScene.js";
import { getThreeObjectForBody } from "../getThreeObjectForBody.js";

import initGenerateObject from "../mutateScene.ts";
import { SelectionSystem } from "../selectionSystem.js";
import { WebSocketClient } from "../utils/websocket.js";
import { createSoundWaveRings } from "../createSoundWaveRings.js";

// Function to load level data and create cuboids with Jolt physics
async function loadLevelCuboids(levelId, Jolt, bodyInterface, scene, dynamicObjects) {
    let cheesePosition = null;
    const effectUpdaters = [];
    const effectDisposers = [];
    try {
        // Dynamically import the level JSON file
        const levelModule = await import(`../levels/${levelId}.json`);
        const levelData = levelModule.default || levelModule;
        console.log('Loaded level data:', levelData);
        
        // Extract objects from the first item in the array
        if (levelData && levelData.length > 0 && levelData[0].objects) {
            const objects = levelData[0].objects;
            
            // Create red material for cuboids
            const redMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xff0000,
                metalness: 0.3,
                roughness: 0.7
            });
            
            // Create yellow material for cheese
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
            
            // Collision layer for static platforms (same as walls/floor)
            const LAYER_NON_MOVING = 0;
            
            // Create a physics-enabled object for each level entry
            for (let index = 0; index < objects.length; index++) {
                const obj = objects[index];

                if (obj.type === 'desk') {
                    const halfExtent = new Jolt.Vec3(
                        obj.size[0] / 2,
                        obj.size[1] / 2,
                        obj.size[2] / 2
                    );

                    const position = new Jolt.RVec3(
                        obj.position[0],
                        obj.position[1],
                        obj.position[2]
                    );

                    let rotation;
                    if (obj.rotation[0] === 0 && obj.rotation[1] === 0 && obj.rotation[2] === 0) {
                        rotation = Jolt.Quat.prototype.sIdentity();
                    } else {
                        const euler = new THREE.Euler(
                            obj.rotation[0],
                            obj.rotation[1],
                            obj.rotation[2],
                            'XYZ'
                        );
                        const quat = new THREE.Quaternion();
                        quat.setFromEuler(euler);
                        rotation = new Jolt.Quat(quat.x, quat.y, quat.z, quat.w);
                    }

                    createBox(
                        Jolt,
                        bodyInterface,
                        async (body) => {
                            const placeholder = addToScene(
                                body,
                                Jolt,
                                bodyInterface,
                                scene,
                                dynamicObjects,
                                getThreeObjectForBody
                            );

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
                                // Seat height in model is y=0.75; desk tabletop is at local y=size/2
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

                    console.log(`Created desk ${index + 1} at position:`, obj.position);
                    continue;
                }

                if (obj.type === 'cuboid' || obj.type === 'cheese') {
                    // Convert size to half-extent for Jolt (half of each dimension)
                    const halfExtent = new Jolt.Vec3(
                        obj.size[0] / 2,
                        obj.size[1] / 2,
                        obj.size[2] / 2
                    );
                    
                    // Create position vector
                    const position = new Jolt.RVec3(
                        obj.position[0],
                        obj.position[1],
                        obj.position[2]
                    );
                    
                    // Create rotation quaternion
                    // If rotation is [0,0,0], use identity, otherwise create from Euler
                    let rotation;
                    if (obj.rotation[0] === 0 && obj.rotation[1] === 0 && obj.rotation[2] === 0) {
                        rotation = Jolt.Quat.prototype.sIdentity();
                    } else {
                        // Convert Euler angles (in radians) to quaternion
                        // Using Three.js to help with conversion
                        const euler = new THREE.Euler(
                            obj.rotation[0],
                            obj.rotation[1],
                            obj.rotation[2],
                            'XYZ'
                        );
                        const quat = new THREE.Quaternion();
                        quat.setFromEuler(euler);
                        rotation = new Jolt.Quat(
                            quat.x,
                            quat.y,
                            quat.z,
                            quat.w
                        );
                    }
                    
                    // Choose material based on type
                    const material = obj.type === 'cheese' ? cheeseMaterial : redMaterial;
                    
                    // Store cheese position for win condition
                    if (obj.type === 'cheese') {
                        cheesePosition = new THREE.Vector3(
                            obj.position[0],
                            obj.position[1],
                            obj.position[2]
                        );
                    }
                    
                    // Create static physics body (so player can jump on it)
                    const cuboidBody = createBox(
                        Jolt,
                        bodyInterface,
                        (body) => addToScene(
                            body, 
                            Jolt, 
                            bodyInterface, 
                            scene, 
                            dynamicObjects, 
                            getThreeObjectForBody, 
                            material
                        ),
                        position,
                        rotation,
                        halfExtent,
                        Jolt.EMotionType_Static, // Static so it doesn't move
                        LAYER_NON_MOVING
                    );
                    
                    console.log(`Created physics ${obj.type} ${index + 1} at position:`, obj.position);
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
    const [showWinMessage, setShowWinMessage] = useState(false);
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
        cleanup: null
    });

    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return;

        const container = containerRef.current;
        const canvas = canvasRef.current;
        
        const size = { width: window.innerWidth * 0.9, height: window.innerHeight * 0.9 };
        
        // Initialize graphics
        const { renderer, scene, camera, controls } = initGraphics(
            canvas,
            container,
            size,
        );

        setupLighting(scene);

        const clock = new Clock();
        const onExampleUpdateRef = { fn: null };

        // Store in ref for cleanup
        gameStateRef.current.renderer = renderer;
        gameStateRef.current.scene = scene;
        gameStateRef.current.camera = camera;
        gameStateRef.current.controls = controls;
        gameStateRef.current.clock = clock;
        gameStateRef.current.inputState = inputStateRef.current;
        gameStateRef.current.onExampleUpdateRef = onExampleUpdateRef;

        let cleanupFunctions = [];
        let isMounted = true;

        // Set up window resize handler
        const handleResize = () => {
            if (!isMounted || !renderer || !camera) return;
            const newSize = { 
                width: window.innerWidth * 0.9, 
                height: window.innerHeight * 0.9 
            };
            handleWindowResize(newSize, camera, renderer);
        };
        window.addEventListener('resize', handleResize);
        cleanupFunctions.push(() => {
            window.removeEventListener('resize', handleResize);
        });

        initJolt().then(async (Jolt) => {
            // Check if component is still mounted
            if (!isMounted) return;

            await renderer.init();
            const { joltInterface, physicsSystem, bodyInterface } = initPhysics(Jolt);
            
            // Check again after async operations
            if (!isMounted) return;
            
            // Store physics objects
        gameStateRef.current.joltInterface = joltInterface;
        gameStateRef.current.physicsSystem = physicsSystem;
        gameStateRef.current.bodyInterface = bodyInterface;
        gameStateRef.current.Jolt = Jolt;

        // Collect dynamic objects in array
        const dynamicObjects = [];
        gameStateRef.current.dynamicObjects = dynamicObjects;

        // Set up WebSocket connection
        const wsUrl = `ws://localhost:3000`;
        const wsClient = new WebSocketClient(wsUrl);
        
        // Set up WebSocket event handlers
        wsClient.on('open', () => {
            console.log('WebSocket connected successfully');
        });
        
        wsClient.on('message', (data) => {
            console.log('WebSocket message received:', data);
            // Handle incoming messages here
        });
        
        wsClient.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
        
        wsClient.on('close', () => {
            console.log('WebSocket connection closed');
        });
        
        // Connect to WebSocket server
        wsClient.connect();
        gameStateRef.current.wsClient = wsClient;

        // Set up selection system for clicking on objects
        const selectionSystem = new SelectionSystem(scene, camera, canvas);
        gameStateRef.current.selectionSystem = selectionSystem;
        
        // Track mouse state to distinguish clicks from drags
        let mouseDownTime = 0;
        let mouseDownX = 0;
        let mouseDownY = 0;
        let hasMoved = false;
        let cameraPositionBefore = camera.position.clone();
        let cameraTargetBefore = controls.target.clone();
        
        // Track if we should allow selection (not dragging)
        let allowSelection = true;
        let mouseDownPos = null;
        
        const handlePointerDown = (event) => {
            if (event.button === 0) { // Left mouse button
                mouseDownPos = { x: event.clientX, y: event.clientY };
                allowSelection = true;
            }
        };
        
        const handlePointerMove = (event) => {
            if (mouseDownPos && event.buttons === 1) {
                const dx = Math.abs(event.clientX - mouseDownPos.x);
                const dy = Math.abs(event.clientY - mouseDownPos.y);
                if (dx > 5 || dy > 5) {
                    allowSelection = false; // User is dragging
                }
            }
        };
        
        const handlePointerUp = (event) => {
            if (event.button === 0 && allowSelection && mouseDownPos) {
                // Small delay to let OrbitControls finish
                setTimeout(() => {
                    selectionSystem.handleClick(event);
                }, 10);
            }
            mouseDownPos = null;
            allowSelection = true;
        };
        
        // Use pointer events for better compatibility
        canvas.addEventListener('pointerdown', handlePointerDown);
        canvas.addEventListener('pointermove', handlePointerMove);
        canvas.addEventListener('pointerup', handlePointerUp);
        cleanupFunctions.push(() => {
            canvas.removeEventListener('pointerdown', handlePointerDown);
            canvas.removeEventListener('pointermove', handlePointerMove);
            canvas.removeEventListener('pointerup', handlePointerUp);
            selectionSystem.dispose();
        });

            // Set up your environment, spawn character, define onExampleUpdate
            const charBody = setupExample(
                Jolt,
                bodyInterface,
                scene,
                dynamicObjects,
                onExampleUpdateRef,
                game_id
            );
            gameStateRef.current.charBody = charBody;
            //editScene(scene);

            // Load level data and create cuboids with physics
            let cheesePosition = null;
            loadLevelCuboids(
                game_id, 
                Jolt, 
                bodyInterface, 
                scene, 
                dynamicObjects
            ).then(({ cheesePosition: cheesePos, effectUpdaters, effectDisposers }) => {
                cheesePosition = cheesePos;
                gameStateRef.current.cheesePosition = cheesePos;
                gameStateRef.current.effectUpdaters = effectUpdaters;
                gameStateRef.current.effectDisposers = effectDisposers;
            }).catch((error) => {
                console.error('Error loading level cuboids:', error);
            });

            // Prepare user input
            handleUserInput(inputStateRef.current);

            // Provide a custom update function that calls the function from onExampleUpdateRef
            function onExampleUpdate(time, deltaTime) {
                // If setupExample assigned a function, call it
                if (onExampleUpdateRef.fn) {
                    onExampleUpdateRef.fn(time, deltaTime, inputStateRef.current);
                }

                const effectUpdaters = gameStateRef.current.effectUpdaters;
                if (effectUpdaters) {
                    for (const updateEffect of effectUpdaters) {
                        updateEffect(deltaTime);
                    }
                }
                
                // Check win condition if cheese exists in this level
                if (!showWinMessage) {
                    const cheesePos = gameStateRef.current.cheesePosition;
                    const charBodyRef = gameStateRef.current.charBody;
                    
                    if (cheesePos && charBodyRef) {
                        const playerPos = bodyInterface.GetPosition(charBodyRef.GetID());
                        const playerVec = new THREE.Vector3(
                            playerPos.GetX(),
                            playerPos.GetY(),
                            playerPos.GetZ()
                        );
                        
                        const distance = playerVec.distanceTo(cheesePos);
                        const winDistance = 1.5; // Win if within 1.5 units
                        
                        if (distance < winDistance) {
                            setShowWinMessage(true);
                            // Navigate back to level list after 2 seconds
                            setTimeout(() => {
                                navigate('/level-list');
                            }, 2000);
                        }
                    }
                }
            }

            const generateObject = initGenerateObject(Jolt, physicsSystem, scene);
            gameStateRef.current.generateObject = generateObject;

            // Add button event listener if it exists
            const addObjectsButton = document.getElementById('add-objects');
            if (addObjectsButton) {
                const handleClick = () => {
                    generateObject();
                };
                addObjectsButton.addEventListener('click', handleClick);
                cleanupFunctions.push(() => {
                    addObjectsButton.removeEventListener('click', handleClick);
                });
            }

            // Start render loop
            renderLoop(
                clock,
                onExampleUpdate,
                renderer,
                scene,
                camera,
                joltInterface,
                dynamicObjects,
                Jolt,
                controls,
                {},
            );
        }).catch((error) => {
            console.error('Error initializing game:', error);
        });

        // Cleanup on unmount
        return () => {
            isMounted = false;
            if (gameStateRef.current.effectDisposers) {
                gameStateRef.current.effectDisposers.forEach((dispose) => dispose());
            }
            cleanupFunctions.forEach(fn => fn());
            
            // Disconnect WebSocket
            if (gameStateRef.current.wsClient) {
                gameStateRef.current.wsClient.disconnect();
                gameStateRef.current.wsClient = null;
            }
            
            // Cleanup renderer if it exists
            const renderer = gameStateRef.current.renderer;
            if (renderer && typeof renderer.dispose === 'function') {
                try {
                    renderer.dispose();
                } catch (error) {
                    console.error('Error disposing renderer:', error);
                }
            }
            
            // Clear refs
            gameStateRef.current.renderer = null;
            gameStateRef.current.scene = null;
            gameStateRef.current.camera = null;
            gameStateRef.current.controls = null;
        };
    }, [game_id]); // Re-initialize if game_id changes

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ 
                marginBottom: '20px',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '10px'
            }}>
                <h1 style={{ 
                    margin: 0,
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: 'white'
                }}>
                    Level {game_id}
                </h1>
            </div>
            <div 
                ref={containerRef} 
                id="container"
                style={{ width: '50%', height: '90vh' }}
            >
                <canvas ref={canvasRef} id="canvas"></canvas>
            </div>
            <WASDControls inputState={inputStateRef.current} />
            
            {/* Congratulations Modal */}
            {showWinMessage && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    flexDirection: 'column'
                }}>
                    <div style={{
                        backgroundColor: '#1a1a1a',
                        padding: '40px 60px',
                        borderRadius: '16px',
                        border: '2px solid #ffd700',
                        boxShadow: '0 0 30px rgba(255, 215, 0, 0.5)',
                        textAlign: 'center'
                    }}>
                        <h2 style={{
                            color: '#ffd700',
                            fontSize: '3rem',
                            margin: '0 0 20px 0',
                            textShadow: '0 0 20px rgba(255, 215, 0, 0.8)'
                        }}>
                            🎉 Congratulations! 🎉
                        </h2>
                        <p style={{
                            color: '#fff',
                            fontSize: '1.5rem',
                            margin: 0
                        }}>
                            You found the cheese!
                        </p>
                        <p style={{
                            color: '#aaa',
                            fontSize: '1rem',
                            marginTop: '10px'
                        }}>
                            Returning to level select...
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

