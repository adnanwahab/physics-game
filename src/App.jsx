// src/App.jsx
import { Routes, Route, Link } from 'react-router-dom'
import Game from './screens/Game'
import LevelList from './screens/LevelList'
import Settings from './screens/Settings'
//import VideoSeekBar from './components/VideoSeekBar'

function App() {
  return (
    <div>
            <p
          style={{
            animation: "rainbow 2s linear infinite",
            background: "-webkit-linear-gradient(left, red, orange, yellow, green, cyan, blue, violet, red)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: "transparent"
          }}
        >
          <a
            href="https://physics-game-five.vercel.app/"
            className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500 animate-[rainbow_2s_linear_infinite]"
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
        <Link className="border-6 border-blue-500 rounded-md p-20" to="/level-list">Level List</Link>
      </nav>

      <Routes>
        <Route path="/" element={<LevelList />} />
        <Route path="/level-list" element={<LevelList />} />
        <Route path="/game/:game_id" element={<Game />} />
        <Route path="/edit/:game_id" element={<Settings />} />
      </Routes>

      <div className="footer">
        <p
          style={{
            animation: "rainbow 2s linear infinite",
            background: "-webkit-linear-gradient(left, red, orange, yellow, green, cyan, blue, violet, red)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: "transparent"
          }}
        >
          Email me at <a href="mailto:mail@adnanwahab.com">mail@adnanwahab.com</a> to join!
        </p>
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
        </div>
    </div>
  )
}

export default App