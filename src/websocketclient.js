const ws = new WebSocket("ws://localhost:8000");

ws.onopen = () => ws.send(JSON.stringify({ type: "join", room: "lobby" }));
// ws.onmessage = (e) => console.log(JSON.parse(e.data));
ws.onclose = () => console.log("closed");
ws.onerror = (e) => console.error(e);
