import api from "../api";
import { initDB } from "../services/offlineSync";

// check server status
export const checkServerHealth = async () => {
  try {
    const response = await api.get("/health");
    if (response.status === 200) {
      return "online";
    }
  } catch (error) {
    return "offline";
  }
};

export const connectAuthenticatedWebSocket = () => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    console.error("No authentication token found");
    return null;
  }

  const socket = new WebSocket(`ws://${api}/ws`);

  socket.onopen = () => {
    // Send authentication message as first message
    socket.send(
      JSON.stringify({
        type: "authentication",
      })
    );
  };

  return socket;
};

export const syncOfflineData = async () => {
  const db = await initDB();
  const syncItems = await db.getAll("syncQueue");

  for (const item of syncItems) {
    try {
      // Send to server via API call
      const response = await fetch("http://server-ip:8000/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });

      if (response.ok) {
        // Remove from sync queue after successful sync
        await db.delete("syncQueue", item.id);
      }
    } catch (error) {
      console.error("Sync error:", error);
    }
  }
};
