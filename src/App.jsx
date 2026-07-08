// src/App.jsx
import { Routes, Route, Link } from "react-router-dom";
import Game from "./components/Game";
import LevelList from "./screens/LevelList";
import Settings from "./screens/Settings";
import React, { useRef } from "react";
import { DeckGL } from "@deck.gl/react";

import Game_Editor from "./components/Game_Editor";

import Cube from "./components/Cube";

import { useParams } from "react-router-dom";

const token =
  "pk.eyJ1IjoiYXdhaGFiIiwiYSI6ImNrdjc3NW11aTJncmIzMXExcXRiNDNxZWYifQ.tqFU7uVd6mbhHtjYsjtvlg";
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

import { LogViewer } from "./components/LogViewer";

async function getLogs(game_id) {
  const levelModule = await import(`./logs/${game_id}.json`);
  console.log(levelModule);
}

function renderWorld() {}
function Debugging() {
  const { game_id } = useParams();
  const canvasRef = useRef(null);
  console.log("game_id", game_id);

  getLogs(game_id).then((data) => {
    renderWorld(data, canvasRef);
  });
  //once we have scene + braindance
  // people vote ->
  // therapist wont want to use it
  // prove it works
  return (
    <>
      <canvas
        ref={canvasRef}
        id="canvas"
        className="
                    block w-full h-full
                    max-h-[200px] sm:max-h-[240px] md:max-h-[380px] lg:max-h-[80vh]
                    aspect-video border-s-stone-100 border border-2
                "
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </>
  );
}

function App() {
  // setInterval(function () {
  //   fetch("/getPlayersInRoom", {}).then();
  // }, 50);

  return (
    <div className="pt-2 ">
      {" "}
      {/* Added padding-top so content doesn't get hidden behind the fixed title */}
      {/* Pinned Title Container */}
      <div className="fixed top-0 left-0 w-full text-center py-4 z-50  backdrop-blur-sm">
        <p
          style={{
            display: "inline-block",
            animation: "rainbow 2s linear infinite",
            background:
              "-webkit-linear-gradient(left, red, orange, yellow, green, cyan, blue, violet, red)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          <a
            href="https://physics-game-five.vercel.app/"
            className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500 animate-[rainbow_2s_linear_infinite]"
            style={{
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textFillColor: "transparent",
            }}
          >
            Happy Bear Landia
          </a>
        </p>
      </div>
      <div className="w-full h-[80vh] flex flex-col items-center justify-center relative overflow-hidden">
        <Routes>
          <Route path="/" element={<LevelList />} />
          <Route path="/level-list" element={<LevelList />} />
          <Route path="/game/:game_id" element={<Game />} />
          <Route path="/view/:game_id" element={<LogViewer />} />
          <Route path="/edit/:game_id" element={<Game_Editor />} />
          <Route path="/cube" element={<Cube />} />
          <Route path="/debug/:game_id" element={<Debugging />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
