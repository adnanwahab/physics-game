
import { useNavigate } from "react-router-dom";


import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Map, NavigationControl, Popup, useControl} from 'react-map-gl/mapbox';
import {GeoJsonLayer, ArcLayer} from 'deck.gl';
import {MapboxOverlay as DeckOverlay} from '@deck.gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

// source: Natural Earth http://www.naturalearthdata.com/ via geojson.xyz
const AIR_PORTS =
  'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson';

// Set your Mapbox token here or via environment variable
const MAPBOX_TOKEN = 

'pk.eyJ1IjoiYXdhaGFiIiwiYSI6ImNrdjc3NW11aTJncmIzMXExcXRiNDNxZWYifQ.tqFU7uVd6mbhHtjYsjtvlg'// eslint-disable-line

const INITIAL_VIEW_STATE = {
  latitude: 51.47,
  longitude: 0.45,
  zoom: 4,
  bearing: 0,
  pitch: 30
};


const MAP_STYLE = 'mapbox://styles/mapbox/light-v9';
function DeckGLOverlay(props) {
  const overlay = useControl(() => new DeckOverlay(props));
  overlay.setProps(props);
  return null;
}

function Root() {
    const [selected, setSelected] = useState(null);
  
    const layers = [
      new GeoJsonLayer({
        id: 'airports',
        data: AIR_PORTS,
        // Styles
        filled: true,
        pointRadiusMinPixels: 2,
        pointRadiusScale: 2000,
        getPointRadius: f => 11 - f.properties.scalerank,
        getFillColor: [200, 0, 80, 180],
        // Interactive props
        pickable: true,
        autoHighlight: true,
        onClick: info => setSelected(info.object)
        // beforeId: 'waterway-label' // In interleaved mode render the layer under map labels
      }),
      new ArcLayer({
        id: 'arcs',
        data: AIR_PORTS,
        dataTransform: d => d.features.filter(f => f.properties.scalerank < 4),
        // Styles
        getSourcePosition: f => [-0.4531566, 51.4709959], // London
        getTargetPosition: f => f.geometry.coordinates,
        getSourceColor: [0, 128, 200],
        getTargetColor: [200, 0, 80],
        getWidth: 1
      })
    ];
  
    return (
      <Map
        initialViewState={INITIAL_VIEW_STATE}
        mapStyle={MAP_STYLE}
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        {selected && (
          <Popup
            key={selected.properties.name}
            anchor="bottom"
            style={{zIndex: 10}} /* position above deck.gl canvas */
            longitude={selected.geometry.coordinates[0]}
            latitude={selected.geometry.coordinates[1]}
          >
            {selected.properties.name} ({selected.properties.abbrev})
          </Popup>
        )}
        <DeckGLOverlay layers={layers} /* interleaved*/ />
        <NavigationControl position="top-left" />
      </Map>
    );
  }
  

// Mock levels data - replace with your actual data source
const levels = [
    { id: '0', name: 'Hub', difficulty: 'Easy', description: 'The entry hub linking all mini-games.' },
    { id: '1', name: 'Jump on the Cube', difficulty: 'Easy', description: 'Basic 2D platformer – jump on a cube to win.' },
    { id: '2', name: 'Simulation Rewind', difficulty: 'Medium', description: 'Rewind time and simulate different outcomes.' },
    { id: '3', name: 'Bridge Building', difficulty: 'Medium', description: 'Cross the cuboid bridge to reach the goal.' },
    { id: '4', name: 'Protecting Daedalus', difficulty: 'Hard', description: 'A cooperative level involving politics and teamwork.' },
    { id: '5', name: 'Warsong Gulch', difficulty: 'Expert', description: 'Inspired by classic competitive capture-the-flag.' },
    { id: '6', name: 'Cooking Tutor', difficulty: 'Easy', description: 'Complete recipes step-by-step in a kitchen simulation.' },
    { id: '7', name: 'Yoga Assist Tutor', difficulty: 'Medium', description: 'Follow movement prompts to perfect yoga poses.' },
    { id: '8', name: 'Rearrange the Room', difficulty: 'Easy', description: 'Select and move objects to redesign a room.' },
    { id: '9', name: 'Cheese Heist', difficulty: 'Medium', description: 'Guide a mouse to steal cheese undetected.' },
    { id: '10', name: 'Pointcloud Merge', difficulty: 'Medium', description: 'Join two apps using point cloud data.' },
    { id: '11', name: 'Puzzle Path', difficulty: 'Easy', description: 'Solve logic puzzles to open the next path.' },
    { id: '12', name: '317 Logging', difficulty: 'Medium', description: 'Visualize transparent city logging mechanics.' },
    { id: '13', name: 'Pensieve Laws', difficulty: 'Medium', description: 'Use the Pensieve to alter physical laws.' },
    { id: '14', name: 'Elevator Action', difficulty: 'Easy', description: 'Ride elevators to reach higher floors safely.' },
    { id: '15', name: 'Ball Sorter', difficulty: 'Easy', description: 'Sort colored balls into matching bins.' },
    { id: '16', name: 'Robotic Arms', difficulty: 'Hard', description: 'Control robotic arms to assemble components.' },
    { id: '17', name: 'Platforming Over Lava', difficulty: 'Hard', description: 'Classic 2D platforming over dangerous lava.' },
    { id: '18', name: 'Magnets and Motion', difficulty: 'Medium', description: 'Use magnets to move objects and solve puzzles.' },
    { id: '19', name: 'Paint by Numbers', difficulty: 'Easy', description: 'Recreate pixel art using numbers as guides.' },
    { id: '20', name: 'Coded Escape Room', difficulty: 'Medium', description: 'Use code snippets to escape the room.' },
    { id: '21', name: 'Floating Islands', difficulty: 'Medium', description: 'Traverse floating platforms in 3D space.' },
    { id: '22', name: 'Water Simulation', difficulty: 'Medium', description: 'Manipulate fluid physics to solve obstacles.' },
    { id: '23', name: 'Rocket Science', difficulty: 'Hard', description: 'Build and launch rockets with accurate physics.' },
    { id: '24', name: 'Electromaze', difficulty: 'Hard', description: 'Guide a charge through a maze using electromagnetic fields.' },
    { id: '25', name: 'Deus Ex Machina', difficulty: 'Expert', description: 'Manipulate the game engine as an all-powerful player.' },
    { id: '26', name: 'Color Match', difficulty: 'Easy', description: 'Match colors to unlock doors.' },
    { id: '27', name: 'Gravity Flip', difficulty: 'Medium', description: 'Invert gravity to navigate tricky terrain.' },
    { id: '28', name: 'Invisible Maze', difficulty: 'Medium', description: 'Navigate a maze you cannot see.' },
    { id: '29', name: 'Physics Sandbox', difficulty: 'Easy', description: 'Experiment with basic physics in a sandbox environment.' },
    { id: '30', name: 'Reaction Time Tester', difficulty: 'Easy', description: 'Test your reflexes with quick prompts.' },
    { id: '31', name: 'Boat Builder', difficulty: 'Medium', description: 'Construct a functional boat with buoyancy.' },
    { id: '32', name: 'Magical Forest', difficulty: 'Easy', description: 'Explore a forest with magical interactable objects.' },
    { id: '33', name: 'Wind Power', difficulty: 'Medium', description: 'Harness wind to move objects and generate energy.' },
    { id: '34', name: 'Solar Circuit', difficulty: 'Medium', description: 'Use solar power to complete circuitry.' },
    { id: '35', name: 'Time Lock', difficulty: 'Hard', description: 'Manipulate time to solve locks and puzzles.' },
    { id: '36', name: 'Mirror Room', difficulty: 'Medium', description: 'Reflect lasers using mirrors to reach targets.' },
    { id: '37', name: 'The Big Switch', difficulty: 'Easy', description: 'Find and activate the big switch.' },
    { id: '38', name: 'Maze Runner', difficulty: 'Medium', description: 'Race through a classic maze before the timer runs out.' },
    { id: '39', name: 'Rocket Navigation', difficulty: 'Hard', description: 'Navigate a rocket past asteroids.' },
    { id: '40', name: 'Hoverboard Hero', difficulty: 'Easy', description: 'Ride the hoverboard to reach the finish.' },
    { id: '41', name: 'Balance Beam', difficulty: 'Medium', description: 'Walk across beams without falling.' },
    { id: '42', name: 'Color Mixing', difficulty: 'Easy', description: 'Mix colors to create new ones and progress.' },
    { id: '43', name: 'Laser Logic', difficulty: 'Hard', description: 'Arrange components so lasers activate sensors.' },
    { id: '44', name: 'Windy Climb', difficulty: 'Medium', description: 'Climb structures while dealing with strong winds.' },
    { id: '45', name: 'Secret Notes', difficulty: 'Easy', description: 'Find all hidden annotations in the level.' },
    { id: '46', name: 'Jump Pads', difficulty: 'Easy', description: 'Use bounce pads to reach distant platforms.' },
    { id: '47', name: 'Safety Inspector', difficulty: 'Medium', description: 'Analyze structures for safety violations.' },
    { id: '48', name: 'Code Bridge', difficulty: 'Hard', description: 'Write code to construct bridges dynamically.' },
    { id: '49', name: 'Shape Shifter', difficulty: 'Medium', description: 'Change forms to solve level-specific puzzles.' },
    { id: '50', name: 'Interactive Editor', difficulty: 'Medium', description: 'Edit objects in the level in real time.' },
    { id: '51', name: 'Object Teleport', difficulty: 'Easy', description: 'Teleport objects to help the player advance.' },
    { id: '52', name: 'Two Worlds', difficulty: 'Hard', description: 'Navigate between two parallel worlds.' },
    { id: '53', name: 'Magnet Mayhem', difficulty: 'Medium', description: 'Combine and repel magnets to climb the level.' },
    { id: '54', name: 'Mechanical Mouse', difficulty: 'Medium', description: 'Guide a robot mouse through a maze.' },
    { id: '55', name: 'Giant Dominoes', difficulty: 'Easy', description: 'Tip dominoes to trigger chain reactions.' },
    { id: '56', name: 'Energy Flow', difficulty: 'Medium', description: 'Direct energy streams to power devices.' },
    { id: '57', name: 'Open the Gate', difficulty: 'Easy', description: 'Unlock gates by solving mini-puzzles.' },
    { id: '58', name: 'Pressure Plates', difficulty: 'Medium', description: 'Step on pressure plates to open new paths.' },
    { id: '59', name: 'Teleport Maze', difficulty: 'Hard', description: 'Use teleporters to reach the exit.' },
    { id: '60', name: 'Moving Platforms', difficulty: 'Medium', description: 'Jump across platforms that move on their own.' },
    { id: '61', name: 'Everyone Votes', difficulty: 'Easy', description: 'Players vote on a shared outcome.' },
    { id: '62', name: 'Creative Sandbox', difficulty: 'Easy', description: 'Build or destroy anything, freely experiment.' },
    { id: '63', name: 'Knowledge Worker Productivity Improver', difficulty: 'Medium', description: 'Why did I not complete a Jira ticket? Learn productivity through analysis.' }
];



