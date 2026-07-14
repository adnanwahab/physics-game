import { useRef, useState, useEffect } from "react";
import { useParams, useNavigate, Outlet } from "react-router-dom";
import ViewerEngine from "./ViewerEngine"; // Import the core engine logic

const levelModules = import.meta.glob("/src/logs/*.json", { eager: true });

export default function UI() {
  let { log_id } = useParams();
  const navigate = useNavigate();

  const pathSegments = window.location.pathname.split("/");
  const logName = pathSegments[pathSegments.length - 1] || "onyxia";

  // States
  const [myData, setMyData] = useState(null);
  const [currentLine, setCurrentLine] = useState(null);

  // Playback & Edit UI States
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [maxTime, setMaxTime] = useState(10);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [cameraMode, setCameraMode] = useState("auto");
  const [annotations, setAnnotations] = useState([]);
  const [noteText, setNoteText] = useState("");

  // Refs
  const mountRef = useRef(null);
  const engineRef = useRef(null);

  // 1. Data Loading Mechanism
  useEffect(() => {
    // Initial Fallback structure template
    setMyData({
      name: "dalaran",
      description: "Cozy dusk living room setup...",
      setting: { lighting: { colorTemp: 3400 } },
      camera: { position: [7, 4.5, 9.5], lookAt: [0, 1, 0] },
      objects: [
        {
          type: "city",
          path: "/dalaran.obj",
          size: [16, 0.1, 12],
          position: [0, -0.05, 0],
        },
      ],
    });

    import(`../../logs/${logName}.json`)
      .then((logDataModule) => {
        const raw = logDataModule.default;
        const data = Array.isArray(raw) ? raw[0] : raw;
        setMyData(data);
        if (data.timeline && data.timeline.length > 0) {
          setMaxTime(data.timeline[data.timeline.length - 1].t + 2);
        } else if (data.objects) {
          setCameraMode("orbit");
        }
      })
      .catch((err) => {
        console.error("Failed to load log data:", err);
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
          ],
        };
        setMyData(fallback);
        setMaxTime(5);
      });
  }, [logName]);
  // 3. Sync State mutations downwards from React state panels down to engine ticking metrics
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateState({
        isPlaying,
        currentTime,
        speed: playbackSpeed,
        mode: cameraMode,
      });
    }
  }, [isPlaying, currentTime, playbackSpeed, cameraMode]);

  const addAnnotation = () => {
    if (!engineRef.current) return;
    const config = engineRef.current.getCurrentCameraConfig();
    const newNote = {
      id: Date.now(),
      time: currentTime.toFixed(2),
      text: noteText || "Manual Bookmark",
      camPosition: config.position,
      camTarget: config.target,
    };
    setAnnotations([...annotations, newNote]);
    setNoteText("");
  };

  const jumpToAnnotation = (ann) => {
    setCameraMode("orbit");
    setCurrentTime(parseFloat(ann.time));
    if (engineRef.current) {
      engineRef.current.jumpToCameraConfig(ann.camPosition, ann.camTarget);
    }
  };

  const handleTakeScreenshot = () => {
    if (engineRef.current) {
      engineRef.current.takeScreenshot(logName);
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
      {/* Left Menu / File Selection */}
      <div>
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
          <input type="range" />
          <button
            onClick={handleTakeScreenshot}
            style={{
              background: "#4a6fa5",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: 4,
              cursor: "pointer",
              margin: "4px 0",
            }}
          >
            📸 Export Screenshot
          </button>
          <button>associate</button>

          {Object.entries(levelModules).map(([key]) => {
            const name = key.split("/").pop().replace(".json", "");
            const isSelected = (log_id || logName) === name;
            return (
              <div
                key={key}
                onClick={() => navigate(`/view/${name}`)}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#2f2f2f")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
                style={{
                  padding: "6px 10px",
                  margin: "2px 4px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 12,
                  userSelect: "none",
                  border: isSelected
                    ? "1px dotted #4a6fa5"
                    : "1px solid transparent",
                  color: isSelected ? "#fff" : "#aaa",
                  background: "transparent",
                }}
              >
                {name}
              </div>
            );
          })}
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

      {/* 3D Viewport Mount */}
      <div style={{ flex: 1, position: "relative" }}>
        <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

        {/* Dynamic Subtitle display overlay */}
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

        {/* Timeline Control Scrub Deck */}
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

      {/* Right Sidebar Control Dock */}
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
        </div>

        {/* Keyframe Bookmarking Form */}
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
              placeholder="Type note description..."
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
