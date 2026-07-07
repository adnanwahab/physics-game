import React, { useRef, useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import WASDControls from "../components/WASDControls";
import { Clock, Scene } from "three";
import { initGraphics } from "../modules/graphics/initGraphics.js";
import { onWindowResize as handleWindowResize } from "../utils/onWindowResize.js";
import { initPhysics } from "../modules/physics/initPhysics.js";
import { renderLoop } from "../utils/renderLoop.js";
import { setupExample } from "../utils/setupExample.js";
import { handleUserInput } from "../utils/handleUserInput.js";
import initJolt from "../utils/jolt-physics.wasm-compat.js";
import { setupLighting } from "../modules/graphics/lighting.js";
import loadLevelCuboids from "../utils/loadLevelCuboids.js";
import { setupCanvas2 } from "../utils/setupCanvas2.js";
import { setupSelectionSystem } from "../utils/setupSelectionSystem.js";
import createRemotePenguinMesh from "../utils/createRemotePenguinMesh.js";
import { colorFromId } from "../utils/colorFromId.js";
import GameVideoSeekBar from "../components/GameVideoSeekBar.jsx";
import AnnotationsPanel from "../components/AnnotationsPanel.jsx";

const SERVER = "http://localhost:3000";

import { createPenguin } from "../utils/createPenguin.js";

// Define SlotButton here to avoid inline function in JSX
function SlotButton({ slot }) {
  return (
    <button
      className="
                w-14 h-14 md:w-16 md:h-16
                rounded-lg border-4 border-yellow-600
                bg-gradient-to-br from-[#18181b] to-[#36362c]
                shadow-[0_2px_8px_#000a]
                relative transition hover:scale-105 hover:border-yellow-400
                flex items-center justify-center
                overflow-hidden
            "
      style={{
        boxShadow:
          "0 0 10px 2px #d6ad60, 0 1px 1px #000a, inset 0 1px 4px #fff5",
        borderImage: "linear-gradient(35deg, #d6ad60 50%, #9c7b16 100%) 1",
      }}
    >
      {/* Replace with icon if available */}
      <span className="text-yellow-300 font-extrabold text-xl md:text-2xl pointer-events-none select-none drop-shadow">
        {slot}
      </span>
    </button>
  );
}

//
//
//

function Dashboard(penguinList) {
  return (
    <>
      <div>penguins: {JSON.stringify(penguinList)}</div>
      <div>notes: 0</div>
    </>
  );
}

export default function Game() {
  let websocket_system = new WebSocket("ws://localhost:8000");
  let lobby = [];
  websocket_system.onopen = () =>
    websocket_system.send(JSON.stringify({ type: "join", room: "lobby" }));
  websocket_system.onmessage = (e) => {
    console.log("onmessage", e);
    penguinList.push({
      id: Math.random() * 100,
      x: 0,
      y: 1,
      z: 0,
    });
  };
  websocket_system.onclose = () => console.log("closed");
  websocket_system.onerror = (e) => console.error(e);

  let penguinList = [];
  window.false_idol = penguinList;

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
    {
      title: "Golden Cheese",
      text: "Find and touch the golden cheese block to complete the level!",
      location: { x: 6, y: 4, z: 17 },
      color: "#ffd700",
    },
    {
      title: "Physics Tower",
      text: "This tower can be climbed. Try jumping from ledge to ledge.",
      location: { x: -5, y: 0, z: 38 },
      color: "#12d9fb",
    },
    {
      title: "Desk Zone",
      text: "NPCs sitting at this desk.",
      location: { x: -12, y: 0, z: -22 },
      color: "#a5a9ff",
    },
    {
      title: "Gate Platform",
      text: "Try jumping on the spiked gate for a better view.",
      location: { x: 0, y: 4, z: -39.9 },
      color: "#ff69b4",
    },
  ]);
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
    charBody: null,
  });

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current || !canvasRef2.current)
      return;
    const canvas = canvasRef.current;
    const canvas2 = canvasRef2.current;
    const { renderer, scene, camera, controls } = initGraphics(
      canvas,
      containerRef.current,
      {
        width: window.innerWidth * 0.9,
        height: window.innerHeight * 0.9,
      },
    );
    let id_pool = {};

    for (let i = 0; i < 100; i++) {
      let newPenguin = { scale: 0, x: 0, y: 0, z: 0, id: i };
      id_pool[i] = newPenguin;
      window.id_pool = id_pool;

      penguinList.push(newPenguin);

      let penguin = createPenguin(
        i,
        1,
        Math.random() * 10,
        Math.random() * 10,
        Math.random() * 10,
      );
      scene.add(penguin);
    }

    // ws.addEventListener('message', (event) => {
    //   const data = JSON.parse(event.data);

    //   if (data.type === 'penguinAdded') {
    //     scene.add(createPenguin())
    //   }
    //   if (data.type === 'penguinMoved') {

    //     scene.traverse((object) => {
    //       let {x,y,z} = data
    //       object.setPosition(x,y,z)
    //     })
    //   }
    // });

    // const ws = new WebSocket("ws://localhost:8000");
    // ws.onopen = () => ws.send(JSON.stringify({ type: "join", room: "lobby" }));

    // ws.onclose = () => console.log("closed");
    // ws.onerror = (e) => console.error(e);

    window.scene = scene;

    setupLighting(scene);
    const clock = new Clock();
    const onExampleUpdateRef = { fn: null };
    Object.assign(gameStateRef.current, {
      renderer,
      scene,
      camera,
      controls,
      clock,
      inputState: inputStateRef.current,
      onExampleUpdateRef,
    });
    const cleanupFunctions = [];
    let isMounted = true;
    const isMountedRef = { current: true };
    const penguinMeshes = {};
    window.penguins = penguinMeshes;
    let myPlayerId = null;

    function getServerUrl() {
      const { protocol, hostname } = window.location;
      return `${protocol}//${hostname}:3000`;
    }

    const pollInterval = setInterval(() => {
      const serverUrl = getServerUrl();
      // fetch logic commented out
    }, 100);
    cleanupFunctions.push(() => clearInterval(pollInterval));

    const { renderer2, camera2 } = setupCanvas2(
      canvas2,
      isMountedRef,
      cleanupFunctions,
      setPointCloudCount,
    );

    const handleResize = () => {
      if (!isMounted) return;
      handleWindowResize(
        { width: window.innerWidth * 0.9, height: window.innerHeight * 0.9 },
        camera,
        renderer,
      );
      const r2 = canvas2.getBoundingClientRect();
      camera2.aspect = r2.width / r2.height;
      camera2.updateProjectionMatrix();
      renderer2.setSize(r2.width, r2.height, false);
    };

    window.addEventListener("resize", handleResize);
    cleanupFunctions.push(() =>
      window.removeEventListener("resize", handleResize),
    );

    initJolt()
      .then(async (Jolt) => {
        if (!isMounted) return;
        try {
          if (typeof renderer.init === "function") await renderer.init();
        } catch (e) {
          console.warn(e);
        }
        const { joltInterface, physicsSystem, bodyInterface } =
          initPhysics(Jolt);
        if (!isMounted) return;
        Object.assign(gameStateRef.current, {
          joltInterface,
          physicsSystem,
          bodyInterface,
          Jolt,
        });
        const dynamicObjects = [];
        gameStateRef.current.dynamicObjects = dynamicObjects;

        gameStateRef.current.selectionSystem = setupSelectionSystem(
          scene,
          camera,
          canvas,
          cleanupFunctions,
        );

        const charBody = setupExample(
          Jolt,
          bodyInterface,
          scene,
          dynamicObjects,
          onExampleUpdateRef,
          game_id,
        );
        gameStateRef.current.charBody = charBody;

        loadLevelCuboids(game_id, Jolt, bodyInterface, scene, dynamicObjects)
          .then(({ cheesePosition, effectUpdaters, effectDisposers }) => {
            Object.assign(gameStateRef.current, {
              cheesePosition,
              effectUpdaters,
              effectDisposers,
            });
          })
          .catch((e) => console.error("Error loading level cuboids:", e));

        handleUserInput(inputStateRef.current);

        // Send this player's position to the server every 3 frames
        let syncTick = 0;
        function onExampleUpdate(time, deltaTime) {
          if (onExampleUpdateRef.fn)
            onExampleUpdateRef.fn(time, deltaTime, inputStateRef.current);
          if (gameStateRef.current.effectUpdaters)
            gameStateRef.current.effectUpdaters.forEach((u) => u(deltaTime));
          if (++syncTick % 3 === 0 && myPlayerId && charBody) {
            const pos = bodyInterface.GetPosition(charBody.GetID());
            fetch(`${SERVER}/playerMoveInRoom`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: myPlayerId,
                x: pos.GetX(),
                y: pos.GetY(),
                z: pos.GetZ(),
              }),
            }).catch(() => {});
          }
        }

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
          [],
        );
      })
      .catch((e) => console.error("Error initializing game:", e));

    return () => {
      isMounted = false;
      isMountedRef.current = false;
      if (myPlayerId) {
        fetch(`${SERVER}/removePlayerFromRoom`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: myPlayerId }),
        }).catch(() => {});
      }
      Object.values(penguinMeshes).forEach(
        (m) =>
          gameStateRef.current.scene && gameStateRef.current.scene.remove(m),
      );
      gameStateRef.current.effectDisposers?.forEach((d) => d());
      cleanupFunctions.forEach((fn) => fn());
      try {
        gameStateRef.current.renderer?.dispose();
      } catch (_) {}
      Object.assign(gameStateRef.current, {
        renderer: null,
        scene: null,
        camera: null,
        controls: null,
      });
    };
  }, [game_id]);

  const handleAddAnnotation = useCallback(() => {
    const note = prompt("What would you like to note?");
    if (note?.trim()) {
      const pastelColors = [
        "#ffd700",
        "#12d9fb",
        "#a5a9ff",
        "#ff69b4",
        "#baffc9",
        "#bdb2ff",
        "#f7a8b8",
      ];
      setAnnotations((prev) => [
        ...prev,
        {
          title: "Custom Note",
          text: note.trim(),
          location: { x: 0, y: 5, z: 0 },
          color: pastelColors[Math.floor(Math.random() * pastelColors.length)],
        },
      ]);
      setAnnotationsPanelVisible(true);
    }
  }, []);

  return (
    <div className="px-2 py-4 md:p-8 bg-black min-h-screen">
      <div className="mb-5 border-b-2 border-gray-200 pb-2 flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <div>
          <h1 className="m-0 text-2xl md:text-4xl font-bold text-white">
            Level {game_id}
          </h1>
          <div className="inline-block bg-[#292a36] text-[#ffd700] font-semibold text-base md:text-lg rounded-lg px-4 py-1 mb-2 mr-4 ml-2 tracking-wide border-2 border-[#ffd700]">
            🐧 {playerCount} playing
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button
            className="bg-[#353535] hover:bg-[#ffd700]/80 text-[#ffd700] font-bold rounded-lg px-4 py-2 text-sm md:text-base transition-colors"
            onClick={() => setCanvas2Visible((v) => !v)}
          >
            Edit World
          </button>
          <button
            className="bg-[#353535] hover:bg-[#ffd700]/80 text-[#ffd700] font-bold rounded-lg px-4 py-2 text-sm md:text-base transition-colors"
            onClick={() => setCanvas2Visible((v) => !v)}
          >
            {canvas2Visible ? "Hide" : "Show"} Canvas2
          </button>
          <GameVideoSeekBar annotations={annotations} />
          <button
            className={`ml-0 md:ml-2 ${annotationsPanelVisible ? "bg-[#ffd700] text-[#111]" : "bg-[#353535] text-[#ffd700]"} border-none rounded-lg px-4 py-2 font-bold text-sm md:text-base transition-colors`}
            onClick={() => setAnnotationsPanelVisible((x) => !x)}
          >
            {annotationsPanelVisible ? "Hide" : "Show"} Annotations
          </button>
        </div>
      </div>
      <div
        ref={containerRef}
        id="container"
        className="relative w-full h-[60vh] sm:h-[80vh] md:h-[90vh] max-w-full overflow-hidden bg-[#181820] rounded-lg"
      >
        <canvas
          ref={canvasRef}
          id="canvas"
          className="
                        block w-full h-full
                        max-h-[200px] sm:max-h-[240px] md:max-h-[380px] lg:max-h-[80vh]
                        aspect-video
                    "
          style={{
            width: "100%",
            height: "100%",
          }}
        />
        {canvas2Visible && (
          <canvas
            ref={canvasRef2}
            onClick={() => {}}
            onMouseDown={handleAddAnnotation}
            id="canvas2"
            className="
                            absolute bg-black/50 border-4 md:border-6 border-dashed border-white
                            top-3 left-3 z-[1010] rounded-xl
                            w-[120px] h-[100px]
                            sm:w-[180px] sm:h-[120px]
                            md:w-[250px] md:h-[220px]
                            transition-all
                        "
            style={{
              backgroundColor: "rgba(0,0,0,0.42)",
            }}
          />
        )}

        <Dashboard penguinList={penguinList}></Dashboard>
        <AnnotationsPanel
          annotations={annotations}
          visible={annotationsPanelVisible}
          onClose={() => setAnnotationsPanelVisible(false)}
        />
      </div>
      <div className="mt-6">
        <WASDControls
          ws={websocket_system}
          inputState={inputStateRef.current}
        />
      </div>
      <div>
        {/* WoW-style 2x3 slot bar */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[1100] flex flex-col items-center justify-center w-auto">
          <div className="flex flex-row gap-2 mb-2">
            <SlotButton slot={1} />
            <SlotButton slot={2} />
            <SlotButton slot={3} />
          </div>
          <div className="flex flex-row gap-2">
            <SlotButton slot={4} />
            <SlotButton slot={5} />
            <SlotButton slot={6} />
          </div>
        </div>
      </div>
      {showWinMessage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[10000]">
          <div className="bg-[#1a1a1a] px-6 py-10 md:px-16 md:py-16 rounded-2xl border-2 border-[#ffd700] text-center">
            <h2 className="text-[#ffd700] text-2xl md:text-4xl mb-4 font-bold">
              🎉 Congratulations! 🎉
            </h2>
            <p className="text-white text-base md:text-2xl m-0">
              You found the cheese!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
