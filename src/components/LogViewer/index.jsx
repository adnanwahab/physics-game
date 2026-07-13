const SHOT_PRESETS = {
  medium_two_shot: { distance: 4, height: 1.5, fov: 45 },
  close_up: { distance: 1.2, height: 1.6, fov: 35 },
  wide: { distance: 7, height: 2, fov: 50 },
};

// Mock function for missing imports in the snippet
async function getLogs(game_id) {
  return {};
}

function Viewport({ sceneJson }) {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    engineRef.current = new SimulationEngine(canvasRef);
    return () => engineRef.current.dispose();
  }, []);

  useEffect(() => {
    engineRef.current?.loadScene(sceneJson);
  }, [sceneJson]);

  return (
    <div
      ref={containerRef}
      style={{ color: "pink", width: "100%", height: "100%" }}
    >
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}

import dalaranUrl from "../../../public/dalaran.obj?url";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
const objLoader = new OBJLoader();

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

import UI from "./ui";

export default function LogViewer() {
  return (
    <>
      <UI></UI>
    </>
  );
}
