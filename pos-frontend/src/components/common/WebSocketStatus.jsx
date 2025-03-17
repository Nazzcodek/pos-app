import React from "react";
import { useAuth } from "../../contexts/AuthContext";

const WebSocketStatus = () => {
  const {
    wsInitialized,
    wsInitializing,
    reconnectWebSocket,
    discoveredServices,
    selectService,
  } = useAuth();

  return (
    <div className="bg-gray-100 p-4 rounded mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium">Connection Status</h3>
        <div className="flex items-center">
          <span
            className={`h-3 w-3 rounded-full mr-2 ${
              wsInitialized
                ? "bg-green-500"
                : wsInitializing
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
          ></span>
          <span>
            {wsInitialized
              ? "Connected"
              : wsInitializing
              ? "Connecting..."
              : "Disconnected"}
          </span>
        </div>
      </div>

      {!wsInitialized && !wsInitializing && (
        <button
          onClick={reconnectWebSocket}
          className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
        >
          Reconnect
        </button>
      )}

      {discoveredServices.length > 0 && (
        <div className="mt-3">
          <h4 className="text-sm font-medium mb-2">Available Services:</h4>
          <div className="max-h-32 overflow-y-auto">
            {discoveredServices.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between bg-white p-2 rounded mb-1"
              >
                <span className="text-sm">
                  {service.name || service.id} ({service.ip}:{service.port})
                </span>
                <button
                  onClick={() => selectService(service.id)}
                  className="text-xs bg-gray-200 hover:bg-gray-300 py-1 px-2 rounded"
                >
                  Connect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebSocketStatus;
