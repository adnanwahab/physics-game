import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const KeelingCurve = () => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear any existing contents (prevents duplicate rendering in StrictMode)
    d3.select(svgRef.current).selectAll("*").remove();

    // 1. DATA GENERATION Engine
    const startYear = 1958;
    const endYear = 2018;
    const mainData = [];

    for (let year = startYear; year <= endYear; year++) {
      for (let month = 0; month < 12; month++) {
        let t = year + month / 12;
        let tIdx = t - startYear;

        // Baseline accelerating upward trend (quadratic curve fit)
        let baseline = 315 + 0.75 * tIdx + 0.012 * Math.pow(tIdx, 2);

        // Seasonal cycle (Sinusoidal wave maximizing around Apr/May, minimizing Oct)
        let seasonal = 3 * Math.sin(2 * Math.PI * (t - 0.15));

        // Add slight random noise
        let noise = (Math.random() - 0.5) * 0.6;

        mainData.push({
          date: new Date(year, month, 1),
          co2: baseline + seasonal + noise,
        });
      }
    }

    // Seasonal inset diagram data (relative variance average)
    const seasonalData = [
      { month: "Jan", val: -0.8 },
      { month: "Apr", val: 2.8 },
      { month: "Jul", val: 0.5 },
      { month: "Oct", val: -3.2 },
      { month: "Dec", val: -0.2 },
    ];

    // Interpolated curve data for smooth seasonal line
    const seasonalLineData = d3.range(0, 12, 0.1).map((m) => ({
      monthIdx: m,
      val: 3 * Math.sin(2 * Math.PI * (m / 12 + 0.72)),
    }));

    // 2. DIMENSIONS & CONFIGURATION
    const svg = d3.select(svgRef.current);
    const margin = { top: 60, right: 50, bottom: 60, left: 70 };
    const width = 850 - margin.left - margin.right;
    const height = 650 - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define marker arrowhead for vector callout annotations
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 5)
      .attr("refY", 5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto-start-reverse")
      .append("path")
      .attr("d", "M 0 0 L 10 5 L 0 10 z")
      .style("fill", "#e53e3e");

    // 3. SCALES & SCATTER AXES
    const x = d3
      .scaleTime()
      .domain([new Date(startYear, 0, 1), new Date(endYear, 11, 1)])
      .range([0, width]);

    const y = d3.scaleLinear().domain([300, 420]).range([height, 0]);

    // Gridlines Layout
    g.append("g")
      .attr("class", "grid")
      .style("stroke", "#f0f0f0")
      .style("stroke-opacity", "0.7")
      .style("shape-rendering", "crispEdges")
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(""));

    g.append("g")
      .attr("class", "grid")
      .style("stroke", "#f0f0f0")
      .style("stroke-opacity", "0.7")
      .style("shape-rendering", "crispEdges")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(-height).tickFormat(""));

    // Draw Dynamic Main Axes
    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(7).tickFormat(d3.timeFormat("%Y")));

    xAxis
      .selectAll("path, line")
      .style("stroke", "#ccc")
      .style("stroke-width", "1px");

    xAxis
      .append("text")
      .attr("x", width / 2)
      .attr("y", 40)
      .attr("fill", "#000")
      .attr("font-size", "14px")
      .style("text-anchor", "middle")
      .text("Year");

    const yAxis = g.append("g").call(d3.axisLeft(y).ticks(6));

    yAxis
      .selectAll("path, line")
      .style("stroke", "#ccc")
      .style("stroke-width", "1px");

    yAxis
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -height / 2)
      .attr("fill", "#000")
      .attr("font-size", "12px")
      .style("text-anchor", "middle")
      .text("CO₂ fraction in dry air (μmol/mol)");

    // Graph Structural Titles
    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", 25)
      .attr("fill", "#333")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Monthly mean CO₂ concentration");

    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", 43)
      .attr("fill", "#6610f2")
      .style("font-size", "13px")
      .text("Mauna Loa 1958 - 2018");

    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", height + margin.top + 50)
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .text('The "Keeling Curve"');

    // 4. PLOT ATMOSPHERIC SCATTER POINT DATA
    g.selectAll(".dot")
      .data(mainData)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.date))
      .attr("cy", (d) => y(d.co2))
      .attr("r", 1.5)
      .attr("fill", "#e53e3e")
      .attr("opacity", 0.7);

    // Baseline Trend Mapping Sequence Line
    const trendLine = d3
      .line()
      .x((d) => x(d.date))
      .y((d) => y(d.co2));

    g.append("path")
      .datum(mainData)
      .attr("fill", "none")
      .attr("stroke", "#2b6cb0")
      .attr("stroke-width", "2px")
      .attr("d", trendLine);

    // 5. INSET CHART SUB-COORDINATE PLANE (Seasonal Variance)
    const insetW = 260;
    const insetH = 160;
    const insetG = g.append("g").attr("transform", `translate(80, 40)`);

    insetG
      .append("rect")
      .attr("width", insetW)
      .attr("height", insetH)
      .attr("fill", "#fff")
      .attr("stroke", "#ccc")
      .attr("stroke-width", "1px");

    insetG
      .append("text")
      .attr("x", insetW / 2)
      .attr("y", -10)
      .style("text-anchor", "middle")
      .style("font-size", "13px")
      .style("font-weight", "bold")
      .text("Seasonal variation");

    const insetX = d3
      .scaleLinear()
      .domain([0, 11])
      .range([20, insetW - 20]);
    const insetY = d3
      .scaleLinear()
      .domain([-4, 4])
      .range([insetH - 20, 20]);

    // Render Inset Internal Axes
    insetG
      .append("g")
      .attr("transform", `translate(0, ${insetY(0)})`)
      .call(
        d3
          .axisBottom(insetX)
          .tickValues([0, 3, 6, 9, 11])
          .tickFormat((d, i) => ["Jan", "Apr", "Jul", "Oct", "Dec"][i]),
      );

    insetG
      .append("g")
      .attr("transform", `translate(20, 0)`)
      .call(d3.axisLeft(insetY).tickValues([-2, 0, 2]));

    // Draw Inset Curve
    const insetLineFn = d3
      .line()
      .x((d) => insetX(d.monthIdx))
      .y((d) => insetY(d.val));
    insetG
      .append("path")
      .datum(seasonalLineData)
      .attr("fill", "none")
      .attr("stroke", "#0056b3")
      .attr("stroke-width", "1.5px")
      .attr("d", insetLineFn);

    // Draw Inset Points
    insetG
      .selectAll(".inset-dot")
      .data(seasonalData)
      .enter()
      .append("circle")
      .attr("cx", (d, i) => insetX([0, 3, 6, 9, 11][i]))
      .attr("cy", (d) => insetY(d.val))
      .attr("r", 3.5)
      .attr("fill", "#ff0000");

    // 6. HISTORICAL PREDICTION GRAPHIC ANNOTATIONS
    // Annotation Target Circle (1958-1962 region)
    g.append("ellipse")
      .attr("cx", x(new Date(1961, 6, 1)))
      .attr("cy", y(317))
      .attr("rx", 35)
      .attr("ry", 45)
      .attr("fill", "none")
      .attr("stroke", "#e53e3e")
      .attr("stroke-width", "2px");

    // Text Box Callout 1 (Early data predictor)
    const box1 = g.append("g").attr("transform", `translate(380, 420)`);
    box1
      .append("rect")
      .attr("width", 240)
      .attr("height", 70)
      .attr("rx", 10)
      .attr("fill", "#fff")
      .attr("stroke", "#e53e3e")
      .attr("stroke-width", "2px");

    const textCfg = [
      { y: 25, txt: "This was enough" },
      { y: 43, txt: "good data to predict" },
      { y: 61, txt: "the rest of the curve" },
    ];
    textCfg.forEach((t) => {
      box1
        .append("text")
        .attr("x", 15)
        .attr("y", t.y)
        .attr("fill", "#000")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text(t.txt);
    });

    // Arrow Connecting Callout 1 to Target Circle
    g.append("path")
      .attr("d", `M 380,455 Q 260,450 ${x(new Date(1963, 0, 1))},${y(317)}`)
      .attr("fill", "none")
      .attr("stroke", "#e53e3e")
      .attr("stroke-width", "2px")
      .attr("marker-end", "url(#arrow)");

    // Text Box Callout 2 (Modern real trend validation)
    const box2 = g.append("g").attr("transform", `translate(460, 300)`);
    box2
      .append("rect")
      .attr("width", 240)
      .attr("height", 55)
      .attr("rx", 10)
      .attr("fill", "#fff")
      .attr("stroke", "#e53e3e")
      .attr("stroke-width", "2px");

    box2
      .append("text")
      .attr("x", 15)
      .attr("y", 23)
      .attr("fill", "#000")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text("This is what has");
    box2
      .append("text")
      .attr("x", 15)
      .attr("y", 41)
      .attr("fill", "#000")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text("happened");

    // Arrow Connecting Callout 2 to Upper Curve
    g.append("path")
      .attr("d", `M 580,300 L 580, ${y(390)}`)
      .attr("fill", "none")
      .attr("stroke", "#e53e3e")
      .attr("stroke-width", "2px")
      .attr("marker-end", "url(#arrow)");
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        margin: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <svg
        ref={svgRef}
        width={850}
        height={650}
        style={{ backgroundColor: "#fff" }}
      />
    </div>
  );
};

//export default KeelingCurve;

// export default function LogViewer({
//   initialMaxSeconds = 120,
//   initialCurrentSecond = 0,
//   onPlayChange = () => {},
//   onSecondChange = () => {},
// }) {
//   const [maxSeconds, setMaxSeconds] = useState(initialMaxSeconds);
//   const [currentSecond, setCurrentSecond] = useState(initialCurrentSecond);
//   const [isPlaying, setIsPlaying] = useState(false);

//   const handleChange = (e) => {
//     setIsPlaying(false); // Stop playback on manual scrub
//     const newSecond = parseInt(e.target.value, 10);
//     setCurrentSecond(newSecond);
//     onSecondChange(newSecond);
//     onPlayChange(false);
//   };

//   return (
//     <>
//       <>
//         <KeelingCurve></KeelingCurve>
//       </>
//       <input
//         type="range"
//         min="0"
//         max={maxSeconds}
//         value={currentSecond}
//         onChange={handleChange}
//         className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
//       />
//     </>
//   );
// }

import * as THREE from "three/webgpu";
import myData from "/Users/shelbernstein/simulation_editor/src/logs/therapy.json";

// Maps abstract shot types to camera distance/height offsets.
// Tune these once you have real avatar scale/proportions.
const SHOT_PRESETS = {
  medium_two_shot: { distance: 4, height: 1.5, fov: 45 },
  close_up: { distance: 1.2, height: 1.6, fov: 35 },
  wide: { distance: 7, height: 2, fov: 50 },
};

export default function LogViewer() {
  const mountRef = useRef(null);
  const [currentLine, setCurrentLine] = useState(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer;
    let frameId;
    let disposed = false;

    async function init() {
      renderer = new THREE.WebGPURenderer({ antialias: true });

      // IMPORTANT: WebGPURenderer must be initialized before use
      await renderer.init();

      if (disposed) return; // component unmounted while initializing

      const width = mount.clientWidth || 1;
      const height = mount.clientHeight || 1;

      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a1a);

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 1.6, 4);
      const debugCube = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({ color: 0xff00ff }),
      );
      scene.add(debugCube);
      console.log("scene children:", scene.children.length);
      console.log("participants loaded:", myData.participants);
      console.log("timeline length:", myData.timeline?.length);
      // ... lighting / participants / timeline setup unchanged ...

      function animate() {
        // ... unchanged playback logic ...
        renderer.renderAsync(scene, camera);
        frameId = requestAnimationFrame(animate);
      }
      animate();

      // Use ResizeObserver instead of window resize — catches container
      // size changes that don't come from the window itself (flex/grid reflow)
      const resizeObserver = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        if (width === 0 || height === 0) return; // ignore transient 0-size passes
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      });
      resizeObserver.observe(mount);

      // stash for cleanup
      init.cleanup = () => {
        resizeObserver.disconnect();
        cancelAnimationFrame(frameId);
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) {
          mount.removeChild(renderer.domElement);
        }
      };
    }

    init();

    return () => {
      disposed = true;
      init.cleanup?.();
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
      {currentLine && (
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 24,
            right: 24,
            padding: "12px 16px",
            background: "rgba(0,0,0,0.6)",
            color: "white",
            borderRadius: 8,
            fontFamily: "sans-serif",
          }}
        >
          <strong>{currentLine.speaker}</strong>: {currentLine.line}
        </div>
      )}
    </div>
  );
}

function kelvinToColor(kelvin) {
  // Very rough approximation, good enough for tinting a light
  const temp = kelvin / 100;
  let r, g, b;
  if (temp <= 66) {
    r = 255;
    g = 99.47 * Math.log(temp) - 161.12;
  } else {
    r = 329.7 * Math.pow(temp - 60, -0.13);
    g = 288.12 * Math.pow(temp - 60, -0.0755);
  }
  b = temp >= 66 ? 255 : temp <= 19 ? 0 : 138.52 * Math.log(temp - 10) - 305.04;
  return new THREE.Color(
    THREE.MathUtils.clamp(r, 0, 255) / 255,
    THREE.MathUtils.clamp(g, 0, 255) / 255,
    THREE.MathUtils.clamp(b, 0, 255) / 255,
  );
}
