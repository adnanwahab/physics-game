// src/App.jsx
import { Routes, Route, Link, useParams } from "react-router-dom";
import React, { useRef, useEffect } from "react";
import * as THREE from "three"; // 1. Import Three.js

import Game from "./components/Game";
import LevelList from "./screens/LevelList";
import Settings from "./screens/Settings";
import Game_Editor from "./components/Game_Editor";
import Cube from "./components/Cube";
import { LogViewer } from "./components/LogViewer";

import {
  CSS3DRenderer,
  CSS3DObject,
} from "three/addons/renderers/CSS3DRenderer.js";
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// 2. Fixed: Explicitly return the JSON data
async function getLogs(game_id) {
  const levelModule = await import(`./logs/${game_id}.json`);
  return levelModule.default;
}

// Helper to generate simple placeholder meshes based on type
const createPlaceholder = (type, size = [1, 1, 1]) => {
  let geometry;
  let material;
  const [w, h, d] = size;

  switch (type) {
    case "desk":
      geometry = new THREE.BoxGeometry(w, h, d);
      material = new THREE.MeshStandardMaterial({ color: 0x8b5a2b }); // Brown
      break;
    case "sensor":
      geometry = new THREE.SphereGeometry(0.2, 16, 16);
      material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Glowing Green
      break;
    case "couch":
      geometry = new THREE.BoxGeometry(2, 0.75, 0.9); // Default box for couch
      material = new THREE.MeshStandardMaterial({ color: 0x336699 }); // Blue
      break;
    default:
      geometry = new THREE.BoxGeometry(w, h, d);
      material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
  }

  return new THREE.Mesh(geometry, material);
};

// 3. Implemented: Build the Scene Graph from your JSON
function renderWorld(data, canvas, cssContainer) {
  if (!data || !data[0] || !canvas) return;

  const levelData = data[0];
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  // Setup Scene, Camera, Renderer
  const scene = new THREE.Scene();
  const CSSscene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a1a); // Dark background

  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  // Default camera position looking down at the stage
  //camera.position.set(0, 5, 7);
  //camera.lookAt(0, 0, 2);

  const testBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    new THREE.MeshBasicMaterial({ color: 0xff0000 }),
  );
  testBox.position.set(0, 0.25, 0); // Sits right in the center
  scene.add(testBox);

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(width, height, false);

  const cssObject = new CSS3DObject(cssContainer);
  cssObject.position.set(2, 0, 0);
  cssObject.scale.set(0.02, 0.02, 0.02); // CSS elements use pixel units, scale down to match WebGL units
  CSSscene.add(cssObject);

  const cssRenderer = new CSS3DRenderer();
  cssRenderer.setSize(window.innerWidth, window.innerHeight);
  cssRenderer.domElement.style.position = "absolute";
  cssRenderer.domElement.style.top = 0;
  // Add Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  // Parse and build objects into the Scene Graph
  if (levelData.objects) {
    levelData.objects.forEach((obj) => {
      const mesh = createPlaceholder(obj.type, obj.size);

      if (obj.position) {
        mesh.position.set(...obj.position);
      }
      if (obj.rotation) {
        // Converting degrees to radians
        mesh.rotation.set(
          THREE.MathUtils.degToRad(obj.rotation[0] || 0),
          THREE.MathUtils.degToRad(obj.rotation[1] || 0),
          THREE.MathUtils.degToRad(obj.rotation[2] || 0),
        );
      }

      scene.add(mesh); // Injected into the scene graph!
    });
  }

  // Handle optional camera rotation overrides from JSON
  if (levelData.camera && levelData.camera.rotation) {
    camera.rotation.set(
      THREE.MathUtils.degToRad(levelData.camera.rotation[0] || 0),
      THREE.MathUtils.degToRad(levelData.camera.rotation[1] || 0),
      THREE.MathUtils.degToRad(levelData.camera.rotation[2] || 0),
    );
  }

  // Animation loop
  let animationFrameId;
  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    renderer.render(scene, camera);
    cssRenderer.render(CSSscene, camera);
  };
  animate();

  // Return a cleanup callback to prevent memory leaks when navigating away
  return () => {
    cancelAnimationFrame(animationFrameId);
    renderer.dispose();
  };
}

function Debugging() {
  const { game_id } = useParams();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // 4. Fixed: Wrapped async operations in useEffect to safely control execution
  useEffect(() => {
    let cleanUpThreeScene;

    getLogs(game_id).then((data) => {
      console.log("uhoh", data);
      if (canvasRef.current) {
        cleanUpThreeScene = renderWorld(
          data,
          canvasRef.current,
          containerRef.current,
        );
      }
    });

    return () => {
      if (cleanUpThreeScene) cleanUpThreeScene();
    };
  }, [game_id]);

  return (
    <>
      <div
        ref={containerRef}
        style={{ width: "100vw", height: "100vh", position: "relative" }}
      />
      <canvas
        ref={canvasRef}
        id="canvas"
        className="
          block w-full h-full
          max-h-[200px] sm:max-h-[240px] md:max-h-[380px] lg:max-h-[80vh]
          aspect-video border-s-stone-100 border border-2
        "
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </>
  );
}

function App() {
  return (
    <div className="pt-2 ">
      <div className="fixed top-0 left-0 w-full text-center py-4 z-50 backdrop-blur-sm">
        <p
          style={{
            display: "inline-block",
            animation: "rainbow 2s linear infinite",
            background:
              "-webkit-linear-gradient(left, red, orange, yellow, green, cyan, blue, violet, red)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          <a
            href="https://physics-game-five.vercel.app/"
            className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500 animate-[rainbow_2s_linear_infinite]"
          >
            Happy Bear Landia
          </a>
        </p>
      </div>
      <div className="w-full h-[80vh] flex flex-col items-center justify-center relative overflow-hidden">
        <Routes>
          <Route path="/" element={<LevelList />} />
          <Route path="/level-list" element={<LevelList />} />
          <Route path="/game/:game_id" element={<Game />} />
          <Route path="/view/:game_id" element={<LogViewer />} />
          <Route path="/edit/:game_id" element={<Game_Editor />} />
          <Route path="/cube" element={<Cube />} />
          <Route path="/debug/:game_id" element={<Debugging />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
