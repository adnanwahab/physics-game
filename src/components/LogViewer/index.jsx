import * as THREE from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js"; // Standard Three.js addon import
import { useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate, Outlet } from "react-router-dom";
const SHOT_PRESETS = {
  medium_two_shot: { distance: 4, height: 1.5, fov: 45 },
  close_up: { distance: 1.2, height: 1.6, fov: 35 },
  wide: { distance: 7, height: 2, fov: 50 },
};
const levelModules = import.meta.glob("/src/logs/*.json", { eager: true });

// Mock function for missing imports in the snippet
async function getLogs(game_id) {
  return {};
}

// Placeholder mesh factory for static level geometry (e.g. mission_control.json's "objects" array)
function createPlaceholder(type, size = [1, 1, 1]) {
  let geometry;
  let material;
  const [w, h, d] = size;

  switch (type) {
    case "desk":
      geometry = new THREE.BoxGeometry(w, h, d);
      material = new THREE.MeshStandardMaterial({
        color: 0x2a3038,
        roughness: 0.6,
        metalness: 0.2,
      });
      break;
    case "monitor":
      geometry = new THREE.BoxGeometry(w, h, d);
      material = new THREE.MeshStandardMaterial({ color: 0x111316 });
      break;
    case "screen":
      geometry = new THREE.BoxGeometry(w, h, d);
      material = new THREE.MeshBasicMaterial({ color: 0x22c7ff });
      break;
    case "chair":
      geometry = new THREE.BoxGeometry(w, h, d);
      material = new THREE.MeshStandardMaterial({
        color: 0x4a5568,
        roughness: 0.6,
        metalness: 0.15,
      });
      break;
    case "person_body":
      geometry = new THREE.BoxGeometry(w, h, d);
      material = new THREE.MeshStandardMaterial({ color: 0x3a5a8c });
      break;
    case "head":
      geometry = new THREE.SphereGeometry(w, 12, 12); // size[0] doubles as radius
      material = new THREE.MeshStandardMaterial({ color: 0xd8a878 });
      break;
    case "flag":
      geometry = new THREE.BoxGeometry(w, h, d);
      material = new THREE.MeshStandardMaterial({ color: 0xb22234 });
      break;
    case "panel":
      geometry = new THREE.BoxGeometry(w, h, d);
      material = new THREE.MeshStandardMaterial({ color: 0x161a20 });
      break;
    case "light":
      geometry = new THREE.BoxGeometry(w, h, d);
      material = new THREE.MeshBasicMaterial({ color: 0xcfe8ff });
      break;
    default:
      geometry = new THREE.BoxGeometry(w, h, d);
      material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
  }

  return new THREE.Mesh(geometry, material);
}

