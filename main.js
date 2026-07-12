// main.js
const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

// A registry to map async worker responses back to their original Promises
const pendingQueries = new Map();
let queryIdCounter = 0;

worker.onmessage = (e) => {
  const { msgId, success, data, error } = e.data;
  const promise = pendingQueries.get(msgId);
  
  if (promise) {
    if (success) promise.resolve(data);
    else promise.reject(new Error(error));
    pendingQueries.delete(msgId);
  }
};

// 🌟 Expose the magic helper to the browser console!
window.db = {
  query: (sqlString) => {
    return new Promise((resolve, reject) => {
      const msgId = queryIdCounter++;
      pendingQueries.set(msgId, { resolve, reject });
      worker.postMessage({ sql: sqlString, msgId });
    });
  }
};