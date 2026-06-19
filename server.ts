/**
 * SERVER CONNECTION REFUSED ERROR HELP:
 * 
 * If you are seeing ERR_CONNECTION_REFUSED in the browser console, 
 * it's likely that the Bun server is not running, is running on the wrong port,
 * or is listening only on localhost but your client isn't fetching from exactly the same host/port.
 * 
 * By default, Bun.serve binds only to 127.0.0.1 (localhost). For containers, remote, or LAN access 
 * — or for using window.location.hostname in the frontend — you must listen on "0.0.0.0".
 * 
 * For development, ensure you run:
 *   bun server.ts
 * and your project allows port 3000, or change port to your needs.
 * 
 * To fix most connection errors, listen on all interfaces ("0.0.0.0").
 */



let players= []
let nextId = 1;


function makePlayer (){ 
 return {
  id: nextId++,
  x: 0,
  y: 0,
  z: 0
}
}

const server = Bun.serve({
    port: 3000,
    routes: {
      'addPlayerToRoom':( ) => {players.push(makePlayer())},
      'getPlayers':( ) => {return players},
      'removePlayerFromRoom':( ) => {},
      'movePlayers': () => {
      for (const player of players) {
        player.x += 1;
        player.y += 1;
      }
 
      }
    },


    async fetch(req) {
        return new Response('Not Found', { status: 404, headers: CORS });
    },
});

console.log(`Game server running at ${server.url} (hostname: 0.0.0.0)`);
