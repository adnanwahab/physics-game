import React from "react";

// --- 1. CONFIGURATION DATA ENGINE ---
// Swap out these placeholders with your actual comic/mechanics images
const IMAGE_URLS = [
  "https://via.placeholder.com/400?text=01_Psionic_Puzzles",
  "https://via.placeholder.com/400?text=02_Interactive_Story",
  "https://via.placeholder.com/400?text=03_Cooperative_Tabletop",
  "https://via.placeholder.com/400?text=04_Bridge_Building",
  "https://via.placeholder.com/400?text=05_Party_Mini_Games",
  "https://via.placeholder.com/400?text=06_Infinite_Zoom",
  "https://via.placeholder.com/400?text=07_Sims_Simulation",
  "https://via.placeholder.com/400?text=08_Time_Travel_Debugging",
  "https://via.placeholder.com/400?text=09_Experience_Maker",
];

// --- 2. RENDER ENGINE ---
export default function Game_Grid_Wireframe() {
  return (
    <div className="grid grid-cols-3 gap-6 w-full max-w-3xl aspect-square">
      {IMAGE_URLS.map((url, index) => (
        <div
          key={index}
          className="w-full h-full bg-white border-[3px] border-[#7a7a7a] rounded-[18px] overflow-hidden shadow-sm hover:scale-[1.02] transition-transform duration-200 ease-out"
        >
          <img
            src={url}
            alt={`Multiverse Mechanic ${index + 1}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}
