import React, { useState } from "react";

// Types of objects users can add to their level
const OBJECT_TYPES = [
  { value: "cuboid", name: "Cuboid", params: ["position", "size", "rotation"] },
  { value: "cheese", name: "Cheese", params: ["position", "size", "rotation"] },
  { value: "sphere", name: "Sphere", params: ["position", "radius", "rotation"] },
  { value: "goal", name: "Goal", params: ["position", "size", "rotation"] },
  { value: "spawn", name: "Player Spawn", params: ["position", "rotation"] },
];

// Basic win conditions for a puzzle/level
const WIN_CONDITIONS = [
  { value: "proximity", name: "Proximity (reach a target)" },
  { value: "collect", name: "Collect (grab object)" },
  { value: "custom", name: "Custom Condition" },
];

function getDefaultObject(type) {
  switch (type) {
    case "cuboid":
      return { type, position: [0, 0.5, 0], size: [1, 1, 1], rotation: [0, 0, 0] };
    case "cheese":
      return { type, position: [0, 1, 0], size: [0.8, 0.8, 0.8], rotation: [0, 0, 0] };
    case "sphere":
      return { type, position: [0, 1, 0], radius: 0.5, rotation: [0, 0, 0] };
    case "goal":
      return { type, position: [2, 0.5, 2], size: [1, 1, 1], rotation: [0, 0, 0] };
    case "spawn":
      return { type, position: [0, 0.5, 0], rotation: [0, 0, 0] };
    default:
      return {};
  }
}

export default function SettingsEditor() {
  // Level state (could eventually load/save by level id)
  const [mode, setMode] = useState("2d Platformer");
  const [objects, setObjects] = useState([
    { type: "cuboid", position: [1, 0.5, 1], size: [1, 1, 1], rotation: [0, 0, 0] },
    { type: "cheese", position: [3, 1, 3], size: [0.8, 0.8, 0.8], rotation: [0, 0, 0] },
  ]);
  const [winConditionType, setWinConditionType] = useState("proximity");
  const [winCondition, setWinCondition] = useState({
    type: "proximity",
    target: "player",
    distance: 1.0,
  });

  // For adding new objects
  const [newObjectType, setNewObjectType] = useState("cuboid");

  // Handle object field changes
  const updateObject = (idx, field, value) => {
    setObjects(objs =>
      objs.map((obj, i) =>
        i === idx
          ? { ...obj, [field]: value }
          : obj
      )
    );
  };

  const updateObjectArrayField = (idx, field, i, val) => {
    setObjects(objs =>
      objs.map((obj, objIndex) =>
        objIndex === idx
          ? { ...obj, [field]: obj[field].map((item, n) => (n === i ? val : item)) }
          : obj
      )
    );
  };

  const handleAddObject = () => {
    setObjects([...objects, getDefaultObject(newObjectType)]);
  };

  const handleDeleteObject = (idx) => {
    setObjects(objs => objs.filter((_, i) => i !== idx));
  };

  // Win condition configuration
  const handleWinConditionChange = (field, value) => {
    setWinCondition(wc => ({ ...wc, [field]: value }));
  };

  // For exporting JSON
  const handleExport = () => {
    const level = [
      {
        mode,
        "win-condition": winCondition,
        objects
      }
    ];
    const code = JSON.stringify(level, null, 2);
    navigator.clipboard.writeText(code);
    alert("Level JSON copied to clipboard!");
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-4 text-center">Level Editor</h1>

      {/* Mode selector */}
      <section className="bg-gray-100 rounded-lg p-4">
        <label className="block font-semibold mb-2">Game Mode:</label>
        <select
          className="border p-2 rounded"
          value={mode}
          onChange={e => setMode(e.target.value)}
        >
          <option value="2d Platformer">2D Platformer</option>
          <option value="3d Platformer">3D Platformer</option>
          <option value="Puzzle">Puzzle</option>
          <option value="Sandbox">Sandbox</option>
        </select>
      </section>

      {/* Win Condition Editor */}
      <section className="bg-gray-100 rounded-lg p-4">
        <label className="block font-semibold mb-2">Win Condition:</label>
        <select
          className="border p-2 rounded mb-2"
          value={winConditionType}
          onChange={e => {
            setWinConditionType(e.target.value);
            setWinCondition({ type: e.target.value });
          }}
        >
          {WIN_CONDITIONS.map(opt =>
            <option value={opt.value} key={opt.value}>{opt.name}</option>
          )}
        </select>

        {/* Win Condition Fields */}
        {winConditionType === "proximity" && (
          <div className="space-y-2">
            <label>
              Target:{" "}
              <input
                type="text"
                className="border p-1 rounded ml-2"
                value={winCondition.target || ""}
                onChange={e => handleWinConditionChange("target", e.target.value)}
                placeholder="player"
              />
            </label>
            <label>
              Distance:{" "}
              <input
                type="number"
                step="0.01"
                className="border p-1 rounded ml-2"
                value={winCondition.distance || 1.0}
                onChange={e => handleWinConditionChange("distance", parseFloat(e.target.value))}
              />
            </label>
          </div>
        )}
        {winConditionType === "collect" && (
          <div>
            <label>
              Collect Object Type:{" "}
              <input
                type="text"
                className="border p-1 rounded ml-2"
                value={winCondition.collectType || ""}
                onChange={e => handleWinConditionChange("collectType", e.target.value)}
                placeholder="cheese"
              />
            </label>
          </div>
        )}
        {winConditionType === "custom" && (
          <div>
            <label>
              Custom Condition JSON:{" "}
              <textarea
                className="border p-2 rounded w-full ml-2"
                value={winCondition.custom || ""}
                onChange={e => handleWinConditionChange("custom", e.target.value)}
                placeholder='{{"condition": "your-custom-code"}}'
              />
            </label>
          </div>
        )}
      </section>

      {/* Object List Editor */}
      <section className="bg-gray-100 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Objects in Level ({objects.length})</div>
          <div className="flex gap-2">
            <select
              value={newObjectType}
              onChange={e => setNewObjectType(e.target.value)}
              className="border p-2 rounded"
            >
              {OBJECT_TYPES.map(type =>
                <option key={type.value} value={type.value}>{type.name}</option>
              )}
            </select>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
              onClick={handleAddObject}
            >
              + Add Object
            </button>
          </div>
        </div>

        {objects.map((obj, idx) => (
          <div key={idx} className="border p-3 rounded mb-3 bg-white/90 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm capitalize">{obj.type} #{idx + 1}</span>
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                onClick={() => handleDeleteObject(idx)}
              >
                Delete
              </button>
            </div>
            {/* Object Parameters */}
            {Object.entries(obj).map(([key, val]) => key !== "type" && (
              <div className="flex items-center my-1" key={key}>
                <label className="capitalize text-gray-800 w-24">{key}:</label>
                {Array.isArray(val) ? (
                  val.map((item, i) => (
                    <input
                      key={i}
                      type="number"
                      value={item}
                      step="0.01"
                      className="border rounded p-1 mx-1 w-20"
                      onChange={e =>
                        updateObjectArrayField(idx, key, i, parseFloat(e.target.value))
                      }
                    />
                  ))
                ) : (
                  <input
                    type={typeof val === "number" ? "number" : "text"}
                    value={val}
                    step="0.01"
                    className="border rounded p-1 ml-1 w-40"
                    onChange={e =>
                      updateObject(idx, key, typeof val === "number" ? parseFloat(e.target.value) : e.target.value)
                    }
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </section>

      {/* Export button */}
      <div className="flex justify-center">
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold text-lg"
          onClick={handleExport}
        >
          Export Level JSON
        </button>
      </div>
    </div>
  );
}