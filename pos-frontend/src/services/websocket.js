import zeroconfDiscovery from "./discovery";

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectTimer = null;
    this.clientId = this.generateClientId();
    this.authRetryCount = 0;
    this.maxAuthRetries = 3;
    this.authenticationPromise = null;
    this.manualDisconnect = false;
    this.isAuthenticated = false;
    this.useZeroconf = process.env.REACT_APP_USE_ZEROCONF === "true";
    this.zeroconfDiscoveryTimeout = 10000; // 10 seconds for discovery
    this.pingInterval = null;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 5;
  }

  generateClientId() {
    return "client_" + Math.random().toString(36).substr(2, 9);
  }

  resetState() {
    this.manualDisconnect = false;
    this.connectionAttempts = 0;
    this.authRetryCount = 0;
  }

  async connect() {
    // Reset manual disconnect flag when explicitly trying to connect
    this.manualDisconnect = false;

    // Track connection attempts to prevent infinite loops
    this.connectionAttempts++;
    if (this.connectionAttempts > this.maxConnectionAttempts) {
      console.error("Maximum connection attempts reached");
      return Promise.reject(new Error("Maximum connection attempts reached"));
    }

    let wsUrl;

    if (this.useZeroconf) {
      try {
        // Try to discover services first
        await zeroconfDiscovery.startDiscovery(this.zeroconfDiscoveryTimeout);
        const services = zeroconfDiscovery.getServices();

        if (services.length > 0) {
          // Use the first service found (or you could implement user selection)
          const service = services[0];
          zeroconfDiscovery.selectService(service.id);

          // Create WebSocket URL from discovered service
          const wsProtocol =
            window.location.protocol === "https:" ? "wss" : "ws";
          wsUrl = `${wsProtocol}://${service.ip}:${service.port}/ws/${this.clientId}`;
          console.log(`Connecting to discovered service: ${wsUrl}`);
        } else {
          // Fallback to default if no services found
          console.log("No services discovered, using default connection");
          wsUrl = this.getDefaultWebSocketUrl();
        }
      } catch (error) {
        console.error("Error during service discovery:", error);
        wsUrl = this.getDefaultWebSocketUrl();
      }
    } else {
      // Use default connection method
      wsUrl = this.getDefaultWebSocketUrl();
    }

    // Clean up any existing socket before creating a new one
    this.cleanupExistingSocket();

    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(wsUrl);

        // Set timeout for connection
        const connectionTimeout = setTimeout(() => {
          if (!this.isConnected && this.socket) {
            this.socket.close();
            reject(new Error("Connection timeout"));
          }
        }, 10000);

        this.socket.onopen = () => {
          console.log("WebSocket connected");
          this.isConnected = true;
          clearTimeout(connectionTimeout);
          // Reset connection attempts on successful connection
          this.connectionAttempts = 0;
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        this.socket.onclose = (event) => {
          console.log("WebSocket disconnected", event.code, event.reason);
          this.isConnected = false;
          this.isAuthenticated = false;
          this.authenticationPromise = null;
          clearInterval(this.pingInterval);
          clearTimeout(connectionTimeout);

          // Only attempt to reconnect if:
          // 1. It wasn't a manual disconnect
          // 2. We haven't exceeded auth retries
          // 3. We haven't received a terminal error
          if (
            !this.manualDisconnect &&
            this.authRetryCount < this.maxAuthRetries &&
            this.connectionAttempts < this.maxConnectionAttempts &&
            event.code !== 4000
          ) {
            // Exponential backoff for reconnection
            const delay = Math.min(
              5000 * Math.pow(1.5, this.connectionAttempts - 1),
              30000
            );
            console.log(`Scheduling reconnect in ${delay}ms`);

            this.reconnectTimer = setTimeout(() => {
              this.connect().catch((err) => {
                console.error("Reconnection failed:", err);
              });
            }, delay);
          }
        };

        this.socket.onerror = (error) => {
          console.error("WebSocket error:", error);
          // Don't reject here, let onclose handle reconnection
        };
      } catch (error) {
        console.error("Error creating WebSocket:", error);
        reject(error);
      }
    });
  }

  cleanupExistingSocket() {
    if (this.socket) {
      // Remove all event listeners
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onclose = null;
      this.socket.onerror = null;

      // Close the socket if it's still open
      if (
        this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING
      ) {
        this.socket.close();
      }

      this.socket = null;
    }

    // Clear any existing timers
    clearTimeout(this.reconnectTimer);
    clearInterval(this.pingInterval);
  }
  getDefaultWebSocketUrl() {
    const host = window.location.hostname;
    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const port = process.env.REACT_APP_WS_PORT || "8000";
    return `${wsProtocol}://${host}:${port}/ws`;
  }

  authenticateFromCookies() {
    // The cookies are sent automatically with the WebSocket handshake
    return Promise.resolve();
  }

  startPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(() => {
      if (this.isConnected && this.isAuthenticated) {
        this.send({
          type: "ping",
          timestamp: Date.now(),
        }).catch((err) => {
          console.warn("Failed to send ping:", err);
        });
      }
    }, 30000);
  }

  send(data) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.socket) {
        reject(new Error("WebSocket not connected"));
        return;
      }

      try {
        this.socket.send(JSON.stringify(data));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  handleMessage(data) {
    switch (data.type) {
      case "auth_success":
        console.log("WebSocket authentication successful");
        break;

      case "auth_failed":
        console.error("WebSocket authentication failed:", data.message);
        const authErrorEvent = new CustomEvent("websocket-auth-error", {
          detail: { message: data.message },
        });
        document.dispatchEvent(authErrorEvent);
        break;

      case "pong":
        if (data.timestamp) {
          const latency = Date.now() - data.timestamp;
          console.debug(`WebSocket latency: ${latency}ms`);
        }
        break;

      default:
        const messageEvent = new CustomEvent("websocket-message", {
          detail: data,
        });
        document.dispatchEvent(messageEvent);
    }
  }

  disconnect(code = 1000, reason = "") {
    this.manualDisconnect = true;
    this.cleanupExistingSocket();
    this.isConnected = false;
    this.isAuthenticated = false;
    this.authenticationPromise = null;
  }
}

const webSocketService = new WebSocketService();
export default webSocketService;