export default function LevelList() {
  const navigate = useNavigate();

  const handleRowClick = (gameId) => {
    navigate(`/game/${gameId}`);
  };

  return (
    <div style={{ padding: "20px", height: "50vh", overflowY: "auto" }}>
      <h1>Levels</h1>
      <button>edit </button>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
        }}
      >
        <thead>
          <tr
            style={{
              // Remove distinct background to blend with tbody
              backgroundColor: "transparent", // No special header bg
              borderBottom: "2px solid #e5e7eb",
            }}
          >
            <th
              style={{
                padding: "12px",
                textAlign: "left",
                fontWeight: "bold",
                color: "inherit", // inherit table color
                backgroundColor: "transparent",
              }}
            >
              ID
            </th>
            <th
              style={{
                padding: "12px",
                textAlign: "left",
                fontWeight: "bold",
                color: "inherit",
                backgroundColor: "transparent",
              }}
            >
              Name
            </th>
            <th
              style={{
                padding: "12px",
                textAlign: "left",
                fontWeight: "bold",
                color: "inherit",
                backgroundColor: "transparent",
              }}
            >
              Description
            </th>
            <th
              style={{
                padding: "12px",
                textAlign: "left",
                fontWeight: "bold",
                color: "inherit",
                backgroundColor: "transparent",
              }}
            >
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {levels.map((level) => (
            <tr
              key={level.id}
              onClick={() => handleRowClick(level.id)}
              style={{
                cursor: "pointer",
                borderBottom: "1px solid #e5e7eb",
                transition: "background-color 0.2s",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f9fafb";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <td style={{ padding: "12px" }}>{level.id}</td>
              <td style={{ padding: "12px" }}>{level.name}</td>
              {/* <td style={{ padding: '12px' }}>{level.difficulty}</td> */}
              <td style={{ padding: "12px" }}>{level.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const suggestion = formData.get("suggestion");
          if (suggestion && suggestion.trim()) {
            // Simulate sending to Helios and Daedalus (replace this with actual submission logic if needed)
            alert("Forwarding suggestion to Helios + Daedalus: " + suggestion);
            e.target.reset();
          }
        }}
        style={{
          marginTop: "30px",
          padding: "18px 24px",
          background: "#f4f4fa",
          borderRadius: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <label
          htmlFor="suggestion-input"
          style={{ fontWeight: 600, marginBottom: 8, color: "#28194a" }}
        >
          Forward suggestion to Helios + Daedalus
        </label>
        <textarea
          id="suggestion-input"
          name="suggestion"
          rows={3}
          required
          placeholder="Your suggestion..."
          style={{
            width: "100%",
            minWidth: "340px",
            maxWidth: "100%",
            resize: "vertical",
            padding: "10px",
            fontSize: "1rem",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            marginBottom: "12px",
            background: "#fff",
            color: "#20232a",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "8px 18px",
            background: "#6d28d9",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(85,37,130,0.08)",
          }}
        >
          Forward Suggestion
        </button>
      </form>
      <Root></Root>
    </div>
  );
}
