import api from "../api";

export const createSupplier = async (supplierData) => {
  try {
    const response = await api.post("/supplier/create", supplierData);
    return response.data;
  } catch (error) {
    console.error("Failed to create supplier:", error);
    throw error;
  }
};

export const getAllSuppliers = async (
  skip = 0,
  limit = 100,
  companyName = null
) => {
  try {
    const response = await api.get("/supplier/all", {
      params: { skip, limit, company_name: companyName },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to get suppliers:", error);
    throw error;
  }
};

export const getSupplierById = async (supplierId) => {
  try {
    const response = await api.get(`/supplier/${supplierId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to get supplier ${supplierId}:`, error);
    throw error;
  }
};

export const updateSupplier = async (supplierId, updateData) => {
  try {
    const response = await api.put(`/suppliers/${supplierId}`, updateData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const deleteSupplier = async (supplierId) => {
  try {
    await api.delete(`/supplier/${supplierId}`);
  } catch (error) {
    throw error.response.data;
  }
};

export const toggleSupplier = async (supplierId) => {
  try {
    const response = await api.patch(`/supplier/${supplierId}/toggle`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete supplier:", error);
    throw error;
  }
};
