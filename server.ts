// In-memory player storage (with `id` property for each player)
let players: { id: number, x: number, y: number, z: number }[] = [];

// Counter for player sessions (for /incrementPlayerCount)
let playerCount = 0;

const server = Bun.serve({
  port: process.env.PORT || 3000,
  fetch(req, server) {
    const url = new URL(req.url);
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

//console.log(`Server running on port ${server.port}`);
console.log(`Server running on port ${server.port}`);