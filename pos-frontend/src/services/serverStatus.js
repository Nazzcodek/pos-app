import checkServerHealth from "../routes/Services";

let serverStatus = "unknown";
let statusListeners = [];

export const getServerStatus = () => serverStatus;

export const registerServerStatusListener = (callback) => {
  statusListeners.push(callback);
  return () => {
    statusListeners = statusListeners.filter((cb) => cb !== callback);
  };
};

// Update status and notify all listeners
const updateStatus = (newStatus) => {
  if (newStatus !== serverStatus) {
    serverStatus = newStatus;
    statusListeners.forEach((listener) => listener(serverStatus));
  }
};

// Start periodic health checks
export const startHealthChecks = () => {
  // Initial check
  checkServerHealth();

  // Check every 30 seconds
  setInterval(checkServerHealth, 30000);
};

// WebSocket-based health monitoring
export const setupWebSocketMonitoring = (socket) => {
  if (!socket) return;

  // Send ping every 15 seconds
  const pingInterval = setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "ping" }));

      // Set timeout for response
      const pongTimeout = setTimeout(() => {
        updateStatus("offline");
      }, 3000);

      // One-time handler for this specific ping
      const messageHandler = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "pong") {
            clearTimeout(pongTimeout);
            updateStatus("online");
            socket.removeEventListener("message", messageHandler);
          }
        } catch (e) {
          // Ignore parsing errors
        }
      };

      socket.addEventListener("message", messageHandler);
    } else {
      updateStatus("offline");
    }
  }, 15000);

  // Update status based on WebSocket events
  socket.addEventListener("open", () => updateStatus("connecting"));
  socket.addEventListener("close", () => updateStatus("offline"));
  socket.addEventListener("error", () => updateStatus("error"));

  // Return cleanup function
  return () => clearInterval(pingInterval);
};