export default function LogViewer() {
  let { log_id } = useParams();
  const navigate = useNavigate();

  const pathSegments = window.location.pathname.split("/");
  const logName = pathSegments[pathSegments.length - 1] || "onyxia";

  // States
  const [myData, setMyData] = useState(null);
  const [currentLine, setCurrentLine] = useState(null);
  const [debugTarget, setDebugTarget] = useState(null);

  // Playback & Edit UI States
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [maxTime, setMaxTime] = useState(10);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [cameraMode, setCameraMode] = useState("auto"); // "auto" or "orbit"
  const [annotations, setAnnotations] = useState([]);
  const [noteText, setNoteText] = useState("");

  // Refs
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const targetsRef = useRef([]);
  const controlsRef = useRef(null);

  // Sync playback refs to prevent React lifecycle race conditions in the animation loop
  const playbackStateRef = useRef({
    isPlaying: true,
    currentTime: 0,
    speed: 1,
    mode: "auto",
  });

  useEffect(() => {
    playbackStateRef.current = {
      isPlaying,
      currentTime,
      speed: playbackSpeed,
      mode: cameraMode,
    };
  }, [isPlaying, currentTime, playbackSpeed, cameraMode]);

  // Load JSON
  useEffect(() => {
    // Replace with your real fallback or endpoint logic
    import(`../../logs/${logName}.json`)
      .then((logDataModule) => {
        const raw = logDataModule.default;
        const data = Array.isArray(raw) ? raw[0] : raw; // unwrap [ { objects, camera } ] shape
        setMyData(data);
        if (data.timeline && data.timeline.length > 0) {
          setMaxTime(data.timeline[data.timeline.length - 1].t + 2);
        } else if (data.objects) {
          // Static level scene (no dialogue timeline) - start in free-fly instead of
          // sitting on a frozen "auto" camera waiting for cuts that will never come.
          setCameraMode("orbit");
        }
      })
      .catch((err) => {
        console.error("Failed to load log data:", err);
        // Fallback fallback data for standalone debugging
        const fallback = {
          setting: { lighting: { colorTemp: 5500 } },
          participants: [
            { id: "p1", role: "therapist" },
            { id: "p2", role: "patient" },
          ],
          timeline: [
            {
              t: 0,
              speaker: "System",
              line: "Scene Initialized.",
              camera: { shot: "wide", focus: "p1" },
            },
            {
              t: 3,
              speaker: "Therapist",
              line: "Hello, how are we doing today?",
              camera: { shot: "close_up", focus: "p1" },
            },
            {
              t: 7,
              speaker: "Patient",
              line: "I'm feeling a bit anxious about this session.",
              camera: { shot: "medium_two_shot", focus: "p2" },
            },
          ],
        };
        setMyData(fallback);
        setMaxTime(9);
      });
  }, [logName]);

  // Three.js Engine & Loop
  useEffect(() => {
    if (!myData) return;

    const mount = mountRef.current;
    if (!mount) return;

    let renderer;
    let frameId;
    let disposed = false;

    function init() {
      renderer = new THREE.WebGPURenderer({ antialias: true });

      renderer.init().then(() => {
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

        // Respect a level-authored camera (e.g. mission_control.json's
        // { position, lookAt }); fall back to the original hardcoded framing.
        const initialCamPos = myData.camera?.position ?? [0, 1.6, 4];
        const initialLookAt = myData.camera?.lookAt ?? [0, 1, 0];
        camera.position.set(...initialCamPos);
        camera.lookAt(...initialLookAt);
        cameraRef.current = camera;

        // Initialize OrbitControls (Blender style viewport rotation/pan/zoom)
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.target.set(...initialLookAt);
        controlsRef.current = controls;

        const { lighting } = myData.setting ?? {};
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
        keyLight.position.set(-3, 4, 2);
        if (lighting?.colorTemp)
          keyLight.color = kelvinToColor(lighting.colorTemp);
        scene.add(keyLight);
        scene.add(new THREE.AmbientLight(0x404040, 0.6));

        // Grid floor helper like Blender layout mode
        const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
        scene.add(gridHelper);

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

        // Static level geometry, e.g. mission_control.json's "objects" array
        (myData.objects ?? []).forEach((obj) => {
          const mesh = createPlaceholder(obj.type, obj.size);
          if (obj.position) mesh.position.set(...obj.position);
          if (obj.rotation) {
            mesh.rotation.set(
              THREE.MathUtils.degToRad(obj.rotation[0] || 0),
              THREE.MathUtils.degToRad(obj.rotation[1] || 0),
              THREE.MathUtils.degToRad(obj.rotation[2] || 0),
            );
          }
          scene.add(mesh);
        });

        targetsRef.current = scene.children.filter((obj) => obj.isMesh);

        const timeline = myData.timeline ?? [];
        let lastTimeStamp = performance.now();

        function applyShot(entry) {
          const preset =
            SHOT_PRESETS[entry.camera?.shot] ?? SHOT_PRESETS.medium_two_shot;
          const focusMesh = participantMeshes[entry.camera?.focus];
          const focusPos = focusMesh
            ? focusMesh.position
            : new THREE.Vector3(0, 0.9, 0);

          camera.fov = preset.fov;
          camera.position.set(focusPos.x, preset.height, preset.distance);
          controls.target.copy(focusPos);
          camera.lookAt(focusPos.x, focusPos.y, focusPos.z);
          camera.updateProjectionMatrix();
        }

        function animate() {
          const now = performance.now();
          const delta = (now - lastTimeStamp) / 1000;
          lastTimeStamp = now;

          const state = playbackStateRef.current;

          if (state.isPlaying) {
            let nextTime = state.currentTime + delta * state.speed;
            if (nextTime > maxTime) nextTime = 0; // Loop timeline
            setCurrentTime(nextTime);
            playbackStateRef.current.currentTime = nextTime;
          }

          // Active timeline logging logic
          const active = [...timeline]
            .reverse()
            .find((e) => e.t <= state.currentTime);
          if (active && active !== animate.lastEntry) {
            animate.lastEntry = active;
            setCurrentLine(active);
            if (state.mode === "auto") {
              applyShot(active);
            }
          }

          if (state.mode === "orbit") {
            controls.update(); // Only run interactive matrix changes when user takes manual tracking
          }

          renderer
            .renderAsync(scene, camera)
            .catch((err) => console.error("render error:", err));
          frameId = requestAnimationFrame(animate);
        }

        animate();

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
          controls.dispose();
          renderer.dispose();
          if (renderer.domElement.parentNode === mount) {
            mount.removeChild(renderer.domElement);
          }
        };
      });
    }

    init();

    return () => {
      disposed = true;
      init.cleanup?.();
    };
  }, [myData, maxTime]);

  const addAnnotation = () => {
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    const newNote = {
      id: Date.now(),
      time: currentTime.toFixed(2),
      text: noteText || "Manual Bookmark",
      camPosition: cam.position.clone().toArray(),
      camTarget: controlsRef.current
        ? controlsRef.current.target.clone().toArray()
        : [0, 1, 0],
    };
    setAnnotations([...annotations, newNote]);
    setNoteText("");
  };

  const jumpToAnnotation = (ann) => {
    setCameraMode("orbit");
    setCurrentTime(parseFloat(ann.time));
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.fromArray(ann.camPosition);
      controlsRef.current.target.fromArray(ann.camTarget);
      cameraRef.current.updateProjectionMatrix();
    }
  };

  if (!myData) {
    return (
      <div style={{ color: "white", padding: 20 }}>
        Loading log dataset engine...
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        background: "#111",
        overflow: "hidden",
        display: "flex",
      }}
    >
      <div>
        {" "}
        <div
          style={{
            width: 320,
            background: "#1e1e1e",
            borderLeft: "1px solid #333",
            display: "flex",
            flexDirection: "column",
            fontFamily: "sans-serif",
            color: "#e0e0e0",
            paddingTop: "100px",
          }}
        >
          {Object.entries(levelModules).map(([key, value]) => (
            <div key={key} onMouseEnter={() => navigate(`/view/therapy`)}>
              {key}
            </div>
          ))}
          {/* <div onMouseEnter={() => navigate(`/view/onyxia`)}>scene 1</div>
          <div onMouseEnter={() => navigate(`/view/therapy`)}>scene 2</div>
          <div onMouseEnter={() => navigate(`/view/algalon`)}>scene 3</div>*/}
          <div style={{ flex: 1 }}>
            <Outlet />
          </div>
          <div
            onMouseEnter={() =>
              navigate(`/view/mission_control_initiative_space_force`)
            }
          >
            scene 1
          </div>
          <div onMouseEnter={() => navigate(`/view/z__petting_cat`)}>
            cat pet
          </div>
        </div>
      </div>
      {/* 3D Viewport mount area */}
      <div style={{ flex: 1, position: "relative" }}>
        <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

        {/* Viewport Subtitle Overlays */}
        {currentLine && (
          <div
            style={{
              position: "absolute",
              bottom: 100,
              left: "50%",
              transform: "translateX(-50%)",
              padding: "12px 24px",
              background: "rgba(0,0,0,0.85)",
              border: "1px solid #333",
              color: "white",
              borderRadius: 8,
              fontFamily: "sans-serif",
              textAlign: "center",
              minWidth: 300,
            }}
          >
            <strong style={{ color: "#e05555" }}>{currentLine.speaker}</strong>:{" "}
            {currentLine.line}
          </div>
        )}

        {/* Timeline Timeline Deck scrubbing bar */}
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            right: 16,
            background: "rgba(25, 25, 25, 0.9)",
            border: "1px solid #3c3c3c",
            borderRadius: 8,
            padding: 12,
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontFamily: "monospace",
            color: "#ccc",
          }}
        >
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              padding: "6px 12px",
              background: isPlaying ? "#e05555" : "#44aa55",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            {isPlaying ? "⏸ PAUSE" : "▶ PLAY"}
          </button>

          <div style={{ minWidth: 60 }}>{currentTime.toFixed(2)}s</div>

          <input
            type="range"
            min={0}
            max={maxTime}
            step={0.05}
            value={currentTime}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentTime(parseFloat(e.target.value));
            }}
            style={{ flex: 1, accentColor: "#e05555" }}
          />

          <div style={{ minWidth: 50 }}>{maxTime.toFixed(1)}s</div>

          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            style={{
              background: "#222",
              color: "#fff",
              border: "1px solid #444",
              padding: 4,
              borderRadius: 4,
            }}
          >
            <option value={0.5}>0.5x Speed</option>
            <option value={1}>1.0x Speed</option>
            <option value={2}>2.0x Speed</option>
          </select>
        </div>
      </div>

      {/* Right Sidebar Control Dock (Blender / Director Suite) */}
      <div
        style={{
          width: 320,
          background: "#1e1e1e",
          borderLeft: "1px solid #333",
          display: "flex",
          flexDirection: "column",
          fontFamily: "sans-serif",
          color: "#e0e0e0",
        }}
      >
        {/* Module Title */}
        <div
          style={{
            padding: 14,
            borderBottom: "1px solid #333",
            fontWeight: "bold",
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#888",
          }}
        >
          🎬 Director Rig Control
        </div>

        {/* Camera Logic Switcher */}
        <div style={{ padding: 16, borderBottom: "1px solid #333" }}>
          <label
            style={{
              fontSize: 12,
              display: "block",
              marginBottom: 8,
              color: "#aaa",
            }}
          >
            CAMERA MODE
          </label>
          <div
            style={{
              display: "flex",
              borderRadius: 4,
              overflow: "hidden",
              border: "1px solid #444",
            }}
          >
            <button
              onClick={() => setCameraMode("auto")}
              style={{
                flex: 1,
                padding: 8,
                border: "none",
                cursor: "pointer",
                background: cameraMode === "auto" ? "#3a3a3a" : "#252525",
                color: cameraMode === "auto" ? "#fff" : "#888",
                fontWeight: cameraMode === "auto" ? "bold" : "normal",
              }}
            >
              🤖 Auto Cut
            </button>
            <button
              onClick={() => setCameraMode("orbit")}
              style={{
                flex: 1,
                padding: 8,
                border: "none",
                cursor: "pointer",
                background: cameraMode === "orbit" ? "#4a6fa5" : "#252525",
                color: cameraMode === "orbit" ? "#fff" : "#888",
                fontWeight: cameraMode === "orbit" ? "bold" : "normal",
              }}
            >
              🖱 Manual (Blender)
            </button>
          </div>
          {cameraMode === "orbit" && (
            <p
              style={{
                fontSize: 11,
                color: "#888",
                marginTop: 6,
                marginLeave: 0,
              }}
            >
              💡 Use <strong>Left Mouse</strong> to Orbit,{" "}
              <strong>Right Mouse / Shift+Left</strong> to Pan,{" "}
              <strong>Scroll</strong> to zoom.
            </p>
          )}
        </div>

        {/* Annotations & Editing Bench */}
        <div
          style={{
            padding: 16,
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <label
            style={{
              fontSize: 12,
              display: "block",
              marginBottom: 8,
              color: "#aaa",
            }}
          >
            SCENE ANNOTATION & BOOKMARKS
          </label>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Type note or keyframe description..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              style={{
                flex: 1,
                background: "#2a2a2a",
                border: "1px solid #444",
                borderRadius: 4,
                padding: "6px 10px",
                color: "#fff",
                fontSize: 12,
              }}
            />
            <button
              onClick={addAnnotation}
              style={{
                background: "#4a6fa5",
                color: "white",
                border: "none",
                padding: "0 12px",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              📌 Add
            </button>
          </div>

          {/* Keyframe List */}
          <div
            style={{
              flex: 1,
              background: "#151515",
              borderRadius: 6,
              border: "1px solid #2d2d2d",
              overflowY: "auto",
              padding: 6,
            }}
          >
            {annotations.length === 0 ? (
              <div
                style={{
                  color: "#555",
                  fontSize: 12,
                  textAlign: "center",
                  padding: 20,
                }}
              >
                No custom camera annotations pinned yet.
              </div>
            ) : (
              annotations.map((ann) => (
                <div
                  key={ann.id}
                  onClick={() => jumpToAnnotation(ann)}
                  style={{
                    padding: "8px 10px",
                    background: "#222",
                    border: "1px solid #2d2d2d",
                    borderRadius: 4,
                    marginBottom: 6,
                    cursor: "pointer",
                    fontSize: 12,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "#4a6fa5")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "#2d2d2d")
                  }
                >
                  <span
                    style={{
                      color: "#eee",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: 180,
                    }}
                  >
                    {ann.text}
                  </span>
                  <span style={{ color: "#8a6fcf", fontFamily: "monospace" }}>
                    @{ann.time}s
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Kelvin Color Parser Utility unchanged
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
