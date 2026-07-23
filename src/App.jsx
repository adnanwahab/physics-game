// src/App.jsx
import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three"; // 1. Import Three.js
import Nav from "./components/Nav";
import Pensieve from "./components/Pensieve";
import Game from "./components/Game";
import LevelList from "./screens/LevelList";
import Settings from "./screens/Settings";
import Game_Editor from "./components/Game_Editor";
import Cube from "./components/Cube";
import LogViewer from "./components/LogViewer";
import Blog from "./components/Blog";

import Fantasy_Grid from "./components/Fantasy_Grid";

import { Routes, Route, Link, useParams } from "react-router-dom";

import {
  CSS3DRenderer,
  CSS3DObject,
} from "three/addons/renderers/CSS3DRenderer.js";
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// 2. Fixed: Explicitly return the JSON data

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

const dalaranOBJ = `# Floating mage city (Dalaran-inspired), procedurally generated
mtllib dalaran.mtl
v 22.6135 0.0000 0.0000
v 19.2316 0.0000 5.1531
v 18.1953 0.0000 10.5051
v 14.6952 0.0000 14.6952
v 11.5202 0.0000 19.9536
v 5.8952 0.0000 22.0014
v 0.0000 0.0000 23.7256
v -5.2236 0.0000 19.4948
v -10.8282 0.0000 18.7550
v -14.0934 0.0000 14.0934
v -17.9804 0.0000 10.3810
v -21.2731 0.0000 5.7001
v -19.9168 0.0000 0.0000
v -19.9704 0.0000 -5.3511
v -19.6237 0.0000 -11.3297
v -15.6962 0.0000 -15.6962
v -10.3850 0.0000 -17.9873
v -5.7957 0.0000 -21.6298
v -0.0000 0.0000 -23.3615
v 5.1320 0.0000 -19.1530
v 11.6728 0.0000 -20.2179
v 16.1728 0.0000 -16.1728
v 18.4438 0.0000 -10.6486
v 19.7861 0.0000 -5.3017
v 22.0908 -4.0000 0.0000
v 18.9114 -4.0000 5.0673
v 16.1007 -4.0000 9.2957
v 13.1575 -4.0000 13.1575
v 10.8233 -4.0000 18.7466
v 5.3472 -4.0000 19.9559
v 0.0000 -4.0000 21.4833
v -5.4792 -4.0000 20.4486
v -10.1933 -4.0000 17.6554
v -15.6661 -4.0000 15.6661
v -17.1025 -4.0000 9.8742
v -19.7538 -4.0000 5.2930
v -21.5734 -4.0000 0.0000
v -20.0138 -4.0000 -5.3627
v -18.7964 -4.0000 -10.8521
v -14.5333 -4.0000 -14.5333
v -10.5341 -4.0000 -18.2455
v -4.7627 -4.0000 -17.7745
v -0.0000 -4.0000 -19.1385
v 5.0178 -4.0000 -18.7268
v 9.2695 -4.0000 -16.0552
v 13.5470 -4.0000 -13.5470
v 16.1296 -4.0000 -9.3124
v 18.6822 -4.0000 -5.0059
v 16.2698 -9.0000 0.0000
v 14.8866 -9.0000 3.9889
v 13.3617 -9.0000 7.7144
v 10.5498 -9.0000 10.5498
v 7.5509 -9.0000 13.0785
v 4.4577 -9.0000 16.6365
v 0.0000 -9.0000 16.3090
v -4.1892 -9.0000 15.6342
v -7.3991 -9.0000 12.8156
v -11.7138 -9.0000 11.7138
v -12.7944 -9.0000 7.3868
v -14.9314 -9.0000 4.0009
v -17.3908 -9.0000 0.0000
v -15.7287 -9.0000 -4.2145
v -13.8741 -9.0000 -8.0102
v -11.6141 -9.0000 -11.6141
v -8.4631 -9.0000 -14.6585
v -4.3260 -9.0000 -16.1448
v -0.0000 -9.0000 -14.9816
v 3.7160 -9.0000 -13.8685
v 7.6277 -9.0000 -13.2115
v 10.6803 -9.0000 -10.6803
v 12.9249 -9.0000 -7.4622
v 16.6556 -9.0000 -4.4629
v 11.3549 -14.0000 0.0000
v 9.8221 -14.0000 2.6318
v 9.4295 -14.0000 5.4441
v 7.3112 -14.0000 7.3112
v 5.7178 -14.0000 9.9035
v 2.7106 -14.0000 10.1162
v 0.0000 -14.0000 10.0634
v -2.5946 -14.0000 9.6833
v -5.3448 -14.0000 9.2575
v -7.1127 -14.0000 7.1127
v -9.2999 -14.0000 5.3693
v -11.0117 -14.0000 2.9506
v -10.3475 -14.0000 0.0000
v -9.6276 -14.0000 -2.5797
v -10.0552 -14.0000 -5.8054
v -7.4813 -14.0000 -7.4813
v -4.8480 -14.0000 -8.3970
v -2.4856 -14.0000 -9.2763
v -0.0000 -14.0000 -9.7356
v 2.8028 -14.0000 -10.4602
v 5.5884 -14.0000 -9.6795
v 7.3508 -14.0000 -7.3508
v 8.3469 -14.0000 -4.8191
v 9.9587 -14.0000 -2.6684
v 6.2876 -19.0000 0.0000
v 5.5573 -19.0000 1.4891
v 5.4204 -19.0000 3.1295
v 4.3365 -19.0000 4.3365
v 2.5806 -19.0000 4.4697
v 1.5458 -19.0000 5.7690
v 0.0000 -19.0000 5.9279
v -1.4914 -19.0000 5.5659
v -2.7266 -19.0000 4.7227
v -4.1587 -19.0000 4.1587
v -4.5688 -19.0000 2.6378
v -5.4530 -19.0000 1.4611
v -5.6671 -19.0000 0.0000
v -6.0266 -19.0000 -1.6148
v -5.3260 -19.0000 -3.0750
v -3.8532 -19.0000 -3.8532
v -2.8603 -19.0000 -4.9542
v -1.3853 -19.0000 -5.1700
v -0.0000 -19.0000 -6.1920
v 1.5902 -19.0000 -5.9345
v 2.7447 -19.0000 -4.7540
v 4.1571 -19.0000 -4.1571
v 5.0616 -19.0000 -2.9223
v 5.1415 -19.0000 -1.3777
v 2.3155 -23.0000 0.0000
v 2.1418 -23.0000 0.5739
v 2.0114 -23.0000 1.1613
v 1.5651 -23.0000 1.5651
v 0.9901 -23.0000 1.7149
v 0.5494 -23.0000 2.0503
v 0.0000 -23.0000 1.9886
v -0.6183 -23.0000 2.3074
v -1.1833 -23.0000 2.0496
v -1.6588 -23.0000 1.6588
v -1.8319 -23.0000 1.0577
v -1.9372 -23.0000 0.5191
v -2.3663 -23.0000 0.0000
v -2.3150 -23.0000 -0.6203
v -1.7474 -23.0000 -1.0088
v -1.5513 -23.0000 -1.5513
v -1.0052 -23.0000 -1.7411
v -0.5991 -23.0000 -2.2358
v -0.0000 -23.0000 -2.3170
v 0.5271 -23.0000 -1.9671
v 1.0946 -23.0000 -1.8958
v 1.5711 -23.0000 -1.5711
v 1.8157 -23.0000 -1.0483
v 2.2833 -23.0000 -0.6118
v -0.1537 -26.5000 -0.5764
v -15.3591 -13.5586 -3.8712
v -13.8775 -6.5000 -3.8712
v -14.9013 -6.5000 -2.4621
v -16.5577 -6.5000 -3.0003
v -16.5577 -6.5000 -4.7421
v -14.9013 -6.5000 -5.2803
v 15.1920 -14.5879 -0.4632
v 17.0053 -6.5000 -0.4632
v 15.7523 -6.5000 1.2614
v 13.7249 -6.5000 0.6027
v 13.7249 -6.5000 -1.5290
v 15.7523 -6.5000 -2.1877
v 8.5489 -14.9415 8.1301
v 10.2223 -6.5000 8.1301
v 9.0660 -6.5000 9.7215
v 7.1952 -6.5000 9.1137
v 7.1952 -6.5000 7.1465
v 9.0660 -6.5000 6.5387
v 1.4657 -15.1555 11.6701
v 2.7651 -6.5000 11.6701
v 1.8673 -6.5000 12.9058
v 0.4145 -6.5000 12.4338
v 0.4145 -6.5000 10.9063
v 1.8673 -6.5000 10.4343
v 2.2749 -12.3543 17.0926
v 4.6784 -6.5000 17.0926
v 3.0176 -6.5000 19.3785
v 0.3304 -6.5000 18.5054
v 0.3304 -6.5000 15.6799
v 3.0176 -6.5000 14.8068
v 1.1560 -12.6616 15.3082
v 2.6559 -6.5000 15.3082
v 1.6195 -6.5000 16.7348
v -0.0575 -6.5000 16.1899
v -0.0575 -6.5000 14.4266
v 1.6195 -6.5000 13.8817
v 13.3888 -15.9231 -5.7426
v 15.2505 -6.5000 -5.7426
v 13.9641 -6.5000 -3.9719
v 11.8826 -6.5000 -4.6483
v 11.8826 -6.5000 -6.8369
v 13.9641 -6.5000 -7.5132
v 20.5000 0.0000 0.0000
v 20.0000 1.2000 0.0000
v 19.9860 0.0000 4.5617
v 19.4986 1.2000 4.4504
v 18.4699 0.0000 8.8946
v 18.0194 1.2000 8.6777
v 16.0275 0.0000 12.7815
v 15.6366 1.2000 12.4698
v 12.7815 0.0000 16.0275
v 12.4698 1.2000 15.6366
v 8.8946 0.0000 18.4699
v 8.6777 1.2000 18.0194
v 4.5617 0.0000 19.9860
v 4.4504 1.2000 19.4986
v 0.0000 0.0000 20.5000
v 0.0000 1.2000 20.0000
v -4.5617 0.0000 19.9860
v -4.4504 1.2000 19.4986
v -8.8946 0.0000 18.4699
v -8.6777 1.2000 18.0194
v -12.7815 0.0000 16.0275
v -12.4698 1.2000 15.6366
v -16.0275 0.0000 12.7815
v -15.6366 1.2000 12.4698
v -18.4699 0.0000 8.8946
v -18.0194 1.2000 8.6777
v -19.9860 0.0000 4.5617
v -19.4986 1.2000 4.4504
v -20.5000 0.0000 0.0000
v -20.0000 1.2000 0.0000
v -19.9860 0.0000 -4.5617
v -19.4986 1.2000 -4.4504
v -18.4699 0.0000 -8.8946
v -18.0194 1.2000 -8.6777
v -16.0275 0.0000 -12.7815
v -15.6366 1.2000 -12.4698
v -12.7815 0.0000 -16.0275
v -12.4698 1.2000 -15.6366
v -8.8946 0.0000 -18.4699
v -8.6777 1.2000 -18.0194
v -4.5617 0.0000 -19.9860
v -4.4504 1.2000 -19.4986
v -0.0000 0.0000 -20.5000
v -0.0000 1.2000 -20.0000
v 4.5617 0.0000 -19.9860
v 4.4504 1.2000 -19.4986
v 8.8946 0.0000 -18.4699
v 8.6777 1.2000 -18.0194
v 12.7815 0.0000 -16.0275
v 12.4698 1.2000 -15.6366
v 16.0275 0.0000 -12.7815
v 15.6366 1.2000 -12.4698
v 18.4699 0.0000 -8.8946
v 18.0194 1.2000 -8.6777
v 19.9860 0.0000 -4.5617
v 19.4986 1.2000 -4.4504
v 20.0000 1.2000 0.0000
v 20.0000 4.2000 0.0000
v 19.4986 1.2000 4.4504
v 19.4986 4.2000 4.4504
v 18.0194 1.2000 8.6777
v 18.0194 4.2000 8.6777
v 15.6366 1.2000 12.4698
v 15.6366 4.2000 12.4698
v 12.4698 1.2000 15.6366
v 12.4698 4.2000 15.6366
v 8.6777 1.2000 18.0194
v 8.6777 4.2000 18.0194
v 4.4504 1.2000 19.4986
v 4.4504 4.2000 19.4986
v 0.0000 1.2000 20.0000
v 0.0000 4.2000 20.0000
v -4.4504 1.2000 19.4986
v -4.4504 4.2000 19.4986
v -8.6777 1.2000 18.0194
v -8.6777 4.2000 18.0194
v -12.4698 1.2000 15.6366
v -12.4698 4.2000 15.6366
v -15.6366 1.2000 12.4698
v -15.6366 4.2000 12.4698
v -18.0194 1.2000 8.6777
v -18.0194 4.2000 8.6777
v -19.4986 1.2000 4.4504
v -19.4986 4.2000 4.4504
v -20.0000 1.2000 0.0000
v -20.0000 4.2000 0.0000
v -19.4986 1.2000 -4.4504
v -19.4986 4.2000 -4.4504
v -18.0194 1.2000 -8.6777
v -18.0194 4.2000 -8.6777
v -15.6366 1.2000 -12.4698
v -15.6366 4.2000 -12.4698
v -12.4698 1.2000 -15.6366
v -12.4698 4.2000 -15.6366
v -8.6777 1.2000 -18.0194
v -8.6777 4.2000 -18.0194
v -4.4504 1.2000 -19.4986
v -4.4504 4.2000 -19.4986
v -0.0000 1.2000 -20.0000
v -0.0000 4.2000 -20.0000
v 4.4504 1.2000 -19.4986
v 4.4504 4.2000 -19.4986
v 8.6777 1.2000 -18.0194
v 8.6777 4.2000 -18.0194
v 12.4698 1.2000 -15.6366
v 12.4698 4.2000 -15.6366
v 15.6366 1.2000 -12.4698
v 15.6366 4.2000 -12.4698
v 18.0194 1.2000 -8.6777
v 18.0194 4.2000 -8.6777
v 19.4986 1.2000 -4.4504
v 19.4986 4.2000 -4.4504
v 20.4000 4.2000 0.0000
v 20.4000 5.0000 0.0000
v 19.8885 4.2000 4.5394
v 19.8885 5.0000 4.5394
v 18.3798 4.2000 8.8512
v 18.3798 5.0000 8.8512
v 15.9494 4.2000 12.7192
v 15.9494 5.0000 12.7192
v 12.7192 4.2000 15.9494
v 12.7192 5.0000 15.9494
v 8.8512 4.2000 18.3798
v 8.8512 5.0000 18.3798
v 4.5394 4.2000 19.8885
v 4.5394 5.0000 19.8885
v 0.0000 4.2000 20.4000
v 0.0000 5.0000 20.4000
v -4.5394 4.2000 19.8885
v -4.5394 5.0000 19.8885
v -8.8512 4.2000 18.3798
v -8.8512 5.0000 18.3798
v -12.7192 4.2000 15.9494
v -12.7192 5.0000 15.9494
v -15.9494 4.2000 12.7192
v -15.9494 5.0000 12.7192
v -18.3798 4.2000 8.8512
v -18.3798 5.0000 8.8512
v -19.8885 4.2000 4.5394
v -19.8885 5.0000 4.5394
v -20.4000 4.2000 0.0000
v -20.4000 5.0000 0.0000
v -19.8885 4.2000 -4.5394
v -19.8885 5.0000 -4.5394
v -18.3798 4.2000 -8.8512
v -18.3798 5.0000 -8.8512
v -15.9494 4.2000 -12.7192
v -15.9494 5.0000 -12.7192
v -12.7192 4.2000 -15.9494
v -12.7192 5.0000 -15.9494
v -8.8512 4.2000 -18.3798
v -8.8512 5.0000 -18.3798
v -4.5394 4.2000 -19.8885
v -4.5394 5.0000 -19.8885
v -0.0000 4.2000 -20.4000
v -0.0000 5.0000 -20.4000
v 4.5394 4.2000 -19.8885
v 4.5394 5.0000 -19.8885
v 8.8512 4.2000 -18.3798
v 8.8512 5.0000 -18.3798
v 12.7192 4.2000 -15.9494
v 12.7192 5.0000 -15.9494
v 15.9494 4.2000 -12.7192
v 15.9494 5.0000 -12.7192
v 18.3798 4.2000 -8.8512
v 18.3798 5.0000 -8.8512
v 19.8885 4.2000 -4.5394
v 19.8885 5.0000 -4.5394
v 20.5776 1.2000 2.2745
v 20.4062 10.6225 2.2745
v 20.0755 1.2000 3.4867
v 19.9543 10.6225 3.3655
v 18.8634 1.2000 3.9888
v 18.8634 10.6225 3.8174
v 17.6512 1.2000 3.4867
v 17.7724 10.6225 3.3655
v 17.1491 1.2000 2.2745
v 17.3205 10.6225 2.2745
v 17.6512 1.2000 1.0624
v 17.7724 10.6225 1.1836
v 18.8634 1.2000 0.5603
v 18.8634 10.6225 0.7317
v 20.0755 1.2000 1.0624
v 19.9543 10.6225 1.1836
v 20.8347 10.6225 2.2745
v 20.8347 11.3225 2.2745
v 20.2573 10.6225 3.6685
v 20.2573 11.3225 3.6685
v 18.8634 10.6225 4.2459
v 18.8634 11.3225 4.2459
v 17.4694 10.6225 3.6685
v 17.4694 11.3225 3.6685
v 16.8920 10.6225 2.2745
v 16.8920 11.3225 2.2745
v 17.4694 10.6225 0.8806
v 17.4694 11.3225 0.8806
v 18.8634 10.6225 0.3031
v 18.8634 11.3225 0.3031
v 20.2573 10.6225 0.8806
v 20.2573 11.3225 0.8806
v 18.8634 18.3894 2.2745
v 21.0062 11.3225 2.2745
v 20.3786 11.3225 3.7897
v 18.8634 11.3225 4.4173
v 17.3482 11.3225 3.7897
v 16.7206 11.3225 2.2745
v 17.3482 11.3225 0.7593
v 18.8634 11.3225 0.1317
v 20.3786 11.3225 0.7593
v 13.5887 1.2000 14.9467
v 13.4028 8.4908 14.9467
v 13.0443 1.2000 16.2610
v 12.9129 8.4908 16.1296
v 11.7301 1.2000 16.8054
v 11.7301 8.4908 16.6195
v 10.4158 1.2000 16.2610
v 10.5473 8.4908 16.1296
v 9.8714 1.2000 14.9467
v 10.0573 8.4908 14.9467
v 10.4158 1.2000 13.6325
v 10.5473 8.4908 13.7639
v 11.7301 1.2000 13.0881
v 11.7301 8.4908 13.2740
v 13.0443 1.2000 13.6325
v 12.9129 8.4908 13.7639
v 13.8675 8.4908 14.9467
v 13.8675 9.1908 14.9467
v 13.2415 8.4908 16.4581
v 13.2415 9.1908 16.4581
v 11.7301 8.4908 17.0842
v 11.7301 9.1908 17.0842
v 10.2187 8.4908 16.4581
v 10.2187 9.1908 16.4581
v 9.5927 8.4908 14.9467
v 9.5927 9.1908 14.9467
v 10.2187 8.4908 13.4354
v 10.2187 9.1908 13.4354
v 11.7301 8.4908 12.8093
v 11.7301 9.1908 12.8093
v 13.2415 8.4908 13.4354
v 13.2415 9.1908 13.4354
v 11.7301 14.6589 14.9467
v 14.0534 9.1908 14.9467
v 13.3729 9.1908 16.5896
v 11.7301 9.1908 17.2700
v 10.0873 9.1908 16.5896
v 9.4068 9.1908 14.9467
v 10.0873 9.1908 13.3039
v 11.7301 9.1908 12.6235
v 13.3729 9.1908 13.3039
v -0.3943 1.2000 18.8634
v -0.5823 9.4707 18.8634
v -0.9450 1.2000 20.1929
v -1.0780 9.4707 20.0599
v -2.2745 1.2000 20.7436
v -2.2745 9.4707 20.5556
v -3.6040 1.2000 20.1929
v -3.4711 9.4707 20.0599
v -4.1547 1.2000 18.8634
v -3.9667 9.4707 18.8634
v -3.6040 1.2000 17.5339
v -3.4711 9.4707 17.6668
v -2.2745 1.2000 16.9831
v -2.2745 9.4707 17.1712
v -0.9450 1.2000 17.5339
v -1.0780 9.4707 17.6668
v -0.1123 9.4707 18.8634
v -0.1123 10.1707 18.8634
v -0.7456 9.4707 20.3923
v -0.7456 10.1707 20.3923
v -2.2745 9.4707 21.0256
v -2.2745 10.1707 21.0256
v -3.8035 9.4707 20.3923
v -3.8035 10.1707 20.3923
v -4.4368 9.4707 18.8634
v -4.4368 10.1707 18.8634
v -3.8035 9.4707 17.3344
v -3.8035 10.1707 17.3344
v -2.2745 9.4707 16.7011
v -2.2745 10.1707 16.7011
v -0.7456 9.4707 17.3344
v -0.7456 10.1707 17.3344
v -2.2745 16.3738 18.8634
v 0.0757 10.1707 18.8634
v -0.6126 10.1707 20.5253
v -2.2745 10.1707 21.2136
v -3.9364 10.1707 20.5253
v -4.6248 10.1707 18.8634
v -3.9364 10.1707 17.2015
v -2.2745 10.1707 16.5131
v -0.6126 10.1707 17.2015
v -12.9427 1.2000 11.7301
v -13.1431 10.3872 11.7301
v -13.5297 1.2000 13.1471
v -13.6714 10.3872 13.0054
v -14.9467 1.2000 13.7341
v -14.9467 10.3872 13.5337
v -16.3638 1.2000 13.1471
v -16.2221 10.3872 13.0054
v -16.9508 1.2000 11.7301
v -16.7504 10.3872 11.7301
v -16.3638 1.2000 10.3130
v -16.2221 10.3872 10.4547
v -14.9467 1.2000 9.7261
v -14.9467 10.3872 9.9265
v -13.5297 1.2000 10.3130
v -13.6714 10.3872 10.4547
v -12.6421 10.3872 11.7301
v -12.6421 11.0872 11.7301
v -13.3171 10.3872 13.3597
v -13.3171 11.0872 13.3597
v -14.9467 10.3872 14.0347
v -14.9467 11.0872 14.0347
v -16.5764 10.3872 13.3597
v -16.5764 11.0872 13.3597
v -17.2514 10.3872 11.7301
v -17.2514 11.0872 11.7301
v -16.5764 10.3872 10.1005
v -16.5764 11.0872 10.1005
v -14.9467 10.3872 9.4255
v -14.9467 11.0872 9.4255
v -13.3171 10.3872 10.1005
v -13.3171 11.0872 10.1005
v -14.9467 17.9776 11.7301
v -12.4417 11.0872 11.7301
v -13.1754 11.0872 13.5014
v -14.9467 11.0872 14.2351
v -16.7181 11.0872 13.5014
v -17.4518 11.0872 11.7301
v -16.7181 11.0872 9.9588
v -14.9467 11.0872 9.2251
v -13.1754 11.0872 9.9588
v -17.2043 1.2000 -2.2745
v -17.3702 11.1525 -2.2745
v -17.6902 1.2000 -1.1014
v -17.8076 11.1525 -1.2187
v -18.8634 1.2000 -0.6155
v -18.8634 11.1525 -0.7814
v -20.0365 1.2000 -1.1014
v -19.9192 11.1525 -1.2187
v -20.5224 1.2000 -2.2745
v -20.3565 11.1525 -2.2745
v -20.0365 1.2000 -3.4477
v -19.9192 11.1525 -3.3303
v -18.8634 1.2000 -3.9336
v -18.8634 11.1525 -3.7677
v -17.6902 1.2000 -3.4477
v -17.8076 11.1525 -3.3303
v -16.9555 11.1525 -2.2745
v -16.9555 11.8525 -2.2745
v -17.5143 11.1525 -0.9254
v -17.5143 11.8525 -0.9254
v -18.8634 11.1525 -0.3666
v -18.8634 11.8525 -0.3666
v -20.2125 11.1525 -0.9254
v -20.2125 11.8525 -0.9254
v -20.7713 11.1525 -2.2745
v -20.7713 11.8525 -2.2745
v -20.2125 11.1525 -3.6236
v -20.2125 11.8525 -3.6236
v -18.8634 11.1525 -4.1824
v -18.8634 11.8525 -4.1824
v -17.5143 11.1525 -3.6236
v -17.5143 11.8525 -3.6236
v -18.8634 19.3169 -2.2745
v -16.7896 11.8525 -2.2745
v -17.3970 11.8525 -0.8081
v -18.8634 11.8525 -0.2007
v -20.3298 11.8525 -0.8081
v -20.9372 11.8525 -2.2745
v -20.3298 11.8525 -3.7409
v -18.8634 11.8525 -4.3483
v -17.3970 11.8525 -3.7409
v -9.9265 1.2000 -14.9467
v -10.1069 9.4079 -14.9467
v -10.4548 1.2000 -13.6714
v -10.5823 9.4079 -13.7990
v -11.7301 1.2000 -13.1432
v -11.7301 9.4079 -13.3235
v -13.0054 1.2000 -13.6714
v -12.8779 9.4079 -13.7990
v -13.5337 1.2000 -14.9467
v -13.3533 9.4079 -14.9467
v -13.0054 1.2000 -16.2221
v -12.8779 9.4079 -16.0945
v -11.7301 1.2000 -16.7503
v -11.7301 9.4079 -16.5700
v -10.4548 1.2000 -16.2221
v -10.5823 9.4079 -16.0945
v -9.6560 9.4079 -14.9467
v -9.6560 10.1079 -14.9467
v -10.2635 9.4079 -13.4801
v -10.2635 10.1079 -13.4801
v -11.7301 9.4079 -12.8726
v -11.7301 10.1079 -12.8726
v -13.1967 9.4079 -13.4801
v -13.1967 10.1079 -13.4801
v -13.8042 9.4079 -14.9467
v -13.8042 10.1079 -14.9467
v -13.1967 9.4079 -16.4134
v -13.1967 10.1079 -16.4134
v -11.7301 9.4079 -17.0209
v -11.7301 10.1079 -17.0209
v -10.2635 9.4079 -16.4134
v -10.2635 10.1079 -16.4134
v -11.7301 16.2638 -14.9467
v -9.4756 10.1079 -14.9467
v -10.1359 10.1079 -13.3526
v -11.7301 10.1079 -12.6923
v -13.3242 10.1079 -13.3526
v -13.9846 10.1079 -14.9467
v -13.3242 10.1079 -16.5409
v -11.7301 10.1079 -17.2012
v -10.1359 10.1079 -16.5409
v 4.0237 1.2000 -18.8634
v 3.8488 10.7850 -18.8634
v 3.5114 1.2000 -17.6265
v 3.3877 10.7850 -17.7502
v 2.2745 1.2000 -17.1142
v 2.2745 10.7850 -17.2891
v 1.0377 1.2000 -17.6265
v 1.1614 10.7850 -17.7502
v 0.5253 1.2000 -18.8634
v 0.7003 10.7850 -18.8634
v 1.0377 1.2000 -20.1002
v 1.1614 10.7850 -19.9765
v 2.2745 1.2000 -20.6126
v 2.2745 10.7850 -20.4376
v 3.5114 1.2000 -20.1002
v 3.3877 10.7850 -19.9765
v 4.2861 10.7850 -18.8634
v 4.2861 11.4850 -18.8634
v 3.6969 10.7850 -17.4410
v 3.6969 11.4850 -17.4410
v 2.2745 10.7850 -16.8518
v 2.2745 11.4850 -16.8518
v 0.8521 10.7850 -17.4410
v 0.8521 11.4850 -17.4410
v 0.2630 10.7850 -18.8634
v 0.2630 11.4850 -18.8634
v 0.8521 10.7850 -20.2858
v 0.8521 11.4850 -20.2858
v 2.2745 10.7850 -20.8749
v 2.2745 11.4850 -20.8749
v 3.6969 10.7850 -20.2858
v 3.6969 11.4850 -20.2858
v 2.2745 18.6738 -18.8634
v 4.4610 11.4850 -18.8634
v 3.8206 11.4850 -17.3173
v 2.2745 11.4850 -16.6769
v 0.7284 11.4850 -17.3173
v 0.0880 11.4850 -18.8634
v 0.7284 11.4850 -20.4094
v 2.2745 11.4850 -21.0499
v 3.8206 11.4850 -20.4094
v 16.8159 1.2000 -11.7301
v 16.6290 8.7706 -11.7301
v 16.2685 1.2000 -10.4084
v 16.1363 8.7706 -10.5405
v 14.9467 1.2000 -9.8609
v 14.9467 8.7706 -10.0478
v 13.6250 1.2000 -10.4084
v 13.7572 8.7706 -10.5405
v 13.0776 1.2000 -11.7301
v 13.2645 8.7706 -11.7301
v 13.6250 1.2000 -13.0518
v 13.7572 8.7706 -12.9196
v 14.9467 1.2000 -13.5992
v 14.9467 8.7706 -13.4123
v 16.2685 1.2000 -13.0518
v 16.1363 8.7706 -12.9196
v 17.0963 8.7706 -11.7301
v 17.0963 9.4706 -11.7301
v 16.4667 8.7706 -10.2101
v 16.4667 9.4706 -10.2101
v 14.9467 8.7706 -9.5805
v 14.9467 9.4706 -9.5805
v 13.4268 8.7706 -10.2101
v 13.4268 9.4706 -10.2101
v 12.7972 8.7706 -11.7301
v 12.7972 9.4706 -11.7301
v 13.4268 8.7706 -13.2500
v 13.4268 9.4706 -13.2500
v 14.9467 8.7706 -13.8796
v 14.9467 9.4706 -13.8796
v 16.4667 8.7706 -13.2500
v 16.4667 9.4706 -13.2500
v 14.9467 15.1486 -11.7301
v 17.2832 9.4706 -11.7301
v 16.5989 9.4706 -10.0779
v 14.9467 9.4706 -9.3936
v 13.2946 9.4706 -10.0779
v 12.6103 9.4706 -11.7301
v 13.2946 9.4706 -13.3822
v 14.9467 9.4706 -14.0665
v 16.5989 9.4706 -13.3822
v 7.5000 1.2000 0.0000
v 6.8000 7.2000 0.0000
v 6.7573 1.2000 3.2541
v 6.1266 7.2000 2.9504
v 4.6762 1.2000 5.8637
v 4.2397 7.2000 5.3165
v 1.6689 1.2000 7.3120
v 1.5131 7.2000 6.6295
v -1.6689 1.2000 7.3120
v -1.5131 7.2000 6.6295
v -4.6762 1.2000 5.8637
v -4.2397 7.2000 5.3165
v -6.7573 1.2000 3.2541
v -6.1266 7.2000 2.9504
v -7.5000 1.2000 0.0000
v -6.8000 7.2000 0.0000
v -6.7573 1.2000 -3.2541
v -6.1266 7.2000 -2.9504
v -4.6762 1.2000 -5.8637
v -4.2397 7.2000 -5.3165
v -1.6689 1.2000 -7.3120
v -1.5131 7.2000 -6.6295
v 1.6689 1.2000 -7.3120
v 1.5131 7.2000 -6.6295
v 4.6762 1.2000 -5.8637
v 4.2397 7.2000 -5.3165
v 6.7573 1.2000 -3.2541
v 6.1266 7.2000 -2.9504
v 6.0000 7.2000 0.0000
v 5.2000 15.2000 0.0000
v 5.4058 7.2000 2.6033
v 4.6850 15.2000 2.2562
v 3.7409 7.2000 4.6910
v 3.2421 15.2000 4.0655
v 1.3351 7.2000 5.8496
v 1.1571 15.2000 5.0696
v -1.3351 7.2000 5.8496
v -1.1571 15.2000 5.0696
v -3.7409 7.2000 4.6910
v -3.2421 15.2000 4.0655
v -5.4058 7.2000 2.6033
v -4.6850 15.2000 2.2562
v -6.0000 7.2000 0.0000
v -5.2000 15.2000 0.0000
v -5.4058 7.2000 -2.6033
v -4.6850 15.2000 -2.2562
v -3.7409 7.2000 -4.6910
v -3.2421 15.2000 -4.0655
v -1.3351 7.2000 -5.8496
v -1.1571 15.2000 -5.0696
v 1.3351 7.2000 -5.8496
v 1.1571 15.2000 -5.0696
v 3.7409 7.2000 -4.6910
v 3.2421 15.2000 -4.0655
v 5.4058 7.2000 -2.6033
v 4.6850 15.2000 -2.2562
v 5.6000 15.2000 0.0000
v 5.6000 16.1000 0.0000
v 5.0454 15.2000 2.4297
v 5.0454 16.1000 2.4297
v 3.4915 15.2000 4.3783
v 3.4915 16.1000 4.3783
v 1.2461 15.2000 5.4596
v 1.2461 16.1000 5.4596
v -1.2461 15.2000 5.4596
v -1.2461 16.1000 5.4596
v -3.4915 15.2000 4.3783
v -3.4915 16.1000 4.3783
v -5.0454 15.2000 2.4297
v -5.0454 16.1000 2.4297
v -5.6000 15.2000 0.0000
v -5.6000 16.1000 0.0000
v -5.0454 15.2000 -2.4297
v -5.0454 16.1000 -2.4297
v -3.4915 15.2000 -4.3783
v -3.4915 16.1000 -4.3783
v -1.2461 15.2000 -5.4596
v -1.2461 16.1000 -5.4596
v 1.2461 15.2000 -5.4596
v 1.2461 16.1000 -5.4596
v 3.4915 15.2000 -4.3783
v 3.4915 16.1000 -4.3783
v 5.0454 15.2000 -2.4297
v 5.0454 16.1000 -2.4297
v 4.2000 16.1000 0.0000
v 3.2000 23.1000 0.0000
v 3.6373 16.1000 2.1000
v 2.7713 23.1000 1.6000
v 2.1000 16.1000 3.6373
v 1.6000 23.1000 2.7713
v 0.0000 16.1000 4.2000
v 0.0000 23.1000 3.2000
v -2.1000 16.1000 3.6373
v -1.6000 23.1000 2.7713
v -3.6373 16.1000 2.1000
v -2.7713 23.1000 1.6000
v -4.2000 16.1000 0.0000
v -3.2000 23.1000 0.0000
v -3.6373 16.1000 -2.1000
v -2.7713 23.1000 -1.6000
v -2.1000 16.1000 -3.6373
v -1.6000 23.1000 -2.7713
v -0.0000 16.1000 -4.2000
v -0.0000 23.1000 -3.2000
v 2.1000 16.1000 -3.6373
v 1.6000 23.1000 -2.7713
v 3.6373 16.1000 -2.1000
v 2.7713 23.1000 -1.6000
v 0.0000 34.1000 0.0000
v 3.8000 23.1000 0.0000
v 3.2909 23.1000 1.9000
v 1.9000 23.1000 3.2909
v 0.0000 23.1000 3.8000
v -1.9000 23.1000 3.2909
v -3.2909 23.1000 1.9000
v -3.8000 23.1000 0.0000
v -3.2909 23.1000 -1.9000
v -1.9000 23.1000 -3.2909
v -0.0000 23.1000 -3.8000
v 1.9000 23.1000 -3.2909
v 3.2909 23.1000 -1.9000
v 6.2579 7.2000 2.1807
v 6.1579 16.7000 2.1807
v 5.8438 7.2000 3.0408
v 5.7814 16.7000 2.9626
v 4.9132 7.2000 3.2532
v 4.9354 16.7000 3.1557
v 4.1669 7.2000 2.6580
v 4.2570 16.7000 2.6146
v 4.1669 7.2000 1.7035
v 4.2570 16.7000 1.7469
v 4.9132 7.2000 1.1083
v 4.9354 16.7000 1.2058
v 5.8438 7.2000 1.3207
v 5.7814 16.7000 1.3989
v 5.1579 21.2000 2.1807
v 6.5579 16.7000 2.1807
v 6.0308 16.7000 3.2753
v 4.8464 16.7000 3.5456
v 3.8966 16.7000 2.7882
v 3.8966 16.7000 1.5733
v 4.8464 16.7000 0.8158
v 6.0308 16.7000 1.0862
v -1.0807 7.2000 5.1579
v -1.1807 16.7000 5.1579
v -1.4949 7.2000 6.0180
v -1.5573 16.7000 5.9398
v -2.4255 7.2000 6.2304
v -2.4033 16.7000 6.1329
v -3.1718 7.2000 5.6352
v -3.0817 16.7000 5.5918
v -3.1718 7.2000 4.6807
v -3.0817 16.7000 4.7241
v -2.4255 7.2000 4.0855
v -2.4033 16.7000 4.1830
v -1.4949 7.2000 4.2979
v -1.5573 16.7000 4.3761
v -2.1807 21.2000 5.1579
v -0.7807 16.7000 5.1579
v -1.3079 16.7000 6.2525
v -2.4923 16.7000 6.5228
v -3.4421 16.7000 5.7654
v -3.4421 16.7000 4.5505
v -2.4923 16.7000 3.7930
v -1.3079 16.7000 4.0634
v -4.0579 7.2000 -2.1807
v -4.1579 16.7000 -2.1807
v -4.4721 7.2000 -1.3207
v -4.5345 16.7000 -1.3989
v -5.4027 7.2000 -1.1083
v -5.3805 16.7000 -1.2058
v -6.1490 7.2000 -1.7035
v -6.0589 16.7000 -1.7469
v -6.1490 7.2000 -2.6580
v -6.0589 16.7000 -2.6146
v -5.4027 7.2000 -3.2532
v -5.3805 16.7000 -3.1557
v -4.4721 7.2000 -3.0408
v -4.5345 16.7000 -2.9626
v -5.1579 21.2000 -2.1807
v -3.7579 16.7000 -2.1807
v -4.2851 16.7000 -1.0862
v -5.4695 16.7000 -0.8158
v -6.4193 16.7000 -1.5733
v -6.4193 16.7000 -2.7882
v -5.4695 16.7000 -3.5456
v -4.2851 16.7000 -3.2753
v 3.2807 7.2000 -5.1579
v 3.1807 16.7000 -5.1579
v 2.8666 7.2000 -4.2979
v 2.8042 16.7000 -4.3761
v 1.9360 7.2000 -4.0855
v 1.9582 16.7000 -4.1830
v 1.1897 7.2000 -4.6807
v 1.2798 16.7000 -4.7241
v 1.1897 7.2000 -5.6352
v 1.2798 16.7000 -5.5918
v 1.9360 7.2000 -6.2304
v 1.9582 16.7000 -6.1329
v 2.8666 7.2000 -6.0180
v 2.8042 16.7000 -5.9398
v 2.1807 21.2000 -5.1579
v 3.5807 16.7000 -5.1579
v 3.0536 16.7000 -4.0634
v 1.8692 16.7000 -3.7930
v 0.9194 16.7000 -4.5505
v 0.9194 16.7000 -5.7654
v 1.8692 16.7000 -6.5228
v 3.0536 16.7000 -6.2525
v -8.2054 1.2000 6.4423
v -10.5171 1.2000 7.5181
v -11.9907 1.2000 4.3517
v -9.6791 1.2000 3.2758
v -8.2054 3.9090 6.4423
v -10.5171 3.9090 7.5181
v -11.9907 3.9090 4.3517
v -9.6791 3.9090 3.2758
v -8.2054 3.9090 6.4423
v -10.5171 3.9090 7.5181
v -11.9907 3.9090 4.3517
v -9.6791 3.9090 3.2758
v -8.9422 5.6593 4.8591
v -11.2539 5.6593 5.9349
v 17.9809 1.2000 5.9651
v 14.9841 1.2000 7.5076
v 13.3565 1.2000 4.3453
v 16.3533 1.2000 2.8028
v 17.9809 4.6822 5.9651
v 14.9841 4.6822 7.5076
v 13.3565 4.6822 4.3453
v 16.3533 4.6822 2.8028
v 17.9809 4.6822 5.9651
v 14.9841 4.6822 7.5076
v 13.3565 4.6822 4.3453
v 16.3533 4.6822 2.8028
v 17.1671 6.0485 4.3840
v 14.1703 6.0485 5.9264
v -9.5196 1.2000 2.0669
v -12.2781 1.2000 2.1943
v -12.3834 1.2000 -0.0854
v -9.6249 1.2000 -0.2128
v -9.5196 3.8064 2.0669
v -12.2781 3.8064 2.1943
v -12.3834 3.8064 -0.0854
v -9.6249 3.8064 -0.2128
v -9.5196 3.8064 2.0669
v -12.2781 3.8064 2.1943
v -12.3834 3.8064 -0.0854
v -9.6249 3.8064 -0.2128
v -9.5723 5.2716 0.9270
v -12.3308 5.2716 1.0544
v 4.6812 1.2000 -13.4617
v 4.1945 1.2000 -10.7122
v 0.7084 1.2000 -11.3293
v 1.1951 1.2000 -14.0788
v 4.6812 4.7927 -13.4617
v 4.1945 4.7927 -10.7122
v 0.7084 4.7927 -11.3293
v 1.1951 4.7927 -14.0788
v 4.6812 4.7927 -13.4617
v 4.1945 4.7927 -10.7122
v 0.7084 4.7927 -11.3293
v 1.1951 4.7927 -14.0788
v 2.9382 6.7111 -13.7702
v 2.4515 6.7111 -11.0208
v 8.8400 1.2000 9.3592
v 6.3414 1.2000 11.8897
v 4.1989 1.2000 9.7743
v 6.6975 1.2000 7.2438
v 8.8400 4.0675 9.3592
v 6.3414 4.0675 11.8897
v 4.1989 4.0675 9.7743
v 6.6975 4.0675 7.2438
v 8.8400 4.0675 9.3592
v 6.3414 4.0675 11.8897
v 4.1989 4.0675 9.7743
v 6.6975 4.0675 7.2438
v 7.7687 5.3247 8.3015
v 5.2701 5.3247 10.8320
v -12.5830 1.2000 -8.1644
v -9.2961 1.2000 -7.3192
v -9.8988 1.2000 -4.9750
v -13.1857 1.2000 -5.8202
v -12.5830 4.7372 -8.1644
v -9.2961 4.7372 -7.3192
v -9.8988 4.7372 -4.9750
v -13.1857 4.7372 -5.8202
v -12.5830 4.7372 -8.1644
v -9.2961 4.7372 -7.3192
v -9.8988 4.7372 -4.9750
v -13.1857 4.7372 -5.8202
v -12.8844 6.1231 -6.9923
v -9.5975 6.1231 -6.1471
v -11.8423 1.2000 -9.7297
v -10.0327 1.2000 -7.9626
v -11.6870 1.2000 -6.2685
v -13.4966 1.2000 -8.0356
v -11.8423 4.6245 -9.7297
v -10.0327 4.6245 -7.9626
v -11.6870 4.6245 -6.2685
v -13.4966 4.6245 -8.0356
v -11.8423 4.6245 -9.7297
v -10.0327 4.6245 -7.9626
v -11.6870 4.6245 -6.2685
v -13.4966 4.6245 -8.0356
v -12.6695 6.4190 -8.8826
v -10.8599 6.4190 -7.1155
v -9.4285 1.2000 -10.5541
v -7.0115 1.2000 -8.7481
v -8.7664 1.2000 -6.3995
v -11.1834 1.2000 -8.2054
v -9.4285 4.6955 -10.5541
v -7.0115 4.6955 -8.7481
v -8.7664 4.6955 -6.3995
v -11.1834 4.6955 -8.2054
v -9.4285 4.6955 -10.5541
v -7.0115 4.6955 -8.7481
v -8.7664 4.6955 -6.3995
v -11.1834 4.6955 -8.2054
v -10.3059 6.6117 -9.3797
v -7.8889 6.6117 -7.5738
v 2.9092 1.2000 12.0675
v 0.6756 1.2000 14.2750
v -1.1661 1.2000 12.4116
v 1.0675 1.2000 10.2040
v 2.9092 3.7059 12.0675
v 0.6756 3.7059 14.2750
v -1.1661 3.7059 12.4116
v 1.0675 3.7059 10.2040
v 2.9092 3.7059 12.0675
v 0.6756 3.7059 14.2750
v -1.1661 3.7059 12.4116
v 1.0675 3.7059 10.2040
v 1.9883 4.9784 11.1357
v -0.2452 4.9784 13.3433
v -16.2828 1.2000 2.1681
v -13.8653 1.2000 4.8283
v -15.5693 1.2000 6.3769
v -17.9868 1.2000 3.7167
v -16.2828 3.5410 2.1681
v -13.8653 3.5410 4.8283
v -15.5693 3.5410 6.3769
v -17.9868 3.5410 3.7167
v -16.2828 3.5410 2.1681
v -13.8653 3.5410 4.8283
v -15.5693 3.5410 6.3769
v -17.9868 3.5410 3.7167
v -17.1348 5.6743 2.9424
v -14.7173 5.6743 5.6026
v 13.2520 1.2000 -11.0223
v 11.6304 1.2000 -8.8418
v 9.6879 1.2000 -10.2865
v 11.3094 1.2000 -12.4669
v 13.2520 4.5340 -11.0223
v 11.6304 4.5340 -8.8418
v 9.6879 4.5340 -10.2865
v 11.3094 4.5340 -12.4669
v 13.2520 4.5340 -11.0223
v 11.6304 4.5340 -8.8418
v 9.6879 4.5340 -10.2865
v 11.3094 4.5340 -12.4669
v 12.2807 6.3457 -11.7446
v 10.6592 6.3457 -9.5642
v 16.0319 1.2000 -1.2701
v 14.9462 1.2000 0.6560
v 12.0332 1.2000 -0.9861
v 13.1189 1.2000 -2.9121
v 16.0319 3.6790 -1.2701
v 14.9462 3.6790 0.6560
v 12.0332 3.6790 -0.9861
v 13.1189 3.6790 -2.9121
v 16.0319 3.6790 -1.2701
v 14.9462 3.6790 0.6560
v 12.0332 3.6790 -0.9861
v 13.1189 3.6790 -2.9121
v 14.5754 5.8179 -2.0911
v 13.4897 5.8179 -0.1651
v 8.6385 1.2000 7.0709
v 7.8785 1.2000 9.2945
v 5.0639 1.2000 8.3325
v 5.8238 1.2000 6.1089
v 8.6385 3.6358 7.0709
v 7.8785 3.6358 9.2945
v 5.0639 3.6358 8.3325
v 5.8238 3.6358 6.1089
v 8.6385 3.6358 7.0709
v 7.8785 3.6358 9.2945
v 5.0639 3.6358 8.3325
v 5.8238 3.6358 6.1089
v 7.2312 5.5534 6.5899
v 6.4712 5.5534 8.8135
v 5.8147 1.2000 14.0308
v 3.5397 1.2000 15.2253
v 2.1990 1.2000 12.6719
v 4.4741 1.2000 11.4774
v 5.8147 4.6485 14.0308
v 3.5397 4.6485 15.2253
v 2.1990 4.6485 12.6719
v 4.4741 4.6485 11.4774
v 5.8147 4.6485 14.0308
v 3.5397 4.6485 15.2253
v 2.1990 4.6485 12.6719
v 4.4741 4.6485 11.4774
v 5.1444 5.9408 12.7541
v 2.8693 5.9408 13.9486
v -9.6909 1.2000 3.3597
v -8.1914 1.2000 4.9763
v -10.5958 1.2000 7.2066
v -12.0953 1.2000 5.5900
v -9.6909 4.2194 3.3597
v -8.1914 4.2194 4.9763
v -10.5958 4.2194 7.2066
v -12.0953 4.2194 5.5900
v -9.6909 4.2194 3.3597
v -8.1914 4.2194 4.9763
v -10.5958 4.2194 7.2066
v -12.0953 4.2194 5.5900
v -10.8931 6.1606 4.4749
v -9.3936 6.1606 6.0915
v -10.4415 1.2000 -3.2145
v -12.5550 1.2000 -2.5565
v -13.2403 1.2000 -4.7576
v -11.1268 1.2000 -5.4156
v -10.4415 4.6130 -3.2145
v -12.5550 4.6130 -2.5565
v -13.2403 4.6130 -4.7576
v -11.1268 4.6130 -5.4156
v -10.4415 4.6130 -3.2145
v -12.5550 4.6130 -2.5565
v -13.2403 4.6130 -4.7576
v -11.1268 4.6130 -5.4156
v -10.7842 6.3586 -4.3150
v -12.8976 6.3586 -3.6570
v 7.6447 1.2000 -11.1311
v 7.4947 6.6443 -11.1311
v 7.2306 1.2000 -10.2710
v 7.1370 6.6443 -10.3883
v 6.2999 1.2000 -10.0586
v 6.3333 6.6443 -10.2049
v 5.5537 1.2000 -10.6538
v 5.6888 6.6443 -10.7189
v 5.5537 1.2000 -11.6083
v 5.6888 6.6443 -11.5433
v 6.2999 1.2000 -12.2035
v 6.3333 6.6443 -12.0572
v 7.2306 1.2000 -11.9911
v 7.1370 6.6443 -11.8738
v 6.5447 10.1443 -11.1311
v 7.8447 6.6443 -11.1311
v 7.3553 6.6443 -10.1147
v 6.2554 6.6443 -9.8637
v 5.3735 6.6443 -10.5670
v 5.3735 6.6443 -11.6951
v 6.2554 6.6443 -12.3985
v 7.3553 6.6443 -12.1474
v 9.1346 1.2000 8.2854
v 8.9846 8.8969 8.2854
v 8.7204 1.2000 9.1454
v 8.6269 8.8969 9.0281
v 7.7898 1.2000 9.3578
v 7.8232 8.8969 9.2115
v 7.0435 1.2000 8.7626
v 7.1786 8.8969 8.6975
v 7.0435 1.2000 7.8081
v 7.1786 8.8969 7.8732
v 7.7898 1.2000 7.2129
v 7.8232 8.8969 7.3592
v 8.7204 1.2000 7.4253
v 8.6269 8.8969 7.5426
v 8.0346 12.3969 8.2854
v 9.3346 8.8969 8.2854
v 8.8451 8.8969 9.3017
v 7.7453 8.8969 9.5528
v 6.8633 8.8969 8.8494
v 6.8633 8.8969 7.7213
v 7.7453 8.8969 7.0179
v 8.8451 8.8969 7.2690
v 5.1873 1.2000 -13.7071
v 5.0373 8.8968 -13.7071
v 4.7732 1.2000 -12.8471
v 4.6796 8.8968 -12.9644
v 3.8425 1.2000 -12.6347
v 3.8759 8.8968 -12.7809
v 3.0962 1.2000 -13.2298
v 3.2314 8.8968 -13.2949
v 3.0962 1.2000 -14.1844
v 3.2314 8.8968 -14.1193
v 3.8425 1.2000 -14.7795
v 3.8759 8.8968 -14.6333
v 4.7732 1.2000 -14.5671
v 4.6796 8.8968 -14.4498
v 4.0873 12.3968 -13.7071
v 5.3873 8.8968 -13.7071
v 4.8978 8.8968 -12.6907
v 3.7980 8.8968 -12.4397
v 2.9161 8.8968 -13.1430
v 2.9161 8.8968 -14.2711
v 3.7980 8.8968 -14.9745
v 4.8978 8.8968 -14.7235
v 3.8919 1.2000 10.8956
v 3.7419 6.5084 10.8956
v 3.4778 1.2000 11.7556
v 3.3843 6.5084 11.6384
v 2.5472 1.2000 11.9680
v 2.5805 6.5084 11.8218
v 1.8009 1.2000 11.3729
v 1.9360 6.5084 11.3078
v 1.8009 1.2000 10.4184
v 1.9360 6.5084 10.4834
v 2.5472 1.2000 9.8232
v 2.5805 6.5084 9.9694
v 3.4778 1.2000 10.0356
v 3.3843 6.5084 10.1529
v 2.7919 10.0084 10.8956
v 4.0919 6.5084 10.8956
v 3.6025 6.5084 11.9120
v 2.5027 6.5084 12.1630
v 1.6207 6.5084 11.4597
v 1.6207 6.5084 10.3316
v 2.5027 6.5084 9.6282
v 3.6025 6.5084 9.8792
usemtl rock
f 1 2 26 25
f 2 3 27 26
f 3 4 28 27
f 4 5 29 28
f 5 6 30 29
f 6 7 31 30
f 7 8 32 31
f 8 9 33 32
f 9 10 34 33
f 10 11 35 34
f 11 12 36 35
f 12 13 37 36
f 13 14 38 37
f 14 15 39 38
f 15 16 40 39
f 16 17 41 40
f 17 18 42 41
f 18 19 43 42
f 19 20 44 43
f 20 21 45 44
f 21 22 46 45
f 22 23 47 46
f 23 24 48 47
f 24 1 25 48
f 25 26 50 49
f 26 27 51 50
f 27 28 52 51
f 28 29 53 52
f 29 30 54 53
f 30 31 55 54
f 31 32 56 55
f 32 33 57 56
f 33 34 58 57
f 34 35 59 58
f 35 36 60 59
f 36 37 61 60
f 37 38 62 61
f 38 39 63 62
f 39 40 64 63
f 40 41 65 64
f 41 42 66 65
f 42 43 67 66
f 43 44 68 67
f 44 45 69 68
f 45 46 70 69
f 46 47 71 70
f 47 48 72 71
f 48 25 49 72
f 49 50 74 73
f 50 51 75 74
f 51 52 76 75
f 52 53 77 76
f 53 54 78 77
f 54 55 79 78
f 55 56 80 79
f 56 57 81 80
f 57 58 82 81
f 58 59 83 82
f 59 60 84 83
f 60 61 85 84
f 61 62 86 85
f 62 63 87 86
f 63 64 88 87
f 64 65 89 88
f 65 66 90 89
f 66 67 91 90
f 67 68 92 91
f 68 69 93 92
f 69 70 94 93
f 70 71 95 94
f 71 72 96 95
f 72 49 73 96
f 73 74 98 97
f 74 75 99 98
f 75 76 100 99
f 76 77 101 100
f 77 78 102 101
f 78 79 103 102
f 79 80 104 103
f 80 81 105 104
f 81 82 106 105
f 82 83 107 106
f 83 84 108 107
f 84 85 109 108
f 85 86 110 109
f 86 87 111 110
f 87 88 112 111
f 88 89 113 112
f 89 90 114 113
f 90 91 115 114
f 91 92 116 115
f 92 93 117 116
f 93 94 118 117
f 94 95 119 118
f 95 96 120 119
f 96 73 97 120
f 97 98 122 121
f 98 99 123 122
f 99 100 124 123
f 100 101 125 124
f 101 102 126 125
f 102 103 127 126
f 103 104 128 127
f 104 105 129 128
f 105 106 130 129
f 106 107 131 130
f 107 108 132 131
f 108 109 133 132
f 109 110 134 133
f 110 111 135 134
f 111 112 136 135
f 112 113 137 136
f 113 114 138 137
f 114 115 139 138
f 115 116 140 139
f 116 117 141 140
f 117 118 142 141
f 118 119 143 142
f 119 120 144 143
f 120 97 121 144
f 121 122 145
f 122 123 145
f 123 124 145
f 124 125 145
f 125 126 145
f 126 127 145
f 127 128 145
f 128 129 145
f 129 130 145
f 130 131 145
f 131 132 145
f 132 133 145
f 133 134 145
f 134 135 145
f 135 136 145
f 136 137 145
f 137 138 145
f 138 139 145
f 139 140 145
f 140 141 145
f 141 142 145
f 142 143 145
f 143 144 145
f 144 121 145
f 24 23 22 21 20 19 18 17 16 15 14 13 12 11 10 9 8 7 6 5 4 3 2 1
f 148 147 146
f 149 148 146
f 150 149 146
f 151 150 146
f 147 151 146
f 147 148 149 150 151
f 154 153 152
f 155 154 152
f 156 155 152
f 157 156 152
f 153 157 152
f 153 154 155 156 157
f 160 159 158
f 161 160 158
f 162 161 158
f 163 162 158
f 159 163 158
f 159 160 161 162 163
f 166 165 164
f 167 166 164
f 168 167 164
f 169 168 164
f 165 169 164
f 165 166 167 168 169
f 172 171 170
f 173 172 170
f 174 173 170
f 175 174 170
f 171 175 170
f 171 172 173 174 175
f 178 177 176
f 179 178 176
f 180 179 176
f 181 180 176
f 177 181 176
f 177 178 179 180 181
f 184 183 182
f 185 184 182
f 186 185 182
f 187 186 182
f 183 187 182
f 183 184 185 186 187
usemtl stone
f 188 190 191 189
f 190 192 193 191
f 192 194 195 193
f 194 196 197 195
f 196 198 199 197
f 198 200 201 199
f 200 202 203 201
f 202 204 205 203
f 204 206 207 205
f 206 208 209 207
f 208 210 211 209
f 210 212 213 211
f 212 214 215 213
f 214 216 217 215
f 216 218 219 217
f 218 220 221 219
f 220 222 223 221
f 222 224 225 223
f 224 226 227 225
f 226 228 229 227
f 228 230 231 229
f 230 232 233 231
f 232 234 235 233
f 234 236 237 235
f 236 238 239 237
f 238 240 241 239
f 240 242 243 241
f 242 188 189 243
f 243 241 239 237 235 233 231 229 227 225 223 221 219 217 215 213 211 209 207 205 203 201 199 197 195 193 191 189
f 188 190 192 194 196 198 200 202 204 206 208 210 212 214 216 218 220 222 224 226 228 230 232 234 236 238 240 242
usemtl wall
f 244 246 247 245
f 246 248 249 247
f 248 250 251 249
f 250 252 253 251
f 252 254 255 253
f 254 256 257 255
f 256 258 259 257
f 258 260 261 259
f 260 262 263 261
f 262 264 265 263
f 264 266 267 265
f 266 268 269 267
f 268 270 271 269
f 270 272 273 271
f 272 274 275 273
f 274 276 277 275
f 276 278 279 277
f 278 280 281 279
f 280 282 283 281
f 282 284 285 283
f 284 286 287 285
f 286 288 289 287
f 288 290 291 289
f 290 292 293 291
f 292 294 295 293
f 294 296 297 295
f 296 298 299 297
f 298 244 245 299
f 299 297 295 293 291 289 287 285 283 281 279 277 275 273 271 269 267 265 263 261 259 257 255 253 251 249 247 245
f 244 246 248 250 252 254 256 258 260 262 264 266 268 270 272 274 276 278 280 282 284 286 288 290 292 294 296 298
f 300 302 303 301
f 302 304 305 303
f 304 306 307 305
f 306 308 309 307
f 308 310 311 309
f 310 312 313 311
f 312 314 315 313
f 314 316 317 315
f 316 318 319 317
f 318 320 321 319
f 320 322 323 321
f 322 324 325 323
f 324 326 327 325
f 326 328 329 327
f 328 330 331 329
f 330 332 333 331
f 332 334 335 333
f 334 336 337 335
f 336 338 339 337
f 338 340 341 339
f 340 342 343 341
f 342 344 345 343
f 344 346 347 345
f 346 348 349 347
f 348 350 351 349
f 350 352 353 351
f 352 354 355 353
f 354 300 301 355
f 355 353 351 349 347 345 343 341 339 337 335 333 331 329 327 325 323 321 319 317 315 313 311 309 307 305 303 301
f 300 302 304 306 308 310 312 314 316 318 320 322 324 326 328 330 332 334 336 338 340 342 344 346 348 350 352 354
f 356 358 359 357
f 358 360 361 359
f 360 362 363 361
f 362 364 365 363
f 364 366 367 365
f 366 368 369 367
f 368 370 371 369
f 370 356 357 371
f 371 369 367 365 363 361 359 357
f 356 358 360 362 364 366 368 370
usemtl gold
f 372 374 375 373
f 374 376 377 375
f 376 378 379 377
f 378 380 381 379
f 380 382 383 381
f 382 384 385 383
f 384 386 387 385
f 386 372 373 387
f 387 385 383 381 379 377 375 373
f 372 374 376 378 380 382 384 386
usemtl roof
f 389 390 388
f 390 391 388
f 391 392 388
f 392 393 388
f 393 394 388
f 394 395 388
f 395 396 388
f 396 389 388
f 389 390 391 392 393 394 395 396
usemtl wall
f 397 399 400 398
f 399 401 402 400
f 401 403 404 402
f 403 405 406 404
f 405 407 408 406
f 407 409 410 408
f 409 411 412 410
f 411 397 398 412
f 412 410 408 406 404 402 400 398
f 397 399 401 403 405 407 409 411
usemtl gold
f 413 415 416 414
f 415 417 418 416
f 417 419 420 418
f 419 421 422 420
f 421 423 424 422
f 423 425 426 424
f 425 427 428 426
f 427 413 414 428
f 428 426 424 422 420 418 416 414
f 413 415 417 419 421 423 425 427
usemtl roof
f 430 431 429
f 431 432 429
f 432 433 429
f 433 434 429
f 434 435 429
f 435 436 429
f 436 437 429
f 437 430 429
f 430 431 432 433 434 435 436 437
usemtl wall
f 438 440 441 439
f 440 442 443 441
f 442 444 445 443
f 444 446 447 445
f 446 448 449 447
f 448 450 451 449
f 450 452 453 451
f 452 438 439 453
f 453 451 449 447 445 443 441 439
f 438 440 442 444 446 448 450 452
usemtl gold
f 454 456 457 455
f 456 458 459 457
f 458 460 461 459
f 460 462 463 461
f 462 464 465 463
f 464 466 467 465
f 466 468 469 467
f 468 454 455 469
f 469 467 465 463 461 459 457 455
f 454 456 458 460 462 464 466 468
usemtl roof
f 471 472 470
f 472 473 470
f 473 474 470
f 474 475 470
f 475 476 470
f 476 477 470
f 477 478 470
f 478 471 470
f 471 472 473 474 475 476 477 478
usemtl wall
f 479 481 482 480
f 481 483 484 482
f 483 485 486 484
f 485 487 488 486
f 487 489 490 488
f 489 491 492 490
f 491 493 494 492
f 493 479 480 494
f 494 492 490 488 486 484 482 480
f 479 481 483 485 487 489 491 493
usemtl gold
f 495 497 498 496
f 497 499 500 498
f 499 501 502 500
f 501 503 504 502
f 503 505 506 504
f 505 507 508 506
f 507 509 510 508
f 509 495 496 510
f 510 508 506 504 502 500 498 496
f 495 497 499 501 503 505 507 509
usemtl roof
f 512 513 511
f 513 514 511
f 514 515 511
f 515 516 511
f 516 517 511
f 517 518 511
f 518 519 511
f 519 512 511
f 512 513 514 515 516 517 518 519
usemtl wall
f 520 522 523 521
f 522 524 525 523
f 524 526 527 525
f 526 528 529 527
f 528 530 531 529
f 530 532 533 531
f 532 534 535 533
f 534 520 521 535
f 535 533 531 529 527 525 523 521
f 520 522 524 526 528 530 532 534
usemtl gold
f 536 538 539 537
f 538 540 541 539
f 540 542 543 541
f 542 544 545 543
f 544 546 547 545
f 546 548 549 547
f 548 550 551 549
f 550 536 537 551
f 551 549 547 545 543 541 539 537
f 536 538 540 542 544 546 548 550
usemtl roof
f 553 554 552
f 554 555 552
f 555 556 552
f 556 557 552
f 557 558 552
f 558 559 552
f 559 560 552
f 560 553 552
f 553 554 555 556 557 558 559 560
usemtl wall
f 561 563 564 562
f 563 565 566 564
f 565 567 568 566
f 567 569 570 568
f 569 571 572 570
f 571 573 574 572
f 573 575 576 574
f 575 561 562 576
f 576 574 572 570 568 566 564 562
f 561 563 565 567 569 571 573 575
usemtl gold
f 577 579 580 578
f 579 581 582 580
f 581 583 584 582
f 583 585 586 584
f 585 587 588 586
f 587 589 590 588
f 589 591 592 590
f 591 577 578 592
f 592 590 588 586 584 582 580 578
f 577 579 581 583 585 587 589 591
usemtl roof
f 594 595 593
f 595 596 593
f 596 597 593
f 597 598 593
f 598 599 593
f 599 600 593
f 600 601 593
f 601 594 593
f 594 595 596 597 598 599 600 601
usemtl wall
f 602 604 605 603
f 604 606 607 605
f 606 608 609 607
f 608 610 611 609
f 610 612 613 611
f 612 614 615 613
f 614 616 617 615
f 616 602 603 617
f 617 615 613 611 609 607 605 603
f 602 604 606 608 610 612 614 616
usemtl gold
f 618 620 621 619
f 620 622 623 621
f 622 624 625 623
f 624 626 627 625
f 626 628 629 627
f 628 630 631 629
f 630 632 633 631
f 632 618 619 633
f 633 631 629 627 625 623 621 619
f 618 620 622 624 626 628 630 632
usemtl roof
f 635 636 634
f 636 637 634
f 637 638 634
f 638 639 634
f 639 640 634
f 640 641 634
f 641 642 634
f 642 635 634
f 635 636 637 638 639 640 641 642
usemtl wall
f 643 645 646 644
f 645 647 648 646
f 647 649 650 648
f 649 651 652 650
f 651 653 654 652
f 653 655 656 654
f 655 657 658 656
f 657 643 644 658
f 658 656 654 652 650 648 646 644
f 643 645 647 649 651 653 655 657
usemtl gold
f 659 661 662 660
f 661 663 664 662
f 663 665 666 664
f 665 667 668 666
f 667 669 670 668
f 669 671 672 670
f 671 673 674 672
f 673 659 660 674
f 674 672 670 668 666 664 662 660
f 659 661 663 665 667 669 671 673
usemtl roof
f 676 677 675
f 677 678 675
f 678 679 675
f 679 680 675
f 680 681 675
f 681 682 675
f 682 683 675
f 683 676 675
f 676 677 678 679 680 681 682 683
usemtl stone
f 684 686 687 685
f 686 688 689 687
f 688 690 691 689
f 690 692 693 691
f 692 694 695 693
f 694 696 697 695
f 696 698 699 697
f 698 700 701 699
f 700 702 703 701
f 702 704 705 703
f 704 706 707 705
f 706 708 709 707
f 708 710 711 709
f 710 684 685 711
f 711 709 707 705 703 701 699 697 695 693 691 689 687 685
f 684 686 688 690 692 694 696 698 700 702 704 706 708 710
usemtl wall
f 712 714 715 713
f 714 716 717 715
f 716 718 719 717
f 718 720 721 719
f 720 722 723 721
f 722 724 725 723
f 724 726 727 725
f 726 728 729 727
f 728 730 731 729
f 730 732 733 731
f 732 734 735 733
f 734 736 737 735
f 736 738 739 737
f 738 712 713 739
f 739 737 735 733 731 729 727 725 723 721 719 717 715 713
f 712 714 716 718 720 722 724 726 728 730 732 734 736 738
usemtl gold
f 740 742 743 741
f 742 744 745 743
f 744 746 747 745
f 746 748 749 747
f 748 750 751 749
f 750 752 753 751
f 752 754 755 753
f 754 756 757 755
f 756 758 759 757
f 758 760 761 759
f 760 762 763 761
f 762 764 765 763
f 764 766 767 765
f 766 740 741 767
f 767 765 763 761 759 757 755 753 751 749 747 745 743 741
f 740 742 744 746 748 750 752 754 756 758 760 762 764 766
usemtl wall
f 768 770 771 769
f 770 772 773 771
f 772 774 775 773
f 774 776 777 775
f 776 778 779 777
f 778 780 781 779
f 780 782 783 781
f 782 784 785 783
f 784 786 787 785
f 786 788 789 787
f 788 790 791 789
f 790 768 769 791
f 791 789 787 785 783 781 779 777 775 773 771 769
f 768 770 772 774 776 778 780 782 784 786 788 790
usemtl roof
f 793 794 792
f 794 795 792
f 795 796 792
f 796 797 792
f 797 798 792
f 798 799 792
f 799 800 792
f 800 801 792
f 801 802 792
f 802 803 792
f 803 804 792
f 804 793 792
f 793 794 795 796 797 798 799 800 801 802 803 804
usemtl wall
f 805 807 808 806
f 807 809 810 808
f 809 811 812 810
f 811 813 814 812
f 813 815 816 814
f 815 817 818 816
f 817 805 806 818
f 818 816 814 812 810 808 806
f 805 807 809 811 813 815 817
usemtl roof
f 820 821 819
f 821 822 819
f 822 823 819
f 823 824 819
f 824 825 819
f 825 826 819
f 826 820 819
f 820 821 822 823 824 825 826
usemtl wall
f 827 829 830 828
f 829 831 832 830
f 831 833 834 832
f 833 835 836 834
f 835 837 838 836
f 837 839 840 838
f 839 827 828 840
f 840 838 836 834 832 830 828
f 827 829 831 833 835 837 839
usemtl roof
f 842 843 841
f 843 844 841
f 844 845 841
f 845 846 841
f 846 847 841
f 847 848 841
f 848 842 841
f 842 843 844 845 846 847 848
usemtl wall
f 849 851 852 850
f 851 853 854 852
f 853 855 856 854
f 855 857 858 856
f 857 859 860 858
f 859 861 862 860
f 861 849 850 862
f 862 860 858 856 854 852 850
f 849 851 853 855 857 859 861
usemtl roof
f 864 865 863
f 865 866 863
f 866 867 863
f 867 868 863
f 868 869 863
f 869 870 863
f 870 864 863
f 864 865 866 867 868 869 870
usemtl wall
f 871 873 874 872
f 873 875 876 874
f 875 877 878 876
f 877 879 880 878
f 879 881 882 880
f 881 883 884 882
f 883 871 872 884
f 884 882 880 878 876 874 872
f 871 873 875 877 879 881 883
usemtl roof
f 886 887 885
f 887 888 885
f 888 889 885
f 889 890 885
f 890 891 885
f 891 892 885
f 892 886 885
f 886 887 888 889 890 891 892
usemtl house
f 893 894 898 897
f 894 895 899 898
f 895 896 900 899
f 896 893 897 900
f 900 899 898 897
f 893 894 895 896
usemtl roof
f 901 902 906 905
f 903 904 905 906
f 902 903 906
f 904 901 905
usemtl house
f 907 908 912 911
f 908 909 913 912
f 909 910 914 913
f 910 907 911 914
f 914 913 912 911
f 907 908 909 910
usemtl roof
f 915 916 920 919
f 917 918 919 920
f 916 917 920
f 918 915 919
usemtl house
f 921 922 926 925
f 922 923 927 926
f 923 924 928 927
f 924 921 925 928
f 928 927 926 925
f 921 922 923 924
usemtl roof
f 929 930 934 933
f 931 932 933 934
f 930 931 934
f 932 929 933
usemtl house
f 935 936 940 939
f 936 937 941 940
f 937 938 942 941
f 938 935 939 942
f 942 941 940 939
f 935 936 937 938
usemtl roof
f 943 944 948 947
f 945 946 947 948
f 944 945 948
f 946 943 947
usemtl house
f 949 950 954 953
f 950 951 955 954
f 951 952 956 955
f 952 949 953 956
f 956 955 954 953
f 949 950 951 952
usemtl roof
f 957 958 962 961
f 959 960 961 962
f 958 959 962
f 960 957 961
usemtl house
f 963 964 968 967
f 964 965 969 968
f 965 966 970 969
f 966 963 967 970
f 970 969 968 967
f 963 964 965 966
usemtl roof
f 971 972 976 975
f 973 974 975 976
f 972 973 976
f 974 971 975
usemtl house
f 977 978 982 981
f 978 979 983 982
f 979 980 984 983
f 980 977 981 984
f 984 983 982 981
f 977 978 979 980
usemtl roof
f 985 986 990 989
f 987 988 989 990
f 986 987 990
f 988 985 989
usemtl house
f 991 992 996 995
f 992 993 997 996
f 993 994 998 997
f 994 991 995 998
f 998 997 996 995
f 991 992 993 994
usemtl roof
f 999 1000 1004 1003
f 1001 1002 1003 1004
f 1000 1001 1004
f 1002 999 1003
usemtl house
f 1005 1006 1010 1009
f 1006 1007 1011 1010
f 1007 1008 1012 1011
f 1008 1005 1009 1012
f 1012 1011 1010 1009
f 1005 1006 1007 1008
usemtl roof
f 1013 1014 1018 1017
f 1015 1016 1017 1018
f 1014 1015 1018
f 1016 1013 1017
usemtl house
f 1019 1020 1024 1023
f 1020 1021 1025 1024
f 1021 1022 1026 1025
f 1022 1019 1023 1026
f 1026 1025 1024 1023
f 1019 1020 1021 1022
usemtl roof
f 1027 1028 1032 1031
f 1029 1030 1031 1032
f 1028 1029 1032
f 1030 1027 1031
usemtl house
f 1033 1034 1038 1037
f 1034 1035 1039 1038
f 1035 1036 1040 1039
f 1036 1033 1037 1040
f 1040 1039 1038 1037
f 1033 1034 1035 1036
usemtl roof
f 1041 1042 1046 1045
f 1043 1044 1045 1046
f 1042 1043 1046
f 1044 1041 1045
usemtl house
f 1047 1048 1052 1051
f 1048 1049 1053 1052
f 1049 1050 1054 1053
f 1050 1047 1051 1054
f 1054 1053 1052 1051
f 1047 1048 1049 1050
usemtl roof
f 1055 1056 1060 1059
f 1057 1058 1059 1060
f 1056 1057 1060
f 1058 1055 1059
usemtl house
f 1061 1062 1066 1065
f 1062 1063 1067 1066
f 1063 1064 1068 1067
f 1064 1061 1065 1068
f 1068 1067 1066 1065
f 1061 1062 1063 1064
usemtl roof
f 1069 1070 1074 1073
f 1071 1072 1073 1074
f 1070 1071 1074
f 1072 1069 1073
usemtl house
f 1075 1076 1080 1079
f 1076 1077 1081 1080
f 1077 1078 1082 1081
f 1078 1075 1079 1082
f 1082 1081 1080 1079
f 1075 1076 1077 1078
usemtl roof
f 1083 1084 1088 1087
f 1085 1086 1087 1088
f 1084 1085 1088
f 1086 1083 1087
usemtl house
f 1089 1090 1094 1093
f 1090 1091 1095 1094
f 1091 1092 1096 1095
f 1092 1089 1093 1096
f 1096 1095 1094 1093
f 1089 1090 1091 1092
usemtl roof
f 1097 1098 1102 1101
f 1099 1100 1101 1102
f 1098 1099 1102
f 1100 1097 1101
usemtl house
f 1103 1104 1108 1107
f 1104 1105 1109 1108
f 1105 1106 1110 1109
f 1106 1103 1107 1110
f 1110 1109 1108 1107
f 1103 1104 1105 1106
usemtl roof
f 1111 1112 1116 1115
f 1113 1114 1115 1116
f 1112 1113 1116
f 1114 1111 1115
usemtl wall
f 1117 1119 1120 1118
f 1119 1121 1122 1120
f 1121 1123 1124 1122
f 1123 1125 1126 1124
f 1125 1127 1128 1126
f 1127 1129 1130 1128
f 1129 1117 1118 1130
f 1130 1128 1126 1124 1122 1120 1118
f 1117 1119 1121 1123 1125 1127 1129
usemtl roof
f 1132 1133 1131
f 1133 1134 1131
f 1134 1135 1131
f 1135 1136 1131
f 1136 1137 1131
f 1137 1138 1131
f 1138 1132 1131
f 1132 1133 1134 1135 1136 1137 1138
usemtl wall
f 1139 1141 1142 1140
f 1141 1143 1144 1142
f 1143 1145 1146 1144
f 1145 1147 1148 1146
f 1147 1149 1150 1148
f 1149 1151 1152 1150
f 1151 1139 1140 1152
f 1152 1150 1148 1146 1144 1142 1140
f 1139 1141 1143 1145 1147 1149 1151
usemtl roof
f 1154 1155 1153
f 1155 1156 1153
f 1156 1157 1153
f 1157 1158 1153
f 1158 1159 1153
f 1159 1160 1153
f 1160 1154 1153
f 1154 1155 1156 1157 1158 1159 1160
usemtl wall
f 1161 1163 1164 1162
f 1163 1165 1166 1164
f 1165 1167 1168 1166
f 1167 1169 1170 1168
f 1169 1171 1172 1170
f 1171 1173 1174 1172
f 1173 1161 1162 1174
f 1174 1172 1170 1168 1166 1164 1162
f 1161 1163 1165 1167 1169 1171 1173
usemtl roof
f 1176 1177 1175
f 1177 1178 1175
f 1178 1179 1175
f 1179 1180 1175
f 1180 1181 1175
f 1181 1182 1175
f 1182 1176 1175
f 1176 1177 1178 1179 1180 1181 1182
usemtl wall
f 1183 1185 1186 1184
f 1185 1187 1188 1186
f 1187 1189 1190 1188
f 1189 1191 1192 1190
f 1191 1193 1194 1192
f 1193 1195 1196 1194
f 1195 1183 1184 1196
f 1196 1194 1192 1190 1188 1186 1184
f 1183 1185 1187 1189 1191 1193 1195
usemtl roof
f 1198 1199 1197
f 1199 1200 1197
f 1200 1201 1197
f 1201 1202 1197
f 1202 1203 1197
f 1203 1204 1197
f 1204 1198 1197
f 1198 1199 1200 1201 1202 1203 1204
`;
//const levelModules = import.meta.glob("/src/logs/*.json", { eager: true });

