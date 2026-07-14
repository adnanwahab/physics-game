import { useState, useRef, useEffect, useCallback } from "react";

// ————————————————————————————————————————————
// MIDNIGHT PRESS — a 3D record-crate carousel
// Drag it, flick it, arrow-key it. The focused
// sleeve lets its vinyl slip out and spin.
// ————————————————————————————————————————————

const ALBUMS = [
  {
    title: "Copper Sunset",
    artist: "The Meridian Line",
    year: 1974,
    genre: "Soul / Funk",
    label: "#E8A33D",
    art: (
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg,#2b1608 0%,#7a2d0b 55%,#c96a1b 100%)",
        }}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: "58%",
            height: "58%",
            left: "21%",
            top: "14%",
            background:
              "radial-gradient(circle at 40% 35%, #ffd98a, #e8842a 70%)",
            boxShadow: "0 0 60px 10px rgba(232,132,42,.55)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: "34%",
            background:
              "repeating-linear-gradient(180deg,#1a0d04 0 6px,#31170a 6px 12px)",
          }}
        />
      </div>
    ),
  },
  {
    title: "Static Bloom",
    artist: "Vera Okafor",
    year: 1981,
    genre: "Synth-pop",
    label: "#d96aa8",
    art: (
      <div className="absolute inset-0" style={{ background: "#12081f" }}>
        <div
          className="absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(90deg,transparent 0 14px,rgba(217,106,168,.35) 14px 16px)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: "46%",
            height: "46%",
            left: "27%",
            top: "27%",
            background: "conic-gradient(#ff9ad0,#7b3ff2,#ff9ad0)",
            filter: "blur(1px)",
          }}
        />
      </div>
    ),
  },
  {
    title: "Low Tide Tapes",
    artist: "Harbour & Finch",
    year: 1968,
    genre: "Folk",
    label: "#7fae8a",
    art: (
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg,#e8dfc8 0%,#cfe0d2 100%)",
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute left-0 right-0"
            style={{
              top: `${52 + i * 11}%`,
              height: "7px",
              background: "#476b52",
              opacity: 0.85 - i * 0.18,
              borderRadius: "999px",
              transform: `scaleX(${1 - i * 0.06})`,
            }}
          />
        ))}
        <div
          className="absolute rounded-full"
          style={{
            width: "18%",
            height: "18%",
            right: "14%",
            top: "12%",
            background: "#e0b23e",
          }}
        />
      </div>
    ),
  },
  {
    title: "Twelve Floors Up",
    artist: "Kane Delacroix Trio",
    year: 1959,
    genre: "Hard Bop",
    label: "#4a7fd9",
    art: (
      <div className="absolute inset-0" style={{ background: "#0c1526" }}>
        <div
          className="absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(0deg,transparent 0 22px,rgba(74,127,217,.5) 22px 24px), repeating-linear-gradient(90deg,transparent 0 22px,rgba(74,127,217,.28) 22px 24px)",
          }}
        />
        <div
          className="absolute"
          style={{
            width: "34%",
            height: "62%",
            left: "12%",
            bottom: "0",
            background: "linear-gradient(180deg,#f0c987,#c9822e)",
          }}
        />
      </div>
    ),
  },
  {
    title: "Ghost Frequencies",
    artist: "NULLPOINT",
    year: 1996,
    genre: "IDM",
    label: "#9ee37d",
    art: (
      <div className="absolute inset-0" style={{ background: "#060a06" }}>
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border"
            style={{
              borderColor: "rgba(158,227,125,.6)",
              width: `${10 + i * 11}%`,
              height: `${10 + i * 11}%`,
              left: `${45 - i * 5.5}%`,
              top: `${45 - i * 5.5}%`,
              opacity: 1 - i * 0.09,
            }}
          />
        ))}
      </div>
    ),
  },
  {
    title: "Marmalade Skies",
    artist: "The Peel Sessions",
    year: 1967,
    genre: "Psych Rock",
    label: "#e05252",
    art: (
      <div
        className="absolute inset-0"
        style={{
          background:
            "conic-gradient(from 200deg at 50% 60%, #f2c14e, #e05252, #7b3ff2, #f2c14e)",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 60%, transparent 30%, rgba(20,8,2,.55) 100%)",
          }}
        />
      </div>
    ),
  },
  {
    title: "Concrete Lullaby",
    artist: "Mara Estévez",
    year: 2003,
    genre: "Trip-hop",
    label: "#b8b8c4",
    art: (
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(160deg,#26262e 0%,#4a4a56 100%)",
        }}
      >
        <div
          className="absolute"
          style={{
            width: "120%",
            height: "3px",
            background: "#e8e8f0",
            top: "38%",
            left: "-10%",
            transform: "rotate(-14deg)",
          }}
        />
        <div
          className="absolute"
          style={{
            width: "120%",
            height: "1px",
            background: "rgba(232,232,240,.5)",
            top: "48%",
            left: "-10%",
            transform: "rotate(-14deg)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: "10%",
            height: "10%",
            left: "18%",
            top: "16%",
            background: "#e8e8f0",
            opacity: 0.9,
          }}
        />
      </div>
    ),
  },
  {
    title: "Amber Signal",
    artist: "Dial Tone Society",
    year: 1979,
    genre: "Disco",
    label: "#f2b134",
    art: (
      <div className="absolute inset-0" style={{ background: "#1a0f24" }}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute left-1/2 rounded-full"
            style={{
              width: `${86 - i * 13}%`,
              height: `${46 - i * 7}%`,
              bottom: "-4%",
              transform: "translateX(-50%)",
              border: "3px solid",
              borderColor: i % 2 ? "#f2b134" : "#e05fa0",
              borderBottomColor: "transparent",
              opacity: 0.9 - i * 0.1,
            }}
          />
        ))}
      </div>
    ),
  },
];

const N = ALBUMS.length;
const STEP = 360 / N;
const CARD_W = 230;
const RADIUS = Math.round(CARD_W / 2 / Math.tan(Math.PI / N)) + 70;

const mod = (n, m) => ((n % m) + m) % m;

export default function VinylCarousel() {
  const [rotation, setRotation] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const drag = useRef({ startX: 0, startRot: 0, lastX: 0, lastT: 0, vel: 0 });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const fn = (e) => setReducedMotion(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const focusedIndex = mod(Math.round(-rotation / STEP), N);
  const focused = ALBUMS[focusedIndex];

  const snapTo = useCallback((rot) => {
    setRotation(Math.round(rot / STEP) * STEP);
  }, []);

  const goTo = useCallback(
    (index) => {
      // rotate along the shortest path to the requested sleeve
      const current = -rotation / STEP;
      let delta = index - mod(current, N);
      if (delta > N / 2) delta -= N;
      if (delta < -N / 2) delta += N;
      setRotation(rotation - delta * STEP);
    },
    [rotation],
  );

  const step = useCallback(
    (dir) => setRotation((r) => Math.round((r - dir * STEP) / STEP) * STEP),
    [],
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    drag.current = {
      startX: e.clientX,
      startRot: rotation,
      lastX: e.clientX,
      lastT: performance.now(),
      vel: 0,
    };
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    const now = performance.now();
    const dx = e.clientX - drag.current.lastX;
    const dt = Math.max(now - drag.current.lastT, 1);
    drag.current.vel = dx / dt;
    drag.current.lastX = e.clientX;
    drag.current.lastT = now;
    setRotation(
      drag.current.startRot + (e.clientX - drag.current.startX) * 0.28,
    );
  };
  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    const fling = drag.current.vel * 90; // momentum, then settle on a sleeve
    snapTo(rotation + fling * 0.28);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden select-none"
      style={{
        background:
          "radial-gradient(ellipse 120% 80% at 50% -10%, #241a10 0%, #120d08 45%, #0a0705 100%)",
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@1,600;1,700&family=Space+Grotesk:wght@300;400;500&display=swap');
        @keyframes spin33 { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* Marquee */}
      <header className="text-center mb-2 mt-10 px-6">
        <p
          className="text-[11px] tracking-[0.5em] uppercase mb-2"
          style={{ color: "#6B5D4A" }}
        >
          est. 33⅓ rpm
        </p>
        <h1
          className="text-4xl md:text-5xl"
          style={{
            fontFamily: "'Bodoni Moda', serif",
            fontStyle: "italic",
            fontWeight: 700,
            color: "#F2E8D5",
            letterSpacing: "0.02em",
          }}
        >
          Midnight Press
        </h1>
      </header>

      {/* The crate */}
      <div
        className="relative w-full flex items-center justify-center"
        style={{
          height: 480,
          perspective: "1400px",
          cursor: dragging ? "grabbing" : "grab",
          touchAction: "pan-y",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="listbox"
        aria-label="Record crate"
        aria-activedescendant={`sleeve-${focusedIndex}`}
      >
        {/* warm spotlight on the floor */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 620,
            height: 150,
            bottom: 40,
            background:
              "radial-gradient(ellipse, rgba(232,163,61,.14), transparent 70%)",
            filter: "blur(8px)",
          }}
        />

        <div
          className="relative"
          style={{
            width: CARD_W,
            height: CARD_W,
            transformStyle: "preserve-3d",
            transform: `rotateY(${rotation}deg)`,
            transition: dragging
              ? "none"
              : "transform 700ms cubic-bezier(.22,1,.36,1)",
          }}
        >
          {ALBUMS.map((album, i) => {
            const angle = i * STEP;
            // how close this sleeve is to facing the viewer (1 = front, -1 = back)
            const facing = Math.cos(((angle + rotation) * Math.PI) / 180);
            const isFocused = i === focusedIndex;
            return (
              <div
                key={album.title}
                id={`sleeve-${i}`}
                role="option"
                aria-selected={isFocused}
                className="absolute inset-0"
                style={{
                  transform: `rotateY(${angle}deg) translateZ(${RADIUS}px)`,
                  transformStyle: "preserve-3d",
                }}
              >
                {/* vinyl peeking out of the focused sleeve */}
                <div
                  className="absolute rounded-full"
                  style={{
                    width: "92%",
                    height: "92%",
                    top: "4%",
                    left: "4%",
                    background:
                      "radial-gradient(circle, #2a2a2a 0 12%, transparent 12.5%), repeating-radial-gradient(circle, #111 0 2px, #1c1c1c 2px 4px)",
                    boxShadow: "0 6px 24px rgba(0,0,0,.6)",
                    transform:
                      isFocused && !dragging
                        ? "translateX(52%)"
                        : "translateX(2%)",
                    transition:
                      "transform 700ms cubic-bezier(.22,1,.36,1) 150ms",
                    zIndex: -1,
                  }}
                >
                  <div
                    className="absolute rounded-full"
                    style={{
                      width: "34%",
                      height: "34%",
                      left: "33%",
                      top: "33%",
                      background: album.label,
                      animation:
                        isFocused && !reducedMotion
                          ? "spin33 1.8s linear infinite"
                          : "none",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <div
                      className="rounded-full"
                      style={{
                        width: "12%",
                        height: "12%",
                        background: "#0a0705",
                      }}
                    />
                  </div>
                </div>

                {/* the sleeve */}
                <button
                  onClick={() => !isFocused && goTo(i)}
                  className="absolute inset-0 overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    borderRadius: 4,
                    boxShadow: isFocused
                      ? "0 18px 50px rgba(0,0,0,.7), 0 0 0 1px rgba(242,232,213,.12)"
                      : "0 10px 30px rgba(0,0,0,.55)",
                    filter: `brightness(${0.45 + 0.55 * Math.max(facing, 0)}) blur(${(1 - Math.max(facing, 0)) * 1.2}px)`,
                    transition: dragging ? "none" : "filter 700ms",
                    cursor: isFocused ? "grab" : "pointer",
                  }}
                  tabIndex={-1}
                  aria-label={`${album.title} by ${album.artist}`}
                >
                  {album.art}
                  <div
                    className="absolute inset-x-0 bottom-0 p-3"
                    style={{
                      background:
                        "linear-gradient(transparent, rgba(5,3,2,.85))",
                    }}
                  >
                    <p
                      className="text-[13px] font-medium"
                      style={{ color: "#F2E8D5" }}
                    >
                      {album.title}
                    </p>
                    <p
                      className="text-[11px]"
                      style={{ color: "rgba(242,232,213,.6)" }}
                    >
                      {album.artist}
                    </p>
                  </div>
                  {/* sleeve sheen */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(105deg, rgba(255,255,255,.10) 0%, transparent 30%)",
                    }}
                  />
                </button>

                {/* reflection */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{
                    borderRadius: 4,
                    top: "104%",
                    transform: "scaleY(-1)",
                    opacity: 0.22 * Math.max(facing, 0),
                    maskImage:
                      "linear-gradient(to top, rgba(0,0,0,.7), transparent 55%)",
                    WebkitMaskImage:
                      "linear-gradient(to top, rgba(0,0,0,.7), transparent 55%)",
                  }}
                >
                  {album.art}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Now playing */}
      <div className="text-center px-6 -mt-4 mb-6" aria-live="polite">
        <p
          className="text-lg"
          style={{
            fontFamily: "'Bodoni Moda', serif",
            fontStyle: "italic",
            color: "#F2E8D5",
          }}
        >
          {focused.title}
        </p>
        <p
          className="text-[12px] tracking-[0.25em] uppercase mt-1"
          style={{ color: "#6B5D4A" }}
        >
          {focused.artist} · {focused.genre} · {focused.year}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-5 mb-12">
        <button
          onClick={() => step(-1)}
          aria-label="Previous record"
          className="w-10 h-10 rounded-full grid place-items-center transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2"
          style={{
            border: "1px solid rgba(242,232,213,.25)",
            color: "#F2E8D5",
          }}
        >
          ←
        </button>
        <div className="flex gap-2" role="tablist" aria-label="Records">
          {ALBUMS.map((a, i) => (
            <button
              key={a.title}
              onClick={() => goTo(i)}
              aria-label={a.title}
              className="rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2"
              style={{
                width: i === focusedIndex ? 22 : 7,
                height: 7,
                background:
                  i === focusedIndex ? a.label : "rgba(242,232,213,.25)",
              }}
            />
          ))}
        </div>
        <button
          onClick={() => step(1)}
          aria-label="Next record"
          className="w-10 h-10 rounded-full grid place-items-center transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2"
          style={{
            border: "1px solid rgba(242,232,213,.25)",
            color: "#F2E8D5",
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}
