import { useRef } from "react";

function Game_Editor() {
  const canvasRef = useRef(null);

  return (
    <canvas
      ref={canvasRef}
      id="canvas"
      className=" bg-purple-500
                  block w-full h-full
                  max-h-[200px] sm:max-h-[240px] md:max-h-[380px] lg:max-h-[80vh]
                  aspect-video
              "
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
}

export default Game_Editor;
