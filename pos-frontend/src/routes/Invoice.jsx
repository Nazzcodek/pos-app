import api from "../api";

export const createInvoice = async (invoiceData) => {
  try {
    const response = await api.post("/invoice/create", invoiceData);
    return response.data;
  } catch (error) {
    console.error("Failed to create invoice:", error);
    throw error;
  }
};

export const getAllInvoices = async (skip = 0, limit = 100, filters = {}) => {
  try {
    const { supplier_id, from_date, to_date, is_paid } = filters;

    const response = await api.get("/invoice/all", {
      params: {
        skip,
        limit,
        supplier_id,
        from_date,
        to_date,
        is_paid,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to get invoices:", error);
    throw error;
  }
};

export const getInvoiceById = async (invoiceId) => {
  try {
    const response = await api.get(`/invoice/${invoiceId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to get invoice ${invoiceId}:`, error);
    throw error;
  }
};

export const updateInvoice = async (invoiceId, updateData) => {
  try {
    const response = await api.put(`/invoice/${invoiceId}`, updateData);
    return response.data;
  } catch (error) {
    console.error(`Failed to update invoice ${invoiceId}:`, error);
    throw error;
  }
};

export const deleteInvoice = async (invoiceId) => {
  try {
    await api.delete(`/invoice/${invoiceId}`);
    return true;
  } catch (error) {
    console.error(`Failed to delete invoice ${invoiceId}:`, error);
    throw error;
  }
};

export const toggleInvoice = async (invoiceId) => {
  try {
    const response = await api.patch(`/invoice/${invoiceId}/toggle`);
    return response.data;
  } catch (error) {
    console.error(`Failed to toggle invoice ${invoiceId}:`, error);
    throw error;
  }
};

export const markInvoicePaid = async (invoiceId, paymentDate = null) => {
  try {
    const response = await api.patch(`/invoice/${invoiceId}/mark-paid`, {
      payment_date: paymentDate,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to mark invoice ${invoiceId} as paid:`, error);
    throw error;
  }
};

export const getInvoicesForInventory = async (inventoryId) => {
  try {
    const response = await api.get(`/invoice/for-inventory/${inventoryId}`);
    return response.data;
  } catch (error) {
    console.error(
      `Failed to get invoices for inventory ${inventoryId}:`,
      error
    );
    throw error;
  }
};
