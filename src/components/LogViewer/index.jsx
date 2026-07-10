import * as THREE from "three/webgpu";
import { useRef, useState, useEffect } from "react";

const SHOT_PRESETS = {
  medium_two_shot: { distance: 4, height: 1.5, fov: 45 },
  close_up: { distance: 1.2, height: 1.6, fov: 35 },
  wide: { distance: 7, height: 2, fov: 50 },
};

import { Routes, Route, Link, useParams } from "react-router-dom";
async function getLogs(game_id) {
  const levelModule = await import(`../../logs/onyxia.json`);
  // const levelModule = await import(`./logs/${game_id}.json`);
  return levelModule.default;
}
export default function LogViewer() {
  let { log_id } = useParams();
  console.log(log_id);

  useEffect(() => {
    let cleanUpThreeScene;

    getLogs(log_id).then((data) => console.log("log gotten ", data));
    // .then((data) => {
    // console.log("uhoh", data);
    // if (canvasRef.current) {
    //   cleanUpThreeScene = renderWorld(
    //     data,
    //     canvasRef.current,
    //     containerRef.current,
    //   );
    // }
  });

  const pathSegments = window.location.pathname.split("/");
  const logName = pathSegments[pathSegments.length - 1] || "onyxia";
  //console.log(pathSegments, logName);
  // 1. Store the loaded dynamic JSON data in state
  const [myData, setMyData] = useState(null);

  const mountRef = useRef(null);
  const [currentLine, setCurrentLine] = useState(null);
  const [debugTarget, setDebugTarget] = useState(null);

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const targetsRef = useRef([]);

  // 2. Separate Effect to handle dynamic file importing safely without async/await
  useEffect(() => {
    import(`../../logs/${logName}.json`)
      .then((logDataModule) => {
        setMyData(logDataModule.default);
      })
      .catch((err) => {
        console.error("Failed to load log data:", err);
      });
  }, [logName]);

  // 3. Main Three.js loop (only runs once data has successfully loaded)
  useEffect(() => {
    if (!myData) return; // Wait until data is loaded

    const mount = mountRef.current;
    if (!mount) return;

    let renderer;
    let frameId;
    let disposed = false;

    // Converted to a standard function using .then() chaining instead of async/await
    function init() {
      renderer = new THREE.WebGPURenderer({ antialias: true });

      renderer
        .init()
        .then(() => {
          if (disposed) return;

          const width = mount.clientWidth || 1;
          const height = mount.clientHeight || 1;
          renderer.setSize(width, height);
          renderer.setPixelRatio(window.devicePixelRatio);
          mount.appendChild(renderer.domElement);

          const scene = new THREE.Scene();
          scene.background = new THREE.Color(0x1a1a1a);
          sceneRef.current = scene;

          const camera = new THREE.PerspectiveCamera(
            45,
            width / height,
            0.1,
            100,
          );
          camera.position.set(0, 1.6, 4);
          camera.lookAt(0, 1, 0);
          cameraRef.current = camera;

          const { lighting } = myData.setting ?? {};
          const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
          keyLight.position.set(-3, 4, 2);
          if (lighting?.colorTemp)
            keyLight.color = kelvinToColor(lighting.colorTemp);
          scene.add(keyLight);
          scene.add(new THREE.AmbientLight(0x404040, 0.6));

          const debugCube = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshBasicMaterial({ color: 0xff0000 }),
          );
          debugCube.name = "debug_cube";
          scene.add(debugCube);

          const participantMeshes = {};
          (myData.participants ?? []).forEach((p, i) => {
            const geo = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8);
            const mat = new THREE.MeshStandardMaterial({
              color: p.role === "therapist" ? 0x5577aa : 0xaa7755,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(i === 0 ? -1 : 1, 0.9, 0);
            mesh.name = p.id;
            scene.add(mesh);
            participantMeshes[p.id] = mesh;
          });

          targetsRef.current = scene.children.filter((obj) => obj.isMesh);

          const timeline = myData.timeline ?? [];
          let startTime = performance.now();
          let manualOverride = false;

          function applyShot(entry) {
            const preset =
              SHOT_PRESETS[entry.camera?.shot] ?? SHOT_PRESETS.medium_two_shot;
            const focusMesh = participantMeshes[entry.camera?.focus];
            const focusPos = focusMesh
              ? focusMesh.position
              : new THREE.Vector3(0, 0.9, 0);
            camera.fov = preset.fov;
            camera.position.set(focusPos.x, preset.height, preset.distance);
            camera.lookAt(focusPos.x, focusPos.y, focusPos.z);
            camera.updateProjectionMatrix();
          }

          function animate() {
            if (!manualOverride) {
              const elapsed = (performance.now() - startTime) / 1000;
              const active = [...timeline]
                .reverse()
                .find((e) => e.t <= elapsed);
              if (active && active !== animate.lastEntry) {
                animate.lastEntry = active;
                applyShot(active);
                setCurrentLine(active);
              }
            }
            renderer
              .renderAsync(scene, camera)
              .catch((err) => console.error("render error:", err));
            frameId = requestAnimationFrame(animate);
          }
          animate();

          init.setManualOverride = (val) => {
            manualOverride = val;
          };

          const resizeObserver = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            if (width === 0 || height === 0) return;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
          });
          resizeObserver.observe(mount);

          init.cleanup = () => {
            resizeObserver.disconnect();
            cancelAnimationFrame(frameId);
            renderer.dispose();
            if (renderer.domElement.parentNode === mount) {
              mount.removeChild(renderer.domElement);
            }
          };
        })
        .catch((err) => console.error("Renderer initialization failed:", err));
    }

    init();

    return () => {
      disposed = true;
      init.cleanup?.();
    };
  }, [myData]); // Trigger this effect once myData is loaded

  function pointAtRandomObject() {
    const camera = cameraRef.current;
    const targets = targetsRef.current;
    if (!camera || !targets.length) return;

    const obj = targets[Math.floor(Math.random() * targets.length)];
    const pos = obj.position;

    const angle = Math.random() * Math.PI * 2;
    const distance = 2.5 + Math.random() * 2;
    camera.position.set(
      pos.x + Math.cos(angle) * distance,
      pos.y + 1 + Math.random(),
      pos.z + Math.sin(angle) * distance,
    );
    camera.lookAt(pos.x, pos.y, pos.z);
    camera.updateProjectionMatrix();

    setDebugTarget(obj.name);
  }

  // 4. Return a placeholder while the log JSON is loading asynchronously behind the scenes
  if (!myData) {
    return (
      <div style={{ color: "white", padding: 20 }}>Loading log data...</div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        ref={mountRef}
        style={{
          width: "100%",
          height: "100%",
          minWidth: "300px",
          minHeight: "300px",
        }}
      />

      <button
        onClick={pointAtRandomObject}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          padding: "8px 14px",
          borderRadius: 6,
          border: "none",
          background: "#e05555",
          color: "white",
          fontFamily: "sans-serif",
          cursor: "pointer",
        }}
      >
        🎯 Point at random object
      </button>

      {debugTarget && (
        <div
          style={{
            position: "absolute",
            top: 60,
            right: 16,
            padding: "4px 10px",
            background: "rgba(0,0,0,0.6)",
            color: "white",
            fontFamily: "monospace",
            fontSize: 12,
            borderRadius: 4,
          }}
        >
          targeting: {debugTarget}
        </div>
      )}

      {currentLine && (
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 24,
            right: 24,
            padding: "12px 16px",
            background: "rgba(0,0,0,0.6)",
            color: "white",
            borderRadius: 8,
            fontFamily: "sans-serif",
          }}
        >
          <strong>{currentLine.speaker}</strong>: {currentLine.line}
        </div>
      )}
    </div>
  );
}

function kelvinToColor(kelvin) {
  const temp = kelvin / 100;
  let r, g, b;
  if (temp <= 66) {
    r = 255;
    g = 99.47 * Math.log(temp) - 161.12;
  } else {
    r = 329.7 * Math.pow(temp - 60, -0.13);
    g = 288.12 * Math.pow(temp - 60, -0.0755);
  }
  b = temp >= 66 ? 255 : temp <= 19 ? 0 : 138.52 * Math.log(temp - 10) - 305.04;
  return new THREE.Color(
    THREE.MathUtils.clamp(r, 0, 255) / 255,
    THREE.MathUtils.clamp(g, 0, 255) / 255,
    THREE.MathUtils.clamp(b, 0, 255) / 255,
  );
}
