let players = [
  {x: 0, y: 0, z: 0 }
]
const server = Bun.serve({
  port: process.env.PORT || 3000,
  fetch(req, server) {
    // Upgrade HTTP to WebSocket
    // We'll use an in-memory array to store players
    // (Place this at top-level for persistence across requests)
    // let players: { id: number, [key: string]: any }[] = [] (you should move it outside if you want true storage)

    // Parse URL and pathname
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Endpoint: GET /players - Return list of players
    if (pathname === "/getPlayers") {
      console.log('players')
      return new Response(JSON.stringify(players), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Endpoint: POST /newPlayer - Add a new player
    if (pathname === "/newPlayer" && req.method === "POST") {
      console.log('newPlayer')

      // We'll expect JSON in the body
      return req.json().then((data) => {
        // Create a new player (simple id assignment)
        const id = players.length > 0 ? players[players.length - 1].id + 1 : 1;
        const player = { id, ...data };
        //players.push(player);
        return new Response(JSON.stringify(player), {
          status: 201,
          headers: { "Content-Type": "application/json" }
        });
      });
    }
    // Regular HTTP response
    return new Response("WebSocket server running!");
  },
  },
});

console.log(`Server running on port ${server.port}`);