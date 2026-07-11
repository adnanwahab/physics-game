import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useParams } from "react-router-dom";

// Eagerly glob-import every JSON file under src/levels at build time.
const levelModules = import.meta.glob("/src/levels/*.json", { eager: true });

function findLevelData(gameId) {
  const entry = Object.entries(levelModules).find(([path]) => {
    const filename = path.split("/").pop().replace(".json", "");
    return filename === gameId;
  });
  if (!entry) return null;

  const raw = entry[1].default ?? entry[1];
  return Array.isArray(raw) ? raw[0] : raw;
}

function Game_Editor() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const { game_id } = useParams();

  // Modals & UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Core Level Objects State (The Single Source of Truth for Three.js)
  const [objects, setObjects] = useState([]);

  // Resolve JSON whenever game_id changes
  useEffect(() => {
    const data = findLevelData(game_id);
    if (!data) {
      setLoadError(
        `No level JSON found for game_id "${game_id}". Initializing sandbox layout.`,
      );
      setObjects([]); // Open empty grid ready to build
    } else {
      setLoadError(null);
      setObjects(data.objects ?? []);
    }
  }, [game_id]);

  // Sync Three.js viewport scene anytime our objects array state updates
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();

    // Add a Grid Helper so RPG maps are clear to read and align
    const gridHelper = new THREE.GridHelper(40, 40, 0x8b5cf6, 0x334155);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    // Add Basic Ambient Lighting so objects aren't pitch black flat wireframes
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 12, 18);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const meshes = [];

    // Render meshes tracked inside the React array state
    objects.forEach((obj) => {
      const geometry = new THREE.BoxGeometry(
        ...(obj.size ?? obj.scale ?? [1, 1, 1]),
      );

      // Using MeshStandardMaterial responds nicer to the new lighting configuration
      const material = new THREE.MeshStandardMaterial({
        color: obj.color ?? 0x00ff00,
        wireframe: obj.wireframe ?? false,
        roughness: 0.4,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...(obj.position ?? [0, 0, 0]));
      mesh.rotation.set(...(obj.rotation ?? [0, 0, 0]));

      scene.add(mesh);
      meshes.push(mesh);
    });

    renderer.render(scene, camera);

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.render(scene, camera);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      meshes.forEach((m) => {
        m.geometry.dispose();
        m.material.dispose();
      });
      gridHelper.geometry.dispose();
      gridHelper.material.dispose();
      renderer.dispose();
    };
  }, [objects]);

  // --- RPG Editing Functions ---

  // Adds a pre-configured entity to the map space
  const addEntity = (type) => {
    // Generate slight random scatter offsets on the plane so objects don't stack directly on top of each other
    const randomX = Math.floor(Math.random() * 10) - 5;
    const randomZ = Math.floor(Math.random() * 10) - 5;

    let newObj = {
      id: crypto.randomUUID(),
      type: type,
      position: [randomX, type === "wall" ? 1.5 : 0.5, randomZ],
      rotation: [0, 0, 0],
    };

    switch (type) {
      case "player":
        newObj.color = 0x3b82f6; // Blue Hero Token
        newObj.size = [1, 2, 1]; // Tall profile
        break;
      case "enemy":
        newObj.color = 0xef4444; // Red Threat Token
        newObj.size = [1.2, 1.2, 1.2];
        break;
      case "wall":
        newObj.color = 0x64748b; // Grey structural boundary
        newObj.size = [4, 3, 0.5];
        break;
      default:
        newObj.color = 0x10b981;
        newObj.size = [1, 1, 1];
    }

    setObjects((prev) => [...prev, newObj]);
  };

  // Resets the screen grid layout completely
  const clearMap = () => {
    if (
      window.confirm("Are you sure you want to clear this battlemap layout?")
    ) {
      setObjects([]);
    }
  };

  // Packages state layout array into a downloadable level JSON pack
  const exportLevelJSON = () => {
    const outputData = [
      {
        game_id: game_id || "sandbox_session",
        mode: "braindance_rpg",
        "win-condition": "defeat_all_threats",
        objects: objects,
      },
    ];

    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(outputData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `level_${game_id || "sandbox"}.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // --- Drag & Drop Backend Pipeline ---
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files.length) return;
    const file = files[0];
    if (!file.name.endsWith(".obj")) {
      alert("Please upload a valid .obj file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("game_id", game_id || "sandbox");

    try {
      const response = await fetch("/api/upload-obj", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        alert("OBJ asset successfully dispatched to server!");
        setIsModalOpen(false);
      } else {
        throw new Error("Upload asset pipeline rejected");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to save OBJ asset to server mapping directory.");
    }
  };

  return (
    <div className="relative h-screen w-screen flex flex-col bg-slate-950 text-white font-sans antialiased">
      {/* HEADER CONTROL CONSOLE BAR */}
      <header className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-wider text-purple-400 uppercase">
            ⚔️ Campaign Blueprint Editor
          </h1>
          {loadError && (
            <span className="text-xs px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
              {loadError}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-xs font-semibold uppercase tracking-wider transition-colors shadow"
          >
            📦 Assets Asset (OBJ)
          </button>
          <button
            onClick={exportLevelJSON}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded text-xs font-semibold uppercase tracking-wider transition-colors shadow"
          >
            💾 Save & Export Map
          </button>
          <button
            onClick={clearMap}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 rounded text-xs font-semibold uppercase tracking-wider transition-colors shadow"
          >
            ☣️ Wipe Board
          </button>
        </div>
      </header>

      {/* CORE FRAMEWORK WORKSPACE CONTAINER */}
      <div className="flex-1 w-full flex min-h-0 relative">
        {/* LEFT TOOLBOX SIDEBAR PANEL */}
        <aside className="w-64 bg-slate-900/90 border-r border-slate-800 p-4 flex flex-col gap-4 shrink-0 z-10">
          <div>
            <h2 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-2">
              Entity Placer
            </h2>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => addEntity("player")}
                className="w-full text-left px-3 py-2 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/50 rounded flex items-center justify-between group transition-all text-sm"
              >
                <span>🧙‍♂️ Spawn Player Token</span>
                <span className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-125 transition-transform" />
              </button>
              <button
                onClick={() => addEntity("enemy")}
                className="w-full text-left px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 rounded flex items-center justify-between group transition-all text-sm"
              >
                <span>👹 Spawn Enemy Entity</span>
                <span className="w-2 h-2 bg-rose-500 rounded-full group-hover:scale-125 transition-transform" />
              </button>
              <button
                onClick={() => addEntity("wall")}
                className="w-full text-left px-3 py-2 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/50 rounded flex items-center justify-between group transition-all text-sm"
              >
                <span>🧱 Erect Wall Obstacle</span>
                <span className="w-2 h-2 bg-slate-400 rounded-full group-hover:scale-125 transition-transform" />
              </button>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-800/60">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1">
              Entity Registry
            </h3>
            <p className="text-xs text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-800">
              Active Map Instances:{" "}
              <strong className="text-purple-400">{objects.length}</strong>
            </p>
          </div>
        </aside>

        {/* 3D MAP ENGINE RENDERING VIEWPORT */}
        <main
          ref={containerRef}
          className="flex-1 h-full min-h-0 relative bg-slate-950"
        >
          <canvas ref={canvasRef} className="block w-full h-full" />
        </main>
      </div>

      {/* DROP-ZONE UPLOAD INTERACTION DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-purple-500 p-8 rounded-lg shadow-2xl max-w-md w-full mx-4 text-center">
            <h3 className="text-xl font-bold text-white mb-4 tracking-wide uppercase text-purple-400">
              Inject Mesh Geometry (.OBJ)
            </h3>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`my-6 text-sm border-2 border-dashed p-8 rounded cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "border-green-400 bg-green-950/30 text-green-300 scale-102"
                  : "border-purple-500/30 bg-purple-950/10 text-gray-400 hover:border-purple-500/50"
              }`}
            >
              {isDragging
                ? "Drop package now"
                : "Drag and drop custom .obj files here to pipe straight into server storage"}
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Game_Editor;
