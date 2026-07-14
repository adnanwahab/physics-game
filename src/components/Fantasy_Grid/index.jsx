import { useState } from "react";

// ————————————————————————————————————————————————
// THE NINE BREWS — a 3x3 specimen grid of coffee brewing methods.
// Signature: the grid tracks themselves flex toward whatever you
// hover, so the grid feels like liquid settling toward your cursor.
// Palette: porcelain / ink / copper (the gooseneck-kettle accent).
// ————————————————————————————————————————————————

const BREWS = [
  {
    name: "Espresso",
    glyph: "◉",
    desc: "Pressure-pulled concentrate, crema on top.",
    ratio: "1 : 2",
    time: "25–30 s",
    grind: "Fine",
  },
  {
    name: "Pour Over",
    glyph: "◡",
    desc: "A slow spiral of water through a paper cone.",
    ratio: "1 : 16",
    time: "3 min",
    grind: "Medium",
  },
  {
    name: "French Press",
    glyph: "▤",
    desc: "Full immersion, pressed through metal mesh.",
    ratio: "1 : 15",
    time: "4 min",
    grind: "Coarse",
  },
  {
    name: "AeroPress",
    glyph: "◍",
    desc: "Immersion plus a push — the travel favorite.",
    ratio: "1 : 12",
    time: "90 s",
    grind: "Med-fine",
  },
  {
    name: "Cold Brew",
    glyph: "❆",
    desc: "Steeped cold overnight. Smooth, low acid.",
    ratio: "1 : 8",
    time: "16 hr",
    grind: "Extra coarse",
  },
  {
    name: "Moka Pot",
    glyph: "▲",
    desc: "Stovetop steam pressure, the Italian kitchen classic.",
    ratio: "1 : 10",
    time: "5 min",
    grind: "Fine-med",
  },
  {
    name: "Siphon",
    glyph: "◠",
    desc: "Vapor pressure theatre in glass globes.",
    ratio: "1 : 15",
    time: "3 min",
    grind: "Medium",
  },
  {
    name: "Turkish",
    glyph: "◆",
    desc: "Unfiltered, simmered in a copper cezve.",
    ratio: "1 : 10",
    time: "4 min",
    grind: "Powder",
  },
  {
    name: "Batch Drip",
    glyph: "▥",
    desc: "The steady workhorse of every diner counter.",
    ratio: "1 : 17",
    time: "6 min",
    grind: "Medium",
  },
];

function track(hovered, index) {
  if (hovered === null) return "1fr 1fr 1fr";
  return [0, 1, 2].map((i) => (i === index ? "1.9fr" : "0.85fr")).join(" ");
}

export default function BrewGrid() {
  const [hover, setHover] = useState(null); // {row, col} | null

  const cols = track(hover, hover?.col ?? null);
  const rows = track(hover, hover?.row ?? null);

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ background: "#E9ECE7", color: "#1C2830" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@400;500&family=DM+Mono:wght@400&display=swap');

        .display { font-family: 'Instrument Serif', serif; }
        .body    { font-family: 'Space Grotesk', sans-serif; }
        .mono    { font-family: 'DM Mono', monospace; }

        .brewgrid {
          display: grid;
          gap: 10px;
          transition: grid-template-columns 520ms cubic-bezier(.22,1,.36,1),
                      grid-template-rows    520ms cubic-bezier(.22,1,.36,1);
        }

        .cell {
          position: relative;
          overflow: hidden;
          border-radius: 14px;
          background: #F5F6F2;
          border: 1px solid rgba(28,40,48,0.10);
          transition: background 400ms ease, border-color 400ms ease;
          cursor: pointer;
          outline: none;
        }
        .cell:hover, .cell:focus-visible {
          background: #1C2830;
          color: #F5F6F2;
          border-color: #1C2830;
        }
        .cell:focus-visible {
          box-shadow: 0 0 0 3px #B87333;
        }

        .stats {
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 320ms ease 120ms, transform 320ms ease 120ms;
        }
        .cell:hover .stats, .cell:focus-visible .stats {
          opacity: 1;
          transform: translateY(0);
        }

        .glyph {
          transition: transform 500ms cubic-bezier(.22,1,.36,1), color 400ms ease;
          color: rgba(28,40,48,0.35);
        }
        .cell:hover .glyph, .cell:focus-visible .glyph {
          transform: scale(1.25) rotate(-6deg);
          color: #B87333;
        }

        .desc-line {
          opacity: 0;
          max-height: 0;
          transition: opacity 300ms ease 180ms, max-height 400ms ease;
        }
        .cell:hover .desc-line, .cell:focus-visible .desc-line {
          opacity: 0.85;
          max-height: 4rem;
        }

        @media (prefers-reduced-motion: reduce) {
          .brewgrid, .cell, .stats, .glyph, .desc-line { transition: none !important; }
        }
      `}</style>

      {/* Header */}
      <header className="px-8 pt-8 pb-4 flex items-end justify-between">
        <div>
          <p
            className="mono text-xs tracking-widest uppercase"
            style={{ color: "#B87333" }}
          >
            A specimen grid
          </p>
          <h1 className="display text-5xl md:text-6xl leading-none mt-1">
            The Nine <span className="italic">Brews</span>
          </h1>
        </div>
        <p
          className="body text-sm max-w-[220px] text-right hidden md:block"
          style={{ color: "rgba(28,40,48,0.55)" }}
        >
          Hover a method — the grid leans in and pours out its recipe.
        </p>
      </header>

      {/* The grid */}
      <main className="flex-1 px-8 pb-8">
        <div
          className="brewgrid h-full min-h-[560px]"
          style={{ gridTemplateColumns: cols, gridTemplateRows: rows }}
          onMouseLeave={() => setHover(null)}
        >
          {BREWS.map((b, i) => {
            const row = Math.floor(i / 3);
            const col = i % 3;
            return (
              <div
                key={b.name}
                className="cell p-5 flex flex-col justify-between"
                tabIndex={0}
                onMouseEnter={() => setHover({ row, col })}
                onFocus={() => setHover({ row, col })}
                onBlur={() => setHover(null)}
              >
                <div className="flex items-start justify-between">
                  <span className="glyph text-3xl leading-none select-none">
                    {b.glyph}
                  </span>
                  <span className="mono text-[10px] tracking-widest uppercase opacity-50">
                    {b.grind} grind
                  </span>
                </div>

                <div>
                  <h2 className="display text-2xl md:text-3xl leading-tight">
                    {b.name}
                  </h2>
                  <p className="body text-sm mt-1 desc-line">{b.desc}</p>

                  <div className="stats mono text-xs mt-3 flex gap-5">
                    <span>
                      <span style={{ color: "#B87333" }}>ratio</span> {b.ratio}
                    </span>
                    <span>
                      <span style={{ color: "#B87333" }}>time</span> {b.time}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
