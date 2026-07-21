import { Routes, Route, Link, useParams } from "react-router-dom";

export default function () {
  return (
    <nav className="sticky h-32 bottom-0 left-0 w-full z-50 backdrop-blur-md bg-slate-900/40 py-4 px-6 flex flex-col items-center justify-center gap-3 border-b border-slate-800">
      {/* Main Logo */}
      <Link
        to="/"
        className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 via-green-400 to-blue-500 animate-[rainbow_4s_linear_infinite]"
        style={{
          animation: "rainbow 4s linear infinite",
          background:
            "-webkit-linear-gradient(left, red, orange, yellow, green, cyan, blue, violet, red)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Happy Bear Landia
      </Link>

      {/* Navigation Links */}
      <div className="flex items-center justify-center gap-6 text-sm md:text-base font-medium tracking-wide text-slate-300">
        <Link to="/game" className="hover:text-yellow-400 transition-colors">
          Game
        </Link>
        <Link to="/blog" className="hover:text-yellow-400 transition-colors">
          Blog
        </Link>
        <Link
          to="/view-logs/"
          className="hover:text-yellow-400 transition-colors text-xs uppercase tracking-wider bg-slate-800 px-2.5 py-1 rounded"
        >
          Log Viewer
        </Link>
        <Link
          to="/edit/"
          className="hover:text-yellow-400 transition-colors text-xs uppercase tracking-wider bg-purple-900/50 text-purple-300 border border-purple-700/50 px-2.5 py-1 rounded"
        >
          Magic Editor
        </Link>
        <Link
          to="/pensieve/"
          className="hover:text-yellow-400 transition-colors text-xs uppercase tracking-wider bg-purple-900/50 text-purple-300 border border-purple-700/50 px-2.5 py-1 rounded"
        >
          pensieve
        </Link>
      </div>
    </nav>
  );
}
