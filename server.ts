// In-memory player storage (with `id` property for each player)
let players: { id: number, x: number, y: number, z: number }[] = [];

// Counter for player sessions (for /incrementPlayerCount)
let playerCount = 0;

// Use Node (Express-like) server, Bun-compatible fix
const http = require("http");

const PORT = Number(process.env.PORT) || 5173;

const server = http.createServer(async (req, res) => {
  // Parse whether this is JSON, allow both CORS and basic POST
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

  // Endpoint: GET /getPlayers - Return list of players
  if (url.pathname === "/getPlayers" && req.method === "GET") {
    console.log('players');
    res.setHeader("Content-Type", "application/json");
    res.writeHead(200);
    res.end(JSON.stringify(players));
    return;
  }

  // Endpoint: POST /newPlayer - Add a new player and return player with id
  if (url.pathname === "/newPlayer" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      // Simply always send a valid JSON response.
      let data;
      try {
        data = JSON.parse(body || "{}");
      } catch {
        data = {};
      }
      const id = players.length > 0 ? players[players.length - 1].id + 1 : 1;
      const player = { id, x: data.x ?? 0, y: data.y ?? 0, z: data.z ?? 0 };
      players.push(player);
      res.setHeader("Content-Type", "application/json");
      res.writeHead(201);
      res.end(JSON.stringify(player));
    });
    return;
  }

  // Endpoint: POST /playerMove - Move a player (example logic)
  if (url.pathname === "/playerMove" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      try {
        const data = JSON.parse(body || "{}");
        const { id, dx = 1, dy = 1, dz = 0 } = data;
        const player = players.find(p => p.id === id);
        if (player) {
          player.x += dx;
          player.y += dy;
          player.z += dz;
          res.setHeader("Content-Type", "application/json");
          res.writeHead(200);
          res.end(JSON.stringify(player));
        } else {
          res.setHeader("Content-Type", "application/json");
          res.writeHead(404);
          res.end(JSON.stringify({ error: "Player not found" }));
        }
      } catch (e) {
        res.setHeader("Content-Type", "application/json");
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  // Endpoint: POST /incrementPlayerCount - Increment and return count
  if (url.pathname === "/incrementPlayerCount" && req.method === "POST") {
    playerCount += 1;
    res.setHeader("Content-Type", "application/json");
    res.writeHead(200);
    res.end(JSON.stringify({ count: playerCount }));
    return;
  }

  // 404 for all other unmatched endpoints
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});