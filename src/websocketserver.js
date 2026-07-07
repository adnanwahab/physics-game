import { appendFileSync } from "node:fs"; // 1. Import the append function

const LOG_FILE_PATH = "./player_joins.log";

const server = Bun.serve({
  port: 8000,
  fetch(req, server) {
    const url = new URL(req.url);
    const room = url.searchParams.get("room") ?? "lobby";
    const playerId = crypto.randomUUID();

    if (server.upgrade(req, { data: { playerId, room } })) {
      return;
    }
    return new Response("WebSocket only", { status: 426 });
  },
  websocket: {
    open(ws) {
      ws.subscribe(ws.data.room); // join room
      ws.subscribe(`player:${ws.data.playerId}`); // direct channel

      // 2. Log the event to your file
      const logEntry = `${new Date().toISOString()} | Player ${ws.data.playerId} joined room: ${ws.data.room}\n`;
      try {
        appendFileSync(LOG_FILE_PATH, logEntry, "utf-8");
      } catch (err) {
        console.error("Failed to write to log file:", err);
      }

      server.publish(
        ws.data.room,
        JSON.stringify({
          type: "join",
          playerId: ws.data.playerId,
        }),
      );
    },
    message(ws, raw) {
      const msg = JSON.parse(String(raw));
      ws.publish(
        ws.data.room,
        JSON.stringify({
          type: "state",
          from: ws.data.playerId,
          ...msg,
        }),
      );
    },
    close(ws) {
      server.publish(
        ws.data.room,
        JSON.stringify({
          type: "leave",
          playerId: ws.data.playerId,
        }),
      );
    },
    perMessageDeflate: false,
    maxPayloadLength: 16 * 1024,
    idleTimeout: 120,
    backpressureLimit: 1024 * 1024,
    sendPings: true,
  },
});

console.log(`ws://localhost:${server.port}`);
