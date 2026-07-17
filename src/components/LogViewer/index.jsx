import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import UI from "./ui";
import ViewerEngine from "./ViewerEngine";

// Dynamically grab all static json files via Vite glob
const logs = import.meta.glob("../../logs/*.json");

export default function LogViewer({}) {
  const { log_id } = useParams();
  const engineRef = useRef(null);
  const canvasRef = useRef(null);

  // 1. Keep track of the loaded JSON data in state
  const [logData, setLogData] = useState(null);
  const [loading, setLoading] = useState(true);

  const maxTime = 10;

  // 2. Effect for fetching the JSON data based on log_id
  useEffect(() => {
    const logPath = `../../logs/${log_id}.json`;

    if (!logs[logPath]) {
      console.error(`Log file not found: ${logPath}`);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (!canvasRef.current) return;
    // Resolve the glob function to import the static JSON file
    logs[logPath]()
      .then((module) => {
        console.log("getting static json", module);
        // Vite imports JSON with the data as the default export
        setLogData(module.default || module);
        setLoading(false);

        //console.log("canvasREF", canvasRef);

        const engine = new ViewerEngine(
          canvasRef.current,
          logData, // Now passing the actual object data, not a Promise!
          {
            maxTime,
            onTimeUpdate: (time, activeLine) => {
              // React to time changes here
            },
          },
          [log_id],
        );

        engineRef.current = engine;
      })
      .catch((err) => {
        console.error("Error loading log data:", err);
        setLoading(false);
      });
  }, [log_id]); // Only re-run if the URL log_id changes

  // 3. Effect for instantiating your ViewerEngine once data AND canvas are ready
  useEffect(() => {
    if (!logData || !canvasRef.current) return console.log("no canvas");

    // const engine = new ViewerEngine(
    //   canvasRef.current,
    //   logData, // Now passing the actual object data, not a Promise!
    //   {
    //     maxTime,
    //     onTimeUpdate: (time, activeLine) => {
    //       // React to time changes here
    //     },
    //   },
    //   [log_id],
    // );

    // engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [logData]); // Re-instantiate engine only when logData settles

  //if (loading) return <div>Loading log data...</div>;
  //if (!logData) return <div>Log file data could not be resolved.</div>;

  return (
    <>
      <div className="relative w-full h-full min-h-[500px]"></div>
      <canvas
        width="500"
        height="500"
        className="absolute top-0  -translate-x-1/2 z-30 bg-purple-900"
        ref={canvasRef}
      />
      <UI></UI>
    </>
  );
}
