import api from "../api";

// Create Sale
export const createSale = async (saleData) => {
  try {
    const response = await api.post("/sales/create", saleData);
    return response.data;
  } catch (error) {
    console.error("Failed to create sale:", error);
    throw error;
  }
};

// Get Sale
export const getSaleById = async (saleId) => {
  try {
    const response = await api.get(`/sales/${saleId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to get sale:", error);
    throw error;
  }
};

// Update Sale
export const updateSale = async (saleId, saleData) => {
  try {
    const response = await api.put(`/sales/update/${saleId}`, saleData);
    return response.data;
  } catch (error) {
    console.error("Failed to update sale:", error);
    throw error;
  }
};

// Delete Sale
export const deleteSale = async (saleId) => {
  try {
    const response = await api.delete(`/sales/delete/${saleId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete sale:", error);
    throw error;
  }
};

// Get Current Session Report
export const getCurrentSessionReport = async (reportType = "sales") => {
  try {
    const response = await api.get("/sales/report/current-session", {
      params: { report_type: reportType },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to get current session report:", error);
    throw error;
  }
};

export const getUserSessionReport = async (reportType = "sales") => {
  try {
    const response = await api.get("/sales/report/user-session", {
      params: { report_type: reportType },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to get user session report:", error);
    throw error;
  }
};

// Get Receipt
export const getReceipt = async (saleId) => {
  try {
    const response = await api.get(`/sales/receipt/${saleId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to get receipt:", error);
    throw error;
  }
};

export const getCurrentSession = async () => {
  try {
    const response = await api.get("/session/current/");
    return response.data;
  } catch (error) {
    console.error("Failed to get current session:", error);
    throw error;
  }
};
