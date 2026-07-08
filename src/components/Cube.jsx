import React, { useState, useEffect } from "react";
import "./CubeMenu.css";
import Game_Grid from "./Game_Grid";

const CubeMenu = () => {
  // Store absolute X and Y rotation values
  const [{ rotateX, rotateY }, setRotation] = useState({
    rotateX: 0,
    rotateY: 0,
  });

  // Absolute coordinate map for each face
  const faces = {
    front: { rotateX: 0, rotateY: 0 },
    back: { rotateX: 0, rotateY: 180 },
    right: { rotateX: 0, rotateY: -90 },
    left: { rotateX: 0, rotateY: 90 },
    top: { rotateX: -90, rotateY: 0 },
    bottom: { rotateX: 90, rotateY: 0 },
  };

  // Handler to set absolute face
  const showFace = (faceName) => {
    if (faces[faceName]) {
      setRotation(faces[faceName]);
    }
  };

  // Keyboard listener mapped to absolute faces
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case "ArrowUp":
          showFace("top");
          break;
        case "ArrowDown":
          showFace("bottom");
          break;
        case "ArrowLeft":
          showFace("left");
          break;
        case "ArrowRight":
          showFace("right");
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <div className="scene">
        <div
          className="cube"
          style={{ transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)` }}
        >
          <div className="face front">
            PLAY GAME
            <iframe></iframe>
          </div>
          <div className="face back">
            PENSIEVE(Memories)<iframe></iframe>
          </div>
          <div className="face right">
            PLAY GAME<iframe src="http://localhost:5173/game/0"></iframe>
          </div>
          <div className="face left">
            VOTE_JOURNAL<textarea></textarea>
          </div>
          <div className="face top">
            SYSTEM_DASHBOARD(MAP_OF_MEANING)<iframe></iframe>
          </div>
          <div className="face bottom">
            <Game_Grid></Game_Grid>
          </div>
        </div>
      </div>

      {/* Updated 6-button Control Panel */}
      <div className="controls">
        <button onClick={() => showFace("front")}>Front</button>
        <button onClick={() => showFace("back")}>Back</button>
        <button onClick={() => showFace("left")}>Left</button>
        <button onClick={() => showFace("right")}>Right</button>
        <button onClick={() => showFace("top")}>Top</button>
        <button onClick={() => showFace("bottom")}>Bottom</button>
      </div>

      <p className="instructions">
        Use the control buttons or Arrow Keys (Front/Back excluded from arrows)
        to snap to a side.
      </p>
    </>
  );
};

export default CubeMenu;
