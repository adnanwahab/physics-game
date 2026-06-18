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
//import {GameVideoSeekBar} from "../components/GameVideoSeekBar"

const players = []


// Fetch all players from server and log them



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

    // Move to top-right: set position absolute, top 15px, right 24px, high z-index
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 14 }}>
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

                    console.log('players', players)
                }
            }
        }
    } catch (error) {
        console.error('Error loading level cuboids:', error);
    }

    return { cheesePosition, effectUpdaters, effectDisposers };
}

// --- Annotations SidePanel ---
function AnnotationsPanel({ annotations, visible, onClose }) {
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                right: visible ? 0 : '-360px',
                height: '100vh',
                width: '340px',
                background: 'rgba(24,24,27,0.95)',
                color: '#fff',
                boxShadow: '0 0 14px rgba(0,0,0,0.17)',
                borderLeft: '2px solid #ffd700',
                zIndex: 10020,
                padding: '26px 28px 20px 26px',
                transition: 'right 0.33s cubic-bezier(0.44, 1.1, 0.78, 1)',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{
                    margin: 0,
                    color: '#ffd700',
                    fontSize: '1.45rem',
                    fontWeight: '700',
                    flexGrow: 1,
                    letterSpacing: '1px'
                }}>Annotations</h3>
                <button
                    aria-label="Hide Annotations"
                    style={{
                        border: 0,
                        background: 'transparent',
                        color: '#ffd700',
                        fontWeight: 'bold',
                        fontSize: '1.25rem',
                        marginLeft: '8px',
                        cursor: 'pointer',
                        outline: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        transition: 'background 0.13s'
                    }}
                    onClick={onClose}
                    onMouseOver={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                >×</button>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: '1rem' }}>
                {annotations.length === 0 && (
                    <li style={{ color: '#bbb', marginTop: 12 }}>No annotations for this level yet.</li>
                )}
                {annotations.map((note, idx) => (
                    <li key={idx} style={{
                        marginBottom: '18px',
                        padding: '14px 12px 10px 16px',
                        background: 'rgba(33, 33, 36, 0.78)',
                        borderLeft: `4px solid ${note.color || '#ffd700'}`,
                        borderRadius: '7px'
                    }}>
                        <div style={{ fontSize: '1.02rem', fontWeight: '600', color: note.color || '#ffd700' }}>
                            {note.title}
                        </div>
                        {note.location &&
                            <div style={{ fontSize: '0.95rem', color: '#ccc', marginBottom: 3 }}>
                                ({note.location.x}, {note.location.y}, {note.location.z})
                            </div>
                        }
                        <div style={{ color: '#fff', margin: 0, fontSize: '0.96rem' }}>
                            {note.text}
                        </div>
                    </li>
                ))}
            </ul>
            {/* <button>sbit</button> */}
        </div>
    );
}

