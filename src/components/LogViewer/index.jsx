import { useEffect, useRef, useState } from "react";
// Mock function for missing imports in the snippet
async function getLogs(game_id) {
  return {};
}

import dalaranUrl from "../../../public/dalaran.obj?url";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
const objLoader = new OBJLoader();

import UI from "./ui";
import ViewerEngine from "./ViewerEngine";

export default function LogViewe({ dalaran, myData }) {
  const engineRef = useRef(null);
  const canvasRef = useRef(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [currentLine, setCurrentLine] = useState(0);

  let maxTime = 10;

  useEffect(() => {
    if (!myData || !canvasRef.current)
      return console.log("no mydata/mountref!");

    const engine = new ViewerEngine(
      canvasRef,
      dalaran,
      {
        myData,
        maxTime,
        onTimeUpdate: (time, activeLine) => {
          // setCurrentTime(time);
          // setCurrentLine(activeLine || null);
        },
      },
      [myData, maxTime],
    );

    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  });
  return (
    <>
      <div className="">
        <canvas
          width="500"
          height="500"
          className="margin 0 auto bg-purple-500

                  "
          ref={canvasRef}
        />
      </div>
      <UI></UI>
    </>
  );
}
