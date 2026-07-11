// src/App.jsx
import { Routes, Route, Link, useParams } from "react-router-dom";
import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three"; // 1. Import Three.js

import Game from "./components/Game";
import LevelList from "./screens/LevelList";
import Settings from "./screens/Settings";
import Game_Editor from "./components/Game_Editor";
import Cube from "./components/Cube";
import LogViewer from "./components/LogViewer";

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

const DEUS_EX_DATA = {
  game: "Deus Ex",
  year: 2000,
  scene: "The Future of Augmentation",
  location: "UNATCO HQ - Medical Level Breakroom",
  characters: {
    alex_jacobson: {
      name: "Alex Jacobson",
      color: "#38bdf8", // Cyan
      avatar: "📡",
    },
    jaime_reyes: {
      name: "Dr. Jaime Reyes",
      color: "#34d399", // Emerald
      avatar: "🥼",
    },
  },
  steps: {
    1: {
      speaker: "alex_jacobson",
      text: "Jaime, you have to look at the telemetry data from JC's last run. The nano-constructs are adapting to his neural pathways twice as fast as the initial models predicted.",
      choices: [
        {
          text: "[Agree with Alex] 'It's revolutionary technology, Doc. You can't deny the results.'",
          leadsTo: 2,
        },
        {
          text: "[Side with Jaime] 'Alex is missing the point. Rapid adaptation could mean rapid instability.'",
          leadsTo: 3,
        },
        {
          text: "[Deflect] 'As long as the augs keep me alive in the field, I don't care how fast they adapt.'",
          leadsTo: 4,
        },
      ],
    },
    2: {
      speaker: "jaime_reyes",
      text: "I've seen it, Alex. It's impressive, yes, but it worries me. We are rewriting human biology on the fly here.",
      choices: [
        {
          text: "[Argue optimization] 'Rewriting? Come on, we're optimizing! Nano-tech is clean compared to old mech-augs.'",
          leadsTo: 5,
        },
        {
          text: "[Validate his caution] 'You're right to be cautious, Jaime. What are the long-term biological risks?'",
          leadsTo: 6,
        },
      ],
    },
    3: {
      speaker: "alex_jacobson",
      text: "Instability? Look at the graphs! The error rates are practically zero. You're treating a masterpiece of engineering like a localized infection.",
      choices: [
        {
          text: "[De-escalate] 'Engineering is one thing, Alex. Human tissue is another.'",
          leadsTo: 5,
        },
        {
          text: "[Press Alex on safety] 'And what happens when those error rates spike out in the field?'",
          leadsTo: 7,
        },
      ],
    },
    4: {
      speaker: "jaime_reyes",
      text: "Spoken like a true field agent. But survival today doesn't guarantee your body won't reject its own nervous system tomorrow.",
      choices: [
        {
          text: "[Ask about side effects] 'What kind of side effects are we talking about, Jaime?'",
          leadsTo: 6,
        },
      ],
    },
    5: {
      speaker: "jaime_reyes",
      text: "Clean? Tell that to the cell cultures. If those nanites misinterpret a signal from the hypothalamus, they could trigger a massive autoimmune response. We don't even have a proper kill-switch if the system goes rogue.",
      choices: [
        {
          text: "[Reassure via software] 'That's what the infolink monitoring is for. My system flags spikes before symptoms show.'",
          leadsTo: 8,
        },
        {
          text: "[Express concern over the kill-switch] 'Wait, UNATCO doesn't have a kill-switch for these augs?'",
          leadsTo: 9,
        },
      ],
    },
    6: {
      speaker: "alex_jacobson",
      text: "The risks are calculated, Jaime! We've simulated decades of wear and tear. JC's body treats the nanites like synthetic platelets, not a foreign threat.",
      choices: [
        {
          text: "[Challenge the simulation] 'Simulations can't account for every environmental variable, Alex.'",
          leadsTo: 7,
        },
      ],
    },
    7: {
      speaker: "jaime_reyes",
      text: "Exactly. A cellular glitch under extreme stress could lead to organ failure in minutes. That's a massive design flaw.",
      choices: [
        {
          text: "[Pivot to monitoring solution] 'Which is why we keep a real-time data link open during missions.'",
          leadsTo: 8,
        },
      ],
    },
    8: {
      speaker: "jaime_reyes",
      text: "Maybe so. But in the 20th century, a doctor could look a patient in the eye and know what was wrong. Now I'm looking at a monitor, trying to figure out if a man's fever is caused by a virus or a software glitch.",
      choices: [
        {
          text: "[Dismiss the nostalgia] 'Just trust the data, Jaime. The tech works.'",
          leadsTo: 10,
        },
        {
          text: "[Empathize with the human element] 'It must be frustrating to feel replaced by an algorithm.'",
          leadsTo: 11,
        },
      ],
    },
    9: {
      speaker: "alex_jacobson",
      text: "Well... legally, we aren't allowed to build an internal biological override. But theoretically, a high-frequency EMP or a specific mainframe virus could lock the system down. Not that we'd ever need to.",
      choices: [
        {
          text: "[Note the vulnerability] 'Good to know. Let's hope nobody else figures out that frequency.'",
          leadsTo: 8,
        },
      ],
    },
    10: {
      speaker: "jaime_reyes",
      text: "The data tells me what the machine is doing, Alex. It doesn't tell me what it's doing to the soul of the man inside it.",
      choices: [], // Terminal node
    },
    11: {
      speaker: "jaime_reyes",
      text: "It's not about my ego, JC. It's about humanity losing its baseline. When the machine becomes part of you, you start looking at the rest of the world like it's obsolete.",
      choices: [], // Terminal node
    },
  },
};