export default function Game() {
    // On mount, increment a counter on the server (by POST request) and set playerCount to the returned value
    useEffect(() => {
        // Helper function to increment and fetch current counter from server
        async function incrementAndFetchCounter() {

            try {
                const resp = await fetch('/newPlayer', {
                    method: 'POST'
                });
                if (resp.ok) {
                    const data = await resp.json();
                    // Server should return: { count: number }
                    setPlayerCount(data.count);
                    window.addEventListener('keydown', function () {
                    // INSERT_YOUR_CODE

                    // Fetch players from server and render them on the canvas.
                    // This code assumes you have access to the canvas context and rendering setup elsewhere.
                    // We'll fetch periodically, and update a local state with all player positions except yourself.

                    // We'll track other players to render
                    const [otherPlayers, setOtherPlayers] = useState([]);

                    useEffect(() => {
                        let intervalId = null;
                        async function fetchPlayers() {
                            try {
                                const resp = await fetch('/getPlayers');
                                if (resp.ok) {
                                    const players = await resp.json();
                                    //console.log(players)
                                    // Optionally filter out self if you have an id
                                    // setOtherPlayers(players.filter(p => p.id !== myId));
                                    setOtherPlayers(players);
                                }
                            } catch (e) {
                                // Ignore error, swallow
                            }
                        }
                        // Polling every 1s
                        fetchPlayers();
                        intervalId = setInterval(fetchPlayers, 1000);

                        return () => {
                            if (intervalId) clearInterval(intervalId);
                        };
                    }, []);

                    // Render the players (basic)
                    useEffect(() => {
                        if (!canvasRef.current) return;
                        const ctx = canvasRef.current.getContext('2d');
                        if (!ctx) return;
                        // You may want to clear only the area where penguins are drawn, or redraw entire canvas
                        // Here, example: clear and redraw all players each frame
                        function renderPenguins() {
                            // Clear only, assuming canvasRef covers the main area
                            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                            // Draw each player as a penguin or circle
                            for (const player of otherPlayers) {
                                // INSERT_YOUR_CODE
                                
                                // Remove previously rendered penguin objects (if any)
                                if (!window._otherPlayerMeshMap) window._otherPlayerMeshMap = {};
                                const meshMap = window._otherPlayerMeshMap;
                                for (const id in meshMap) {
                                    if (!otherPlayers.find(p => p.id === id)) {
                                        scene.remove(meshMap[id]);
                                        delete meshMap[id];
                                    }
                                }

                                for (const player of otherPlayers) {
                                    if (!player || player.id == null) continue;
                                    // If this player mesh doesn't exist, create and add to scene
                                    if (!meshMap[player.id]) {
                                        const geometry = new THREE.SphereGeometry(0.3, 28, 28);
                                        const material = new THREE.MeshStandardMaterial({ color: '#3c79d8' });
                                        const mesh = new THREE.Mesh(geometry, material);

                                        // Penguin face (white oval)
                                        const faceGeometry = new THREE.SphereGeometry(0.18, 16, 16);
                                        const faceMaterial = new THREE.MeshStandardMaterial({ color: 'white' });
                                        const face = new THREE.Mesh(faceGeometry, faceMaterial);
                                        face.position.set(0, 0.07, 0.26);
                                        mesh.add(face);

                                        // Eyes
                                        const eyeGeometry = new THREE.SphereGeometry(0.032, 8, 8);
                                        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 'black' });
                                        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
                                        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
                                        leftEye.position.set(-0.045, 0.11, 0.33);
                                        rightEye.position.set(0.045, 0.11, 0.33);
                                        mesh.add(leftEye);
                                        mesh.add(rightEye);

                                        // Nose (beak)
                                        const noseGeometry = new THREE.ConeGeometry(0.03, 0.10, 8);
                                        const noseMaterial = new THREE.MeshStandardMaterial({ color: '#ffc800' });
                                        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
                                        nose.position.set(0, 0.06, 0.40);
                                        nose.rotation.x = Math.PI / 2;
                                        mesh.add(nose);

                                        mesh.castShadow = true;
                                        mesh.receiveShadow = true;
                                        scene.add(mesh);

                                        meshMap[player.id] = mesh;
                                    }
                                    // Update the position (and orientation, if available)
                                    const mesh = meshMap[player.id];
                                    mesh.position.set(player.x || 0, player.y || 0, player.z || 0);
                                    if (player.quaternion) {
                                        mesh.quaternion.set(
                                            player.quaternion.x,
                                            player.quaternion.y,
                                            player.quaternion.z,
                                            player.quaternion.w
                                        );
                                    }
                                }
     
                                // You need to map player.x/y/z to canvas coordinates
                                // For now, assume direct mapping (adapt as needed)
                                // const x = player.x * 10 + ctx.canvas.width / 2; // adjust scaling as needed
                                // const y = player.z * 10 + ctx.canvas.height / 2;
                                // ctx.save();
                                // ctx.beginPath();
                                // ctx.arc(x, y, 15, 0, 2 * Math.PI);
                                // ctx.fillStyle = '#3c79d8'; // Penguin blue
                                // ctx.fill();
                                // ctx.strokeStyle = 'white';
                                // ctx.lineWidth = 3;
                                // ctx.stroke();
                                // // Penguin face/eyes
                                // ctx.beginPath();
                                // ctx.arc(x - 4, y - 3, 2, 0, 2 * Math.PI);
                                // ctx.arc(x + 4, y - 3, 2, 0, 2 * Math.PI);
                                // ctx.fillStyle = 'white';
                                // ctx.fill();
                                // ctx.restore();
                            }
                        }
                        renderPenguins();
                    }, [otherPlayers, canvasRef.current]);
     
                    })
                } else {
                    // fallback: if server fails, set playerCount to 1
                    setPlayerCount(1);
                }
            } catch (e) {
                setPlayerCount(1);
            }
        }
        incrementAndFetchCounter();

        // Add a player to the server on mount
        async function addPlayerToServer() {
            try {
                // Example player data; extend as needed
                const playerData = { x: 0, y: 0, z: 0 };
                const resp = await fetch('/newPlayer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(playerData)
                });
                // Optionally, handle response here if needed
                if (resp.ok) {
                    const data = await resp.json();
                    // e.g. setMyPlayerId(data.id) or similar
                    console.log('is ok')
                }
            } catch (e) {
                console.log('exception', e)

                // Optional: handle error
            }
        }
        addPlayerToServer();

    }, []);



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
                // if (!showWinMessage) {
                //     const cheesePos = gameStateRef.current.cheesePosition;
                //     const charBodyRef = gameStateRef.current.charBody;
                //     if (cheesePos && charBodyRef) {
                //         const playerPos = bodyInterface.GetPosition(charBodyRef.GetID());
                //         const playerVec = new THREE.Vector3(playerPos.GetX(), playerPos.GetY(), playerPos.GetZ());
                //         const distance = playerVec.distanceTo(cheesePos);
                //         if (distance < 1.5) {
                //             setShowWinMessage(true);
                //             setTimeout(() => navigate('/level-list'), 2000);
                //         }
                //     }
                // }
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
                    // console.error("Renderer dispose error:", e);
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