const levelModules = import.meta.glob("./logs/*.json", {
  eager: true,
});

function findLevelData(gameId) {
  const entry = Object.entries(logScenes).find(([path]) => {
    const filename = path.split("/").pop().replace(".json", "");
    return filename === gameId;
  });
  if (!entry) return null;

  const raw = entry[1].default ?? entry[1];
  return Array.isArray(raw) ? raw[0] : raw;
}

function App() {
  //let { log_id } = useParams();
  async function getLogs(game_id) {
    const levelModule = await import(`./logs/${game_id}.json`);
    return levelModule.default;
  }
  //console.log(log_id);
  //let myData = levelModules[`./logs/${log_id}.json`].default;

  return (
    <div className="pt-100 min-h-screen bg-slate-900 text-white">
      {/* Navbar Container */}
      <Nav></Nav>

      {/* Main Content Area */}
      <main className="pt-96" style={{ paddingTop: "250px" }}>
        <Routes>
          <Route path="/" element={<LevelList />} />
          <Route path="/game" element={<LevelList />} />

          <Route path="/level-list" element={<LevelList />} />

          {/* list views*/}
          <Route path="/pensieve/" element={<Fantasy_Grid />} />
          <Route path="/game/" element={<LevelList />} />
          <Route path="/view-logs/" element={<LogViewer />} />

          {/* detail views*/}
          <Route path="/game/:game_id" element={<Game />} />
          <Route path="/view-logs/:log_id" element={<LogViewer />} />
          <Route path="/pensieve/:fantasy_id" element={<Pensieve />} />

          <Route path="/edit/" element={<Game_Editor />} />
          <Route path="/edit/:game_id" element={<Game_Editor />} />
          {/* <Route path="/cube" element={<Cube />} />*/}

          <Route path="/debug/:game_id" element={<Debugging />} />
          <Route path="/blog" element={<Blog />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
