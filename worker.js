// worker.js
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

let db;

const initDatabase = async () => {
  const sqlite3 = await sqlite3InitModule();
  
  // 'c' = create if not exists, 't' = write through to disk (OPFS)
  // This ensures data persists even if the user refreshes the page
  db = new sqlite3.oo1.OpfsDb('/my_meteor_style_db.sqlite3', 'ct');
  
  console.log("🎒 Client-side SQLite initialized and ready!");
};

// Listen for queries from the main browser window/console
self.onmessage = async (e) => {
  const { sql, msgId } = e.data;
  const result = [];

  try {
    // Execute SQL query
    db.exec({
      sql: sql,
      rowMode: 'object', // Returns rows as clean JS objects
      callback: (row) => result.push(row)
    });
    
    // Send rows back to the main thread
    self.postMessage({ msgId, success: true, data: result });
  } catch (error) {
    self.postMessage({ msgId, success: false, error: error.message });
  }
};

initDatabase();