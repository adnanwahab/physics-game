import { useEffect, useRef, useState } from "react";
import { Routes, Route, Link, useParams } from "react-router-dom";

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
  async function getLogs(log_id) {
    //console.log("logGetter", `../../logs/${game_id}.json`);
    const levelModule = (await logs[`../../logs/${log_id}.json`])();
    console.log("pls work", levelModule);
    return levelModule;
  }
  let levelModules = getLogs(log_id).then((_) => console.log("promise", _));
  //let myData = levelModules; //levelModules[`./logs/${log_id}.json`];
  //console.log("levelmod", levelModules);

  const engineRef = useRef(null);
  const canvasRef = useRef(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [currentLine, setCurrentLine] = useState(0);

  let maxTime = 10;

  useEffect(() => {
    levelModules.then((data) => console.log("data", data));

    if (!levelModules || !canvasRef.current)
      return console.log(
        "no mydata/mountref!",
        levelModules,
        log_id,
        canvasRef.current,
      );

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
      [log_id],
    );

    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  });
  return (
    <>
      <div className="relative w-3/4 h-3/4"></div>
      <UI>
        {" "}
        <canvas
          width="500"
          height="500"
          className="max-w-md mx-auto bg-purple-500-800 p-6 rounded-lg"
          ref={canvasRef}
        />
      </UI>
    </>
  );
}