export function DeusExSimulator() {
  const [currentStepId, setCurrentStepId] = useState(1);
  const [history, setHistory] = useState([]);

  const currentStep = DEUS_EX_DATA.steps[currentStepId];
  const currentSpeaker = DEUS_EX_DATA.characters[currentStep.speaker];

  const handleChoiceClick = (leadsTo, choiceText) => {
    // Save current state to history array for back-tracking capabilities
    setHistory([
      ...history,
      { stepId: currentStepId, selectedChoice: choiceText },
    ]);
    setCurrentStepId(leadsTo);
  };

  const handleReset = () => {
    setCurrentStepId(1);
    setHistory([]);
  };

  const handleBack = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setCurrentStepId(previous.stepId);
    setHistory(history.slice(0, -1));
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-950 border border-amber-500/40 rounded-lg p-6 font-mono text-amber-200/90 shadow-2xl shadow-amber-950/20">
      {/* Header Meta */}
      <div className="flex justify-between items-center border-b border-amber-500/20 pb-3 mb-6 text-xs text-amber-500/60 uppercase tracking-widest">
        <div>{DEUS_EX_DATA.game} // CONV_TREE_SUBROUTINE</div>
        <div>LOC: {DEUS_EX_DATA.location}</div>
      </div>

      {/* Main Screen Display */}
      <div className="min-h-[200px] bg-black/40 border border-amber-500/10 rounded p-4 mb-6 relative overflow-hidden">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none" />

        {/* Dynamic Speaker Tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">{currentSpeaker.avatar}</span>
          <span
            className="font-bold uppercase tracking-wider text-sm"
            style={{ color: currentSpeaker.color }}
          >
            {currentSpeaker.name}:
          </span>
        </div>

        {/* Speaker Text */}
        <p className="text-lg leading-relaxed text-amber-100 selection:bg-amber-500 selection:text-black">
          "{currentStep.text}"
        </p>
      </div>

      {/* Choice Interface */}
      <div className="space-y-3">
        <div className="text-xs text-amber-500/50 uppercase tracking-wider mb-1">
          {currentStep.choices.length > 0
            ? "Select Response Intercept:"
            : "Dialogue Subroutine Concluded"}
        </div>

        {currentStep.choices.length > 0 ? (
          currentStep.choices.map((choice, idx) => (
            <button
              key={idx}
              onClick={() => handleChoiceClick(choice.leadsTo, choice.text)}
              className="w-full text-left p-3 rounded border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/15 hover:border-amber-500/60 text-sm transition-all duration-150 group flex items-start gap-3"
            >
              <span className="text-amber-500/40 group-hover:text-amber-500 font-bold">
                0{idx + 1}.
              </span>
              <span className="group-hover:text-amber-100">{choice.text}</span>
            </button>
          ))
        ) : (
          <div className="p-4 bg-red-950/20 border border-red-500/30 rounded text-center text-red-400 text-sm">
            [TRANSMISSION ENDED] You have reached a terminal logical node.
          </div>
        )}
      </div>

      {/* Control Utility Footer */}
      <div className="flex justify-between items-center mt-8 pt-4 border-t border-amber-500/10 text-xs">
        <button
          onClick={handleBack}
          disabled={history.length === 0}
          className={`px-3 py-1 rounded transition-colors ${
            history.length === 0
              ? "text-amber-500/20 cursor-not-allowed"
              : "text-amber-500/60 hover:bg-amber-500/10 hover:text-amber-400"
          }`}
        >
          &lt; REWIND NODE
        </button>

        <button
          onClick={handleReset}
          className="px-3 py-1 rounded text-amber-500/60 hover:bg-amber-500/10 hover:text-amber-400 transition-colors"
        >
          INITIALIZE SEQUENCE ↻
        </button>
      </div>
    </div>
  );
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
        id="css3d"
        ref={containerRef}
        style={{ width: "100vw", height: "100vh", position: "relative" }}
      >
        hello world
      </div>
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
      <div>
        <div className="text-blue-500 cursor-pointer">hello world</div>
        <DeusExSimulator />
      </div>
    </>
  );
}

function App() {
  return (
    <div className="pt-24 min-h-screen bg-slate-900 text-white">
      {/* Navbar Container */}
      <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-slate-900/40 py-4 px-6 flex flex-col items-center justify-center gap-3 border-b border-slate-800">
        {/* Main Logo */}
        <Link
          to="/"
          className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 via-green-400 to-blue-500 animate-[rainbow_4s_linear_infinite]"
          style={{
            animation: "rainbow 4s linear infinite",
            background:
              "-webkit-linear-gradient(left, red, orange, yellow, green, cyan, blue, violet, red)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Happy Bear Landia
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center justify-center gap-6 text-sm md:text-base font-medium tracking-wide text-slate-300">
          <Link to="/" className="hover:text-yellow-400 transition-colors">
            Play
          </Link>
          <Link to="/blog" className="hover:text-yellow-400 transition-colors">
            Blog
          </Link>
          <Link
            to="/view/0"
            className="hover:text-yellow-400 transition-colors text-xs uppercase tracking-wider bg-slate-800 px-2.5 py-1 rounded"
          >
            Log Viewer
          </Link>
          <Link
            to="/edit/1"
            className="hover:text-yellow-400 transition-colors text-xs uppercase tracking-wider bg-purple-900/50 text-purple-300 border border-purple-700/50 px-2.5 py-1 rounded"
          >
            Magic Editor
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="w-full min-h-[calc(100vh-7rem)] flex flex-col items-center justify-center relative overflow-hidden px-4">
        <Routes>
          <Route path="/" element={<LevelList />} />
          <Route path="/level-list" element={<LevelList />} />
          <Route path="/game/:game_id" element={<Game />} />
          <Route path="/view/:game_id" element={<LogViewer />} />
          <Route path="/edit/:game_id" element={<Game_Editor />} />
          <Route path="/cube" element={<Cube />} />
          <Route path="/debug/:game_id" element={<Debugging />} />
          <Route path="/blog" element={<Blog />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
import { html, attributes } from "./references.md";
function Blog() {
  //console.log(referenceText.split("\n"));
  return (
    <div>
      <iframe
        width="800"
        height="450"
        src="https://embed.figma.com/slides/m32R1HooMTzoAIrW3mn0ZS/Creating-an-optimal-world-with-data-presentation?node-id=160-97&embed-host=share"
        allowFullScreen
      ></iframe>

      <div>
        <h7>References</h7>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
