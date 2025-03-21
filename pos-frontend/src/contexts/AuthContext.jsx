import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
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
  const [wsStatus, setWsStatus] = useState({
    initialized: false,
    initializing: false,
    connectionErrors: 0,
  });
  const [discoveredServices, setDiscoveredServices] = useState([]);
  const MAX_RETRY_ATTEMPTS = 3;

  // Handle service discovery - only when needed
  useEffect(() => {
    const handleServiceDiscovery = async () => {
      try {
        await zeroconfDiscovery.startDiscovery();
        setDiscoveredServices(zeroconfDiscovery.getServices());
      } catch (error) {
        console.error("Failed to discover services:", error);
      }
    };

    const serviceEventHandler = (event) => {
      if (event === "serviceFound" || event === "serviceRemoved") {
        setDiscoveredServices(zeroconfDiscovery.getServices());
      }
    };

    // Only start discovery if we're authenticated but not connected
    if (isAuthenticated && !wsStatus.initialized && !wsStatus.initializing) {
      zeroconfDiscovery.addEventListener(serviceEventHandler);
      handleServiceDiscovery();
    }

    return () => {
      zeroconfDiscovery.removeEventListener(serviceEventHandler);
    };
  }, [isAuthenticated, wsStatus.initialized, wsStatus.initializing]);

  // WebSocket auth error listener
  useEffect(() => {
    const handleAuthError = (event) => {
      toast.error(`WebSocket authentication error: ${event.detail.message}`);
      setWsStatus((prev) => ({ ...prev, initialized: false }));
    };

    document.addEventListener("websocket-auth-error", handleAuthError);
    return () =>
      document.removeEventListener("websocket-auth-error", handleAuthError);
  }, []);

  // WebSocket connection management
  const initializeWebSocket = useCallback(async () => {
    // Prevent concurrent initialization attempts
    if (wsStatus.initializing || wsStatus.initialized) return;

    setWsStatus((prev) => ({ ...prev, initializing: true }));

    try {
      // Reset connection if needed
      if (WebSocketService.isConnected) {
        WebSocketService.disconnect();
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      WebSocketService.resetState();
      await WebSocketService.connect();
      await WebSocketService.authenticateFromCookies();

      setWsStatus({
        initialized: true,
        initializing: false,
        connectionErrors: 0,
      });
    } catch (error) {
      console.error("WebSocket initialization failed:", error);

      const newErrorCount = wsStatus.connectionErrors + 1;

      // Try discovery-based reconnection only if under max attempts
      if (newErrorCount < MAX_RETRY_ATTEMPTS) {
        try {
          await zeroconfDiscovery.forceRefresh();
          WebSocketService.resetState();
          await WebSocketService.connect();
          await WebSocketService.authenticateFromCookies();

          setWsStatus({
            initialized: true,
            initializing: false,
            connectionErrors: 0,
          });
        } catch (retryError) {
          console.error("Retry failed:", retryError);
          toast.error(
            "Failed to establish connection. Please check your network."
          );
          setWsStatus({
            initialized: false,
            initializing: false,
            connectionErrors: newErrorCount,
          });
        }
      } else {
        toast.error(
          "Failed to connect after multiple attempts. Please try again later."
        );
        setWsStatus({
          initialized: false,
          initializing: false,
          connectionErrors: newErrorCount,
        });
      }
    }
  }, [wsStatus.initializing, wsStatus.initialized, wsStatus.connectionErrors]);

  // Initialize WebSocket when authenticated
  useEffect(() => {
    if (
      isAuthenticated &&
      user &&
      !wsStatus.initialized &&
      !wsStatus.initializing
    ) {
      initializeWebSocket();
    }
  }, [
    isAuthenticated,
    user,
    wsStatus.initialized,
    wsStatus.initializing,
    initializeWebSocket,
  ]);

  // Cleanup on unmount or logout
  useEffect(() => {
    if (!isAuthenticated && WebSocketService.isConnected) {
      WebSocketService.disconnect();
      setWsStatus((prev) => ({ ...prev, initialized: false }));
    }
  }, [isAuthenticated]);

  // Initial auth check - runs only once
  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await api.get("/user/me");
        dispatch(setUser(response.data));
      } catch (error) {
        if (isAuthenticated) dispatch(logout());
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [dispatch, isAuthenticated]);

  // Optimized login function - avoids redundant API calls
  const login = async (username, password) => {
    try {
      const loginResponse = await api.post("/user/login", {
        username,
        password,
      });

      // If login endpoint returns user data, use it directly
      if (loginResponse.data && loginResponse.data.user) {
        dispatch(setUser(loginResponse.data.user));
      } else {
        // Fall back to fetching user data if not included in login response
        const userResponse = await api.get("/user/me");
        dispatch(setUser(userResponse.data));
      }
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
      setWsStatus((prev) => ({ ...prev, initialized: false }));

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
      if (WebSocketService.isConnected) {
        WebSocketService.disconnect();
      }
      setWsStatus((prev) => ({ ...prev, initialized: false }));
      return true;
    }
    return false;
  };

  // Simplified reconnect function
  const reconnectWebSocket = async () => {
    if (wsStatus.initializing) return;

    WebSocketService.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 500));

    setWsStatus({
      initialized: false,
      initializing: false,
      connectionErrors: 0,
    });

    // initializeWebSocket will be triggered by the useEffect
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
    wsInitialized: wsStatus.initialized,
    wsInitializing: wsStatus.initializing,
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
