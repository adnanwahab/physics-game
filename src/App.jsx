// src/App.jsx
import { Routes, Route, Link } from 'react-router-dom'
import Game from './screens/Game'
import LevelList from './screens/LevelList'
// import Contact from './screens/Contact'

// function Home() {
//   return <div>Home</div>
// }

// function About() {
//   return <div>About</div>
// }

// function Contact() {
//   return <div>Contact</div>
// }

import Settings from './screens/Settings'

function App() {
  return (
    <div>
      <nav>
        {/* <Link to="/">Home</Link> */}
        <Link to="/game">Game</Link>
        <br />
        <Link to="/level-list">Level List</Link>
        {/* <Link to="/settings">Settings</Link> */}
      </nav>

      <Routes>
        <Route path="/" element={<LevelList />} />
        <Route path="/level-list" element={<LevelList />} />
        <Route path="/game/:game_id" element={<Game />} />
        <Route path="/settings" element={<Settings />} />
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
          Email me at <a href="mailto:mail@madnanwahab.com">mail@madnanwahab.com</a> to join!
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
  
        {/* <p><a href="https://github.com/adnanwahab/physics-game">Made in texas</a></p> */}
      </div>
    </div>
  )
}

export default App