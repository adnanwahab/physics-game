const SHOT_PRESETS = {
  medium_two_shot: { distance: 4, height: 1.5, fov: 45 },
  close_up: { distance: 1.2, height: 1.6, fov: 35 },
  wide: { distance: 7, height: 2, fov: 50 },
};

// Mock function for missing imports in the snippet
async function getLogs(game_id) {
  return {};
}

import dalaranUrl from "../../../public/dalaran.obj?url";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
const objLoader = new OBJLoader();

import UI from "./ui";
import LogViewerRenderer from "./ViewerEngine";

export default function LogViewer() {
  return (
    <>
      <UI></UI>
    </>
  );
}
