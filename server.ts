// In-memory player storage (with `id` property for each player)
let players: { id: number, x: number, y: number, z: number }[] = [];

// Counter for player sessions (for /incrementPlayerCount)
let playerCount = 0;

const server = Bun.serve({
  // Make sure to listen on 5173 since the frontend is posting to localhost:5173
  port: Number(process.env.PORT) || 5173, // Changed default port to 5173 to match expected client port
  fetch(req, server) {
    const url = new URL(req.url, `http://${req.headers.get("host") || "localhost:5173"}`);
    const pathname = url.pathname;

    // Endpoint: GET /getPlayers - Return list of players
    if (pathname === "/getPlayers" && req.method === "GET") {
      console.log('players');
      return new Response(JSON.stringify(players), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Endpoint: POST /newPlayer - Add a new player and return player with id
    if (pathname === "/newPlayer" && req.method === "POST") {
      console.log('newPlayer');
      return req.json().then((data) => {
        // Create a new player (simple id assignment)
        const id = players.length > 0 ? players[players.length - 1].id + 1 : 1;
        const player = { id, x: data.x ?? 0, y: data.y ?? 0, z: data.z ?? 0 };
        players.push(player); // Actually store it!
        return new Response(JSON.stringify(player), {
          status: 201,
          headers: { "Content-Type": "application/json" }
        });
      });
    }

    // Endpoint: POST /playerMove - Move a player (example logic)
    if (pathname === "/playerMove" && req.method === "POST") {
      return req.json().then((data) => {
        // Expect data to include player id and movement deltas
        const { id, dx = 1, dy = 1, dz = 0 } = data;
        const player = players.find(p => p.id === id);
        if (player) {
          player.x += dx;
          player.y += dy;
          player.z += dz;
          return new Response(JSON.stringify(player), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } else {
          return new Response(JSON.stringify({ error: "Player not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
          });
        }
      });
    }

    // Endpoint: POST /incrementPlayerCount - Increment and return count
    if (pathname === "/incrementPlayerCount" && req.method === "POST") {
      playerCount += 1;
      return new Response(JSON.stringify({ count: playerCount }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 404 for all other unmatched endpoints
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running on port ${server.port}`);