import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useParams } from "react-router-dom";

// Eagerly glob-import every JSON file under src/levels at build time.
// Keys look like "/src/levels/level_1.json"
const levelModules = import.meta.glob("/src/levels/*.json", { eager: true });

function findLevelData(gameId) {
  const entry = Object.entries(levelModules).find(([path]) => {
    const filename = path.split("/").pop().replace(".json", "");
    return filename === gameId;
  });
  if (!entry) return null;

  const raw = entry[1].default ?? entry[1];
  // Level files are arrays containing a single level object, e.g.
  // [{ title, mode, "win-condition", objects: [...] }]
  return Array.isArray(raw) ? raw[0] : raw;
}

function Game_Editor() {
  const canvasRef = useRef(null);
  const { game_id } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [levelData, setLevelData] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // Resolve the JSON for this game_id whenever it changes
  useEffect(() => {
    const data = findLevelData(game_id);
    console.log(data, "data");
    if (!data) {
      setLoadError(`No level JSON found for game_id "${game_id}"`);
      setLevelData(null);
    } else {
      setLoadError(null);
      setLevelData(data);
    }
  }, [game_id]);

  // Build/render the scene whenever levelData changes
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 8, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    renderer.setSize(
      canvasRef.current.clientWidth,
      canvasRef.current.clientHeight,
    );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const meshes = [];
    console.log("levledata", levelData);

    if (levelData?.objects?.length) {
      // Render each object described in the level JSON
      levelData.objects.forEach((obj) => {
        console.log("obj", obj);
        // Level JSON uses "size" for box dimensions; fall back to
        // legacy "scale" key just in case, then [1,1,1] as last resort.
        const geometry = new THREE.BoxGeometry(
          ...(obj.size ?? obj.scale ?? [1, 1, 1]),
        );
        const material = new THREE.MeshBasicMaterial({
          color: obj.color ?? 0x00ff00,
          wireframe: true,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(...(obj.position ?? [0, 0, 0]));
        mesh.rotation.set(...(obj.rotation ?? [0, 0, 0]));
        scene.add(mesh);
        meshes.push(mesh);
      });
    } else {
      // Fallback: original spinning cube if no level data yet / found
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
      });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
      meshes.push(cube);
    }

    // Only auto-spin meshes when we're showing the fallback cube.
    // Real level geometry should stay static; the camera orbits instead.
    const isFallback = !levelData?.objects?.length;
    let angle = 0;

    let animationFrameId;
    const animate = () => {
      if (isFallback) {
        meshes.forEach((m) => {
          m.rotation.x += 0.01;
          m.rotation.y += 0.01;
        });
      } else {
        // Slowly orbit the camera around the loaded level so you can
        // see the whole scene instead of spinning the geometry itself.
        angle += 0.003;
        const radius = 25;
        camera.position.x = Math.sin(angle) * radius;
        camera.position.z = Math.cos(angle) * radius;
        camera.position.y = 8;
        camera.lookAt(0, 0, 0);
      }
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      meshes.forEach((m) => {
        m.geometry.dispose();
        m.material.dispose();
      });
      renderer.dispose();
    };
  }, [levelData]);

  return (
    <div className="relative min-h-screen p-4">
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          add data
        </button>
        {loadError && <span className="text-sm text-red-400">{loadError}</span>}
      </div>
      <canvas
        ref={canvasRef}
        id="canvas"
        className="bg-purple-500 block w-full h-full max-h-[200px] sm:max-h-[240px] md:max-h-[380px] lg:max-h-[80vh] aspect-video"
        style={{ width: "100%", height: "100%" }}
      />
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-purple-500 p-8 rounded-lg shadow-2xl max-w-md w-full mx-4 text-center">
            <h3 className="text-xl font-bold text-white mb-4 tracking-wide uppercase text-purple-400">
              Initialize Braindance
            </h3>
            <p className="text-gray-300 my-6 text-lg border-2 border-dashed border-purple-400/40 p-6 rounded bg-purple-950/20">
              drag your data here to see new braindance mode
            </p>
            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded transition-colors uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Game_Editor;
