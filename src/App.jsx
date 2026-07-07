// src/App.jsx
import { Routes, Route, Link } from "react-router-dom";
import Game from "./screens/Game";
import LevelList from "./screens/LevelList";
import Settings from "./screens/Settings";
//import VideoSeekBar from './components/VideoSeekBar'
import React from "react";
import { DeckGL } from "@deck.gl/react";
//import {MapViewState} from '@deck.gl/core';
import { LineLayer } from "@deck.gl/layers";
import { ZoomWidget } from "@deck.gl/react";
import { Map } from "react-map-gl/mapbox";

const token =
  "pk.eyJ1IjoiYXdhaGFiIiwiYSI6ImNrdjc3NW11aTJncmIzMXExcXRiNDNxZWYifQ.tqFU7uVd6mbhHtjYsjtvlg";
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

import { LogViewer } from "./components/LogViewer";

function addPenguin() {
  //Three.import
}

function App() {
  setInterval(function () {
    fetch("/getPlayersInRoom", {}).then();
  }, 50);
  /**
   * Sends a request to update a player's position and rotation in a room.
   * @param {string} roomId - Room id
   * @param {string} playerId - Player's id
   * @param {object} pos - {x, y, z}
   * @param {object} quat - {x, y, z, w}
   * @returns {Promise<Response>}
   */

  //let p = new THREE.Vector3( 0, 1, 0 );
  //let q = new THREE.Vector3( 0, 1, 0 );
  //_updatePlayer("0", p, q)
  //_game.getState().forEach Render Pegen
  //when other penguin moves, gameROom updatse

  return (
    <div>
      <p
        style={{
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
          className="text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500 animate-[rainbow_2s_linear_infinite]"
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
      <nav>
        <Link
          className="border-6 border-blue-500 rounded-md p-20"
          to="/level-list"
        >
          Level List
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<LevelList />} />
        <Route path="/level-list" element={<LevelList />} />
        <Route path="/game/:game_id" element={<Game />} />
        <Route path="/view/:game_id" element={<LogViewer />} />
        <Route path="/edit/:game_id" element={<Settings />} />
      </Routes>

      <div className="footer">
        <img src="/public/map.png"></img>

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
              /* override so parent doesn't mess with animation */
              animation: rainbow 2s linear infinite;
            }
          `}
        </style>
        <div>
          {/* Simple DeckGL world map */}
          <div style={{ width: "100%", height: "400px", margin: "40px 0" }}>
            {/* <DeckGL
            initialViewState={{
              longitude: 0,
              latitude: 20,
              zoom: 1.2,
              bearing: 0,
              pitch: 0,
            }}
            controller={true}
            style={{ width: "100%", height: "100%" }}
            layers={[]}
          >
            <Map
              mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
            />
          </DeckGL> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
