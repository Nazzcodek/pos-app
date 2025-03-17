import React, { createContext, useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { setUser, logout } from "../redux/slices/authSlice";
import api from "../api";
import Loader from "../components/common/Loader";
import WebSocketService from "../services/websocket";
import zeroconfDiscovery from "../services/discovery";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [wsInitialized, setWsInitialized] = useState(false);
  const [wsInitializing, setWsInitializing] = useState(false);
  const [discoveredServices, setDiscoveredServices] = useState([]);
  const [connectionErrors, setConnectionErrors] = useState(0);
  const MAX_RETRY_ATTEMPTS = 3;

  // Handle service discovery
  useEffect(() => {
    const handleServiceDiscovery = async () => {
      try {
        await zeroconfDiscovery.startDiscovery();
        const services = zeroconfDiscovery.getServices();
        setDiscoveredServices(services);
      } catch (error) {
        console.error("Failed to discover services:", error);
      }
    };

    // Add event listener for service discovery events
    const serviceEventHandler = (event, data) => {
      if (event === "serviceFound" || event === "serviceRemoved") {
        setDiscoveredServices(zeroconfDiscovery.getServices());
      }
    };

    zeroconfDiscovery.addEventListener(serviceEventHandler);

    // Initial discovery
    if (!wsInitialized && !wsInitializing) {
      handleServiceDiscovery();
    }

    return () => {
      zeroconfDiscovery.removeEventListener(serviceEventHandler);
    };
  }, [wsInitialized, wsInitializing]);

  // Listen for WebSocket authentication errors
  useEffect(() => {
    const handleAuthError = (event) => {
      toast.error(`WebSocket authentication error: ${event.detail.message}`);
      setWsInitialized(false);
    };

    document.addEventListener("websocket-auth-error", handleAuthError);

    return () => {
      document.removeEventListener("websocket-auth-error", handleAuthError);
    };
  }, []);

  // Handle WebSocket initialization after successful authentication
  useEffect(() => {
    const initializeWebSocket = async () => {
      // Prevent concurrent initialization attempts
      if (wsInitializing || wsInitialized) return;

      setWsInitializing(true);

      try {
        // If WebSocket is already connected, disconnect first
        if (WebSocketService.isConnected) {
          WebSocketService.disconnect();
          // Give time for the connection to fully close
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Reset WebSocket state before connecting
        WebSocketService.resetState();

        // Connect to WebSocket
        await WebSocketService.connect();
        await WebSocketService.authenticateFromCookies();

        setWsInitialized(true);
        setConnectionErrors(0);
      } catch (error) {
        console.error("Failed to initialize WebSocket:", error);

        // Increment error count
        setConnectionErrors((prev) => prev + 1);

        // Only retry with discovery if we haven't exceeded max attempts
        if (connectionErrors < MAX_RETRY_ATTEMPTS) {
          try {
            // Force refresh discovery before retry
            await zeroconfDiscovery.forceRefresh();

            // Reset WebSocket state before connecting
            WebSocketService.resetState();

            await WebSocketService.connect();
            await WebSocketService.authenticateFromCookies();

            setWsInitialized(true);
            setConnectionErrors(0);
          } catch (retryError) {
            console.error(
              "Failed to initialize WebSocket after discovery:",
              retryError
            );
            toast.error(
              "Failed to establish WebSocket connection. Please check your network connection."
            );
          }
        } else {
          toast.error(
            "Failed to connect after multiple attempts. Please try again later."
          );
        }
      } finally {
        setWsInitializing(false);
      }
    };

    if (isAuthenticated && user && !wsInitialized && !wsInitializing) {
      initializeWebSocket();
    }

    return () => {
      // Only disconnect if this component is unmounting
      if (!isAuthenticated) {
        WebSocketService.disconnect();
        setWsInitialized(false);
      }
    };
  }, [isAuthenticated, user, wsInitialized, wsInitializing, connectionErrors]);

  // Initial auth check
  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await api.get("/user/me");
        dispatch(setUser(response.data));
      } catch (error) {
        // Only dispatch logout if we're not already logged out
        if (isAuthenticated) {
          dispatch(logout());
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [dispatch, isAuthenticated]);

  const login = async (username, password) => {
    try {
      await api.post("/user/login", { username, password });
      const response = await api.get("/user/me");
      dispatch(setUser(response.data));
      // WebSocket connection will be handled by the effect
      return true;
    } catch (error) {
      toast.error("Login failed. Please check your credentials.");
      throw error;
    }
  };

  const logoutUser = async () => {
    try {
      // Disconnect WebSocket first
      WebSocketService.disconnect();
      setWsInitialized(false);

      // Then logout from API
      await api.post("/user/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      dispatch(logout());
    }
  };

  const selectService = (serviceId) => {
    const service = zeroconfDiscovery.selectService(serviceId);
    if (service) {
      // Disconnect current WebSocket if connected
      if (WebSocketService.isConnected) {
        WebSocketService.disconnect();
      }

      // Reset connection state to trigger reconnection
      setWsInitialized(false);
      return true;
    }
    return false;
  };

  // Manual reconnect function that can be called from UI
  const reconnectWebSocket = async () => {
    if (wsInitializing) return;

    setWsInitialized(false);
    WebSocketService.disconnect();

    // Wait for disconnect to complete
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Reset connection errors to allow fresh attempts
    setConnectionErrors(0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  const value = {
    user,
    isAuthenticated,
    login,
    logout: logoutUser,
    discoveredServices,
    wsInitialized,
    wsInitializing,
    selectService,
    reconnectWebSocket,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthProvider, useAuth };
