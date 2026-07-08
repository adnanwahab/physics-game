// src/App.jsx
import { Routes, Route, Link } from "react-router-dom";
import Game from "./components/Game";
import LevelList from "./screens/LevelList";
import Settings from "./screens/Settings";
//import VideoSeekBar from './components/VideoSeekBar'
import React from "react";
import { DeckGL } from "@deck.gl/react";
//import {MapViewState} from '@deck.gl/core';
import { LineLayer } from "@deck.gl/layers";
import { ZoomWidget } from "@deck.gl/react";
import { Map } from "react-map-gl/mapbox";

import Game_Editor from "./components/Game_Editor";

import Cube from "./components/Cube";

const token =
  "pk.eyJ1IjoiYXdhaGFiIiwiYSI6ImNrdjc3NW11aTJncmIzMXExcXRiNDNxZWYifQ.tqFU7uVd6mbhHtjYsjtvlg";
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

import { LogViewer } from "./components/LogViewer";

function App() {
  setInterval(function () {
    fetch("/getPlayersInRoom", {}).then();
  }, 50);

  return (
    <div className="pt-24">
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
      <Routes>
        <Route path="/" element={<LevelList />} />
        <Route path="/level-list" element={<LevelList />} />
        <Route path="/game/:game_id" element={<Game />} />
        <Route path="/view/:game_id" element={<LogViewer />} />
        <Route path="/edit/:game_id" element={<Game_Editor />} />
        <Route path="/cube" element={<Cube />} />
      </Routes>
      <div className="footer">
        <style>
          {`
            @keyframes rainbow {
              0% { filter: hue-rotate(0deg); }
              100% { filter: hue-rotate(360deg); }
            }
            .footer p {
              display: inline-block;
            }
            .footer p {
              will-change: filter;
            }
            .footer p[style] {
              animation: rainbow 2s linear infinite;
            }
          `}
        </style>
        <div>
          <div
            style={{ width: "100%", height: "400px", margin: "40px 0" }}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default App;
