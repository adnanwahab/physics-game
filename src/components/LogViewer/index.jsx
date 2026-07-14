import { useEffect, useRef, useState } from "react";
import { Routes, Route, Link, useParams } from "react-router-dom";

// Mock function for missing imports in the snippet
async function getLogs(game_id) {
  return {};
}

//FIXME
//import dalaranUrl from "./therapy.obj";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
const objLoader = new OBJLoader();

import UI from "./ui";
import ViewerEngine from "./ViewerEngine";

const logs = import.meta.glob("../../logs/*.json");
console.log("logs", logs);

export default function LogViewer({}) {
  let { log_id } = useParams();
  console.log("log_id", log_id, logs);
  async function getLogs(game_id) {
    //console.log("logGetter", `../../logs/${game_id}.json`);
    const levelModule = (await logs[`../../logs/${game_id}.json`])();
    return levelModule;
  }
  let levelModules = getLogs(log_id).then((_) => console.log(_));
  //let myData = levelModules; //levelModules[`./logs/${log_id}.json`];
  //console.log("levelmod", levelModules);

  const engineRef = useRef(null);
  const canvasRef = useRef(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [currentLine, setCurrentLine] = useState(0);

  let maxTime = 10;

  useEffect(() => {
    if (!levelModules || !canvasRef.current)
      return console.log("no mydata/mountref!");

    const engine = new ViewerEngine(
      canvasRef.current,
      levelModules,
      {
        maxTime,
        onTimeUpdate: (time, activeLine) => {
          // setCurrentTime(time);
          // setCurrentLine(activeLine || null);
        },
      },
      [levelModules, maxTime],
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
