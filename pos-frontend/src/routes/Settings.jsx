import api from "../api";

export const getSettings = async () => {
  try {
    const response = await api.get("/settings/info");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    throw error;
  }
};

export const updateSettings = async (formData) => {
  try {
    const response = await api.post("/settings/update", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to update settings:", error);
    throw error;
  }
};
