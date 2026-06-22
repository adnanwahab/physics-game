const server = Bun.serve({
  port: 8000,
  fetch(req, server) {
    const url = new URL(req.url);
    const room = url.searchParams.get("room") ?? "lobby";
    const playerId = crypto.randomUUID();
    // upgrade; data here is attached to ws.data
    if (server.upgrade(req, { data: { playerId, room } })) {
      return; // upgraded, don't return a Response
    }
    return new Response("WebSocket only", { status: 426 });
  },
  websocket: {
    open(ws) {
      ws.subscribe(ws.data.room);                       // join room
      ws.subscribe(`player:${ws.data.playerId}`);       // direct channel
      server.publish(ws.data.room, JSON.stringify({
        type: "join", playerId: ws.data.playerId,
      }));
    },
    message(ws, raw) {
      const msg = JSON.parse(String(raw));
      // broadcast position to everyone in the room (incl. or excl. sender)
      ws.publish(ws.data.room, JSON.stringify({
        type: "state", from: ws.data.playerId, ...msg,
      }));
    },
    close(ws) {
      server.publish(ws.data.room, JSON.stringify({
        type: "leave", playerId: ws.data.playerId,
      }));
      // unsubscribe is automatic on close
    },
    // tuning that matters for a game loop:
    perMessageDeflate: false,   // turn OFF for low-latency small frames
    maxPayloadLength: 16 * 1024,
    idleTimeout: 120,           // seconds
    backpressureLimit: 1024 * 1024,
    sendPings: true,
  },
});
console.log(`ws://localhost:${server.port}`);