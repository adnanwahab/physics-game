const server = Bun.serve({
  port: process.env.PORT || 3000,
  fetch(req, server) {
    // Upgrade HTTP to WebSocket
    if (server.upgrade(req)) {
      return; // WebSocket upgrade successful
    }
    
    // Regular HTTP response
    return new Response("WebSocket server running!");
  },
  websocket: {
    open(ws) {
      console.log("Client connected");
      ws.send("Welcome to the WebSocket server!");
    },
    message(ws, message) {
      console.log("Received:", message);
      // Echo the message back
      ws.send(`Server received: ${message}`);
    },
    close(ws) {
      console.log("Client disconnected");
    },
  },
});

console.log(`Server running on port ${server.port}`);