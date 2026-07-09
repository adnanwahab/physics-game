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
console.log("folder watcher online");

import { watch } from "fs"; // Bun supports native fs watch, or Bun.watch
import { readdir, stat } from "fs/promises";
import { join } from "path";

const WATCH_DIR = "/Users/shelbernstein/presentations"; // Change this to your folder path

// Keep track of known file sizes: { filename: sizeInBytes }
const fileRegistry = new Map();

// Initialize the registry with existing files so we don't treat them as "new"
async function initRegistry() {
  try {
    const files = await readdir(WATCH_DIR);
    for (const file of files) {
      const filePath = join(WATCH_DIR, file);
      const fileStat = await stat(filePath).catch(() => null);
      if (fileStat && fileStat.isFile()) {
        fileRegistry.set(file, fileStat.size);
      }
    }
    console.log(
      `✨ Initialized. Watching ${fileRegistry.size} existing files in '${WATCH_DIR}'...`,
    );
  } catch (err) {
    console.error("Error initializing directory:", err.message);
  }
}

// Function that handles the analysis and generates the JSON
function analyzeNewFile(newFileName, newSize) {
  const diffs = {};

  // Compare the new file's size to every other existing file
  for (const [existingFile, existingSize] of fileRegistry.entries()) {
    if (existingFile === newFileName) continue;

    const diffInBytes = newSize - existingSize;
    diffs[existingFile] = {
      compared_file_size_bytes: existingSize,
      difference_bytes: diffInBytes,
      status:
        diffInBytes > 0 ? "larger" : diffInBytes < 0 ? "smaller" : "equal",
    };
  }

  const result = {
    event: "file_added",
    timestamp: new Date().toISOString(),
    new_file: {
      name: newFileName,
      size_bytes: newSize,
    },
    comparisons: diffs,
  };

  // Print or save the JSON
  console.log("\n📊 [NEW FILE ANALYSIS] Generated JSON:");
  console.log(JSON.stringify(result, null, 2));
}

// Start watching the directory
async function startWatching() {
  await initRegistry();

  // Bun optimizes standard fs.watch under the hood
  watch(WATCH_DIR, async (eventType, filename) => {
    if (!filename || eventType !== "rename") return;
    // 'rename' triggers when files are added, deleted, or renamed

    const filePath = join(WATCH_DIR, filename);

    try {
      const fileStat = await stat(filePath);

      // Check if it's a file and it's actually NEW (not just modified or deleted)
      if (fileStat.isFile() && !fileRegistry.has(filename)) {
        const newSize = fileStat.size;

        // 1. Run the function to generate the JSON comparison
        analyzeNewFile(filename, newSize);

        // 2. Add the new file to our registry so we can compare future files against it
        fileRegistry.set(filename, newSize);
      }
    } catch (error) {
      // If stat fails, the file was likely deleted or moved out, so we clean it up
      if (fileRegistry.has(filename)) {
        fileRegistry.delete(filename);
        console.log(`❌ Removed ${filename} from registry.`);
      }
    }
  });
}

startWatching();
