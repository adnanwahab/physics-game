/**
 * Stubbed WebSocket connection utility
 */
export class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.isConnecting = false;
  }

  connect() { /* stub */ }
  disconnect() { /* stub */ }
  send(data) { /* stub */ }
  on(event, callback) { /* stub */ }
  off(event, callback) { /* stub */ }
  emit(event, data) { /* stub */ }

  get readyState() {
    return 3; // WebSocket.CLOSED in browser env
  }

  get isConnected() {
    return false;
  }
}
