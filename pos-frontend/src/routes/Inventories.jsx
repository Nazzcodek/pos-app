import api from "../api";

export const rawMaterialApi = {
  // Get raw materials with optional filters
  getRawMaterials: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      // Add pagination
      if (filters.skip) params.append("skip", filters.skip);
      if (filters.limit) params.append("limit", filters.limit);

      // Add filters
      if (filters.name) params.append("name", filters.name);
      if (filters.status) params.append("status", filters.status);
      if (filters.quantity_unit)
        params.append("quantity_unit", filters.quantity_unit);
      if (filters.supplier_id)
        params.append("supplier_id", filters.supplier_id);
      if (filters.price_min) params.append("price_min", filters.price_min);
      if (filters.price_max) params.append("price_max", filters.price_max);
      if (filters.from_date) params.append("from_date", filters.from_date);
      if (filters.to_date) params.append("to_date", filters.to_date);

      const response = await api.get(
        `/inventory/raw-materials/?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching raw materials:", error);
      throw error;
    }
  },

  // Create new raw material
  createRawMaterial: async (materialData) => {
    try {
      const response = await api.post("/inventory/raw-materials", materialData);
      return response.data;
    } catch (error) {
      console.error("Error creating raw material:", error);
      throw error;
    }
  },

  // Update raw material
  updateRawMaterial: async (id, materialData) => {
    try {
      const response = await api.put(
        `/inventory/raw-materials/${id}`,
        materialData
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating raw material with ID ${id}:`, error);
      throw error;
    }
  },
};

export const equipmentApi = {
  // Get equipments with optional filters
  getEquipments: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      // Add pagination
      if (filters.skip) params.append("skip", filters.skip);
      if (filters.limit) params.append("limit", filters.limit);

      // Add filters
      if (filters.name) params.append("name", filters.name);
      if (filters.status) params.append("status", filters.status);
      if (filters.supplier_id)
        params.append("supplier_id", filters.supplier_id);
      if (filters.price_min) params.append("price_min", filters.price_min);
      if (filters.price_max) params.append("price_max", filters.price_max);
      if (filters.from_date) params.append("from_date", filters.from_date);
      if (filters.to_date) params.append("to_date", filters.to_date);

      const response = await api.get(
        `/inventory/equipments/?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching equipments:", error);
      throw error;
    }
  },

  // Create new equipment
  createEquipment: async (equipmentData) => {
    try {
      const response = await api.post("/inventory/equipment", equipmentData);
      return response.data;
    } catch (error) {
      console.error("Error creating equipment:", error);
      throw error;
    }
  },

  // Update equipment
  updateEquipment: async (id, equipmentData) => {
    try {
      const response = await api.put(
        `/inventory/equipments/${id}`,
        equipmentData
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating equipment with ID ${id}:`, error);
      throw error;
    }
  },
};

export const inventoryApi = {
  // Advanced search for inventory items
  advancedSearch: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      // Add filters
      if (filters.search_term)
        params.append("search_term", filters.search_term);
      if (filters.inventory_type)
        params.append("inventory_type", filters.inventory_type);
      if (filters.status_list)
        filters.status_list.forEach((status) =>
          params.append("status_list", status)
        );
      if (filters.price_min) params.append("price_min", filters.price_min);
      if (filters.price_max) params.append("price_max", filters.price_max);
      if (filters.quantity_min)
        params.append("quantity_min", filters.quantity_min);
      if (filters.quantity_max)
        params.append("quantity_max", filters.quantity_max);
      if (filters.supplier_ids)
        filters.supplier_ids.forEach((id) => params.append("supplier_ids", id));
      if (filters.from_date) params.append("from_date", filters.from_date);
      if (filters.to_date) params.append("to_date", filters.to_date);
      if (filters.sort_by) params.append("sort_by", filters.sort_by);
      if (filters.sort_order) params.append("sort_order", filters.sort_order);
      if (filters.skip) params.append("skip", filters.skip);
      if (filters.limit) params.append("limit", filters.limit);

      const response = await api.get(`/inventory/search/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error("Error performing advanced search:", error);
      throw error;
    }
  },

  // Generate inventory report
  generateReport: async (reportType, startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const response = await api.get(
        `/inventory/reports/${reportType}?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error generating inventory report:", error);
      throw error;
    }
  },

  // Create a new transaction
  createTransaction: async (transactionData) => {
    try {
      const response = await api.post(
        "/inventory/transactions",
        transactionData
      );
      return response.data;
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  },

  // Get transactions with optional filters
  getTransactions: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      // Add filters
      if (filters.inventory_id)
        params.append("inventory_id", filters.inventory_id);
      if (filters.transaction_type)
        params.append("transaction_type", filters.transaction_type);
      if (filters.inventory_type)
        params.append("inventory_type", filters.inventory_type);
      if (filters.from_date) params.append("from_date", filters.from_date);
      if (filters.to_date) params.append("to_date", filters.to_date);

      const response = await api.get(
        `/inventory/transactions?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  },

  // Delete inventory item
  deleteInventory: async (id) => {
    try {
      const response = await api.delete(`/inventory/${id}`);
      return response.data;
    } catch (error) {
      console.error("Failed to delete inventory:", error);
      throw new Error(
        error.response?.data?.detail || "Failed to delete the inventory item"
      );
    }
  },

  // Toggle inventory status
  toggleInventoryStatus: async (id) => {
    try {
      const response = await api.patch(`/inventory/${id}/toggle`);
      return response.data;
    } catch (error) {
      console.error("Failed to toggle inventory status:", error);
      throw error;
    }
  },

  // Update an existing transaction
  updateTransaction: async (transactionId, transactionData) => {
    try {
      const response = await api.put(
        `/inventory/transactions/${transactionId}`,
        transactionData
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error updating transaction with ID ${transactionId}:`,
        error
      );
      throw error;
    }
  },

  // Delete a transaction
  deleteTransaction: async (transactionId) => {
    try {
      const response = await api.delete(
        `/inventory/transactions/${transactionId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error deleting transaction with ID ${transactionId}:`,
        error
      );
      throw error;
    }
  },

  // fetch inventory transaction
  getInventoryTransactions: async (id) => {
    try {
      const response = await api.get(`/inventory/transactions/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting inventory transaction`, error);
      throw error;
    }
  },

  // Get Department list
  getDepartments: async () => {
    try {
      const response = await api.get("/inventory/departments");
      return response.data;
    } catch (error) {
      console.error("Error fetching departments:", error);
      throw error;
    }
  },

  // create Department
  createDepartment: async (departmentData) => {
    try {
      const response = await api.post("/inventory/departments", departmentData);
      return response.data;
    } catch (error) {
      console.error("Error creating department:", error);
      throw error;
    }
  },

  // update department
  updateDepartment: async (id, departmentData) => {
    try {
      const response = await api.put(
        `/inventory/departments/${id}`,
        departmentData
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating department with ID ${id}:`, error);
      throw error;
    }
  },

  // delete department
  deleteDepartment: async (id) => {
    try {
      const response = await api.delete(`/inventory/departments/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting department with ID ${id}:`, error);
      throw error;
    }
  },
};
