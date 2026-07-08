import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useParams } from "react-router-dom";

function Game_Editor() {
  const canvasRef = useRef(null);
  const { game_id } = useParams();

  // State to control modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(
    function () {
      if (!canvasRef.current) return;

      // 2. Scene Setup
      const scene = new THREE.Scene();

      // 3. Camera Setup
      const camera = new THREE.PerspectiveCamera(
        75,
        canvasRef.current.clientWidth / canvasRef.current.clientHeight,
        0.1,
        1000,
      );
      camera.position.z = 5;

      // 4. Renderer Setup
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
      });
      renderer.setSize(
        canvasRef.current.clientWidth,
        canvasRef.current.clientHeight,
      );
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // 5. Create the Cube
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
      });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);

      let animationFrameId;

      const animate = () => {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
        animationFrameId = requestAnimationFrame(animate);
      };

      animate();

      // Clean up animation on unmount
      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    },
    [canvasRef],
  );

  return (
    <div className="relative min-h-screen p-4">
      <div className="mb-4">
        {/* Added onClick handler to open the modal */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          add data
        </button>
      </div>

      <canvas
        ref={canvasRef}
        id="canvas"
        className="bg-purple-500 block w-full h-full max-h-[200px] sm:max-h-[240px] md:max-h-[380px] lg:max-h-[80vh] aspect-video"
        style={{
          width: "100%",
          height: "100%",
        }}
      />

      {/* Braindance Modal Backdrop */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          {/* Modal Box */}
          <div className="bg-slate-900 border border-purple-500 p-8 rounded-lg shadow-2xl max-w-md w-full mx-4 text-center">
            <h3 className="text-xl font-bold text-white mb-4 tracking-wide uppercase text-purple-400">
              Initialize Braindance
            </h3>

            {/* Requested Text */}
            <p className="text-gray-300 my-6 text-lg border-2 border-dashed border-purple-400/40 p-6 rounded bg-purple-950/20">
              drag your data here to see new braindance mode
            </p>

            {/* Close Button */}
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
