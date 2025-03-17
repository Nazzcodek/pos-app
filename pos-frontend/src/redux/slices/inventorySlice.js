import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  inventoryApi,
  rawMaterialApi,
  equipmentApi,
} from "../../routes/Inventories";

// Async thunks for raw materials
export const fetchRawMaterials = createAsyncThunk(
  "inventory/fetchRawMaterials",
  async (filters, { rejectWithValue }) => {
    try {
      const response = await rawMaterialApi.getRawMaterials(filters);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch raw materials"
      );
    }
  }
);

export const createRawMaterial = createAsyncThunk(
  "inventory/createRawMaterial",
  async (materialData, { rejectWithValue }) => {
    try {
      const response = await rawMaterialApi.createRawMaterial(materialData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to create raw material"
      );
    }
  }
);

export const updateRawMaterial = createAsyncThunk(
  "inventory/updateRawMaterial",
  async ({ id, materialData }, { rejectWithValue }) => {
    try {
      const response = await rawMaterialApi.updateRawMaterial(id, materialData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update raw material"
      );
    }
  }
);

export const createMultipleRawMaterials = createAsyncThunk(
  "inventory/createMultipleRawMaterials",
  async (materialsData, { rejectWithValue }) => {
    try {
      const results = [];
      for (const material of materialsData) {
        const response = await rawMaterialApi.createRawMaterial(material);
        results.push(response);
      }
      return results;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to create raw materials"
      );
    }
  }
);

// Async thunks for equipment
export const fetchEquipments = createAsyncThunk(
  "inventory/fetchEquipment",
  async (filters, { rejectWithValue }) => {
    try {
      const response = await equipmentApi.getEquipments(filters);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch equipment"
      );
    }
  }
);

export const createEquipment = createAsyncThunk(
  "inventory/createEquipment",
  async (equipmentData, { rejectWithValue }) => {
    try {
      const response = await equipmentApi.createEquipment(equipmentData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to create equipment"
      );
    }
  }
);

export const updateEquipment = createAsyncThunk(
  "inventory/updateEquipment",
  async ({ id, equipmentData }, { rejectWithValue }) => {
    try {
      const response = await equipmentApi.updateEquipment(id, equipmentData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update equipment"
      );
    }
  }
);

export const createMultipleEquipments = createAsyncThunk(
  "inventory/createMultipleEquipment",
  async (equipmentData, { rejectWithValue }) => {
    try {
      const results = [];
      for (const equipment of equipmentData) {
        const response = await equipmentApi.createEquipment(equipment);
        results.push(response);
      }
      return results;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to create equipment"
      );
    }
  }
);

// Inventory-level operations
export const inventoryDelete = createAsyncThunk(
  "inventory/deleteInventory",
  async ({ id }, { rejectWithValue }) => {
    try {
      await inventoryApi.deleteInventory(id);
      return id;
    } catch (error) {
      return rejectWithValue(error, "Failed to delete inventory");
    }
  }
);

export const toggleInventoryStatusThunk = createAsyncThunk(
  "inventory/toggleStatus",
  async (id, { rejectWithValue }) => {
    try {
      const response = await inventoryApi.toggleInventoryStatus(id);
      return { id, response };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to toggle inventory status"
      );
    }
  }
);

// Advanced search
export const advancedInventorySearch = createAsyncThunk(
  "inventory/advancedSearch",
  async (filters, { rejectWithValue }) => {
    try {
      const response = await inventoryApi.advancedSearch(filters);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to perform advanced search"
      );
    }
  }
);

// Transaction-related async thunks
export const createTransaction = createAsyncThunk(
  "inventory/createTransaction",
  async (transactionData, { rejectWithValue }) => {
    try {
      const response = await inventoryApi.createTransaction(transactionData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to create transaction"
      );
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  "inventory/fetchTransactions",
  async (filters, { rejectWithValue }) => {
    try {
      const response = await inventoryApi.getTransactions(filters);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch transactions"
      );
    }
  }
);

export const updateTransaction = createAsyncThunk(
  "inventory/updateTransaction",
  async ({ transactionId, transactionData }, { rejectWithValue }) => {
    try {
      const response = await inventoryApi.updateTransaction(
        transactionId,
        transactionData
      );
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update transaction"
      );
    }
  }
);

export const deleteTransaction = createAsyncThunk(
  "inventory/deleteTransaction",
  async (transactionId, { rejectWithValue }) => {
    try {
      await inventoryApi.deleteTransaction(transactionId);
      return transactionId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to delete transaction"
      );
    }
  }
);

export const fetchInventoryTransactions = createAsyncThunk(
  "inventory/getInventoryTransactions",
  async (id, { rejectWithValue }) => {
    try {
      const response = await inventoryApi.getInventoryTransactions(id);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch inventory transactions"
      );
    }
  }
);

// Department-related async thunks
export const fetchDepartments = createAsyncThunk(
  "inventory/getDepartments",
  async (_, { rejectWithValue }) => {
    try {
      const response = await inventoryApi.getDepartments();
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch departments"
      );
    }
  }
);

export const createDepartment = createAsyncThunk(
  "inventory/createDepartment",
  async (departmentData, { rejectWithValue }) => {
    try {
      const response = await inventoryApi.createDepartment(departmentData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to create department"
      );
    }
  }
);

export const updateDepartment = createAsyncThunk(
  "inventory/updateDepartment",
  async ({ id, departmentData }, { rejectWithValue }) => {
    try {
      const response = await inventoryApi.updateDepartment(id, departmentData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update department"
      );
    }
  }
);

export const deleteDepartment = createAsyncThunk(
  "inventory/deleteDepartment",
  async (id, { rejectWithValue }) => {
    try {
      await inventoryApi.deleteDepartment(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to delete department"
      );
    }
  }
);

// Initial state
const initialState = {
  rawMaterials: [],
  equipment: [],
  searchResults: [],
  transactions: [],
  departments: [],
  selected: null,
  loading: false,
  transactionsLoading: false,
  error: null,
  filters: {
    skip: 0,
    limit: 100,
  },
};

// Slice
const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelected: (state) => {
      state.selected = null;
    },
    resetFilters: (state) => {
      state.filters = {
        skip: 0,
        limit: 100,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Raw Materials
      .addCase(fetchRawMaterials.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRawMaterials.fulfilled, (state, action) => {
        state.loading = false;
        state.rawMaterials = normalizeResponse(action.payload);
      })
      .addCase(fetchRawMaterials.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Raw Material
      .addCase(createRawMaterial.fulfilled, (state, action) => {
        state.loading = false;
        state.rawMaterials.push(action.payload);
      })

      // Update Raw Material
      .addCase(updateRawMaterial.fulfilled, (state, action) => {
        const index = state.rawMaterials.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.rawMaterials[index] = action.payload;
        }
      })

      // Create Multiple Raw Materials
      .addCase(createMultipleRawMaterials.fulfilled, (state, action) => {
        state.loading = false;
        state.rawMaterials = [...state.rawMaterials, ...action.payload];
      })

      // Fetch Equipment
      .addCase(fetchEquipments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEquipments.fulfilled, (state, action) => {
        state.loading = false;
        state.equipment = normalizeResponse(action.payload);
      })
      .addCase(fetchEquipments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Equipment
      .addCase(createEquipment.fulfilled, (state, action) => {
        state.loading = false;
        state.equipment.push(action.payload);
      })

      // Update Equipment
      .addCase(updateEquipment.fulfilled, (state, action) => {
        const index = state.equipment.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.equipment[index] = action.payload;
        }
      })

      // Create Multiple Equipment
      .addCase(createMultipleEquipments.fulfilled, (state, action) => {
        state.loading = false;
        state.equipment = [...state.equipment, ...action.payload];
      })

      // Delete Inventory
      .addCase(inventoryDelete.fulfilled, (state, action) => {
        const id = action.payload;
        state.rawMaterials = state.rawMaterials.filter(
          (item) => item.id !== id
        );
        state.equipment = state.equipment.filter((item) => item.id !== id);
      })

      // Toggle Inventory Status
      .addCase(toggleInventoryStatusThunk.fulfilled, (state, action) => {
        const { id } = action.payload;

        // Update raw materials
        const rawIndex = state.rawMaterials.findIndex((item) => item.id === id);
        if (rawIndex !== -1) {
          state.rawMaterials[rawIndex].is_enabled =
            !state.rawMaterials[rawIndex].is_enabled;
        }

        // Update equipment
        const equipIndex = state.equipment.findIndex((item) => item.id === id);
        if (equipIndex !== -1) {
          state.equipment[equipIndex].is_enabled =
            !state.equipment[equipIndex].is_enabled;
        }
      })

      // Advanced Search
      .addCase(advancedInventorySearch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(advancedInventorySearch.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = normalizeResponse(action.payload);
      })
      .addCase(advancedInventorySearch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Transaction
      .addCase(createTransaction.pending, (state) => {
        state.loading = true;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions.push(action.payload);
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = normalizeResponse(action.payload);
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Transaction
      .addCase(updateTransaction.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.transactions.findIndex(
          (transaction) => transaction.id === action.payload.id
        );
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
      })
      .addCase(updateTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Transaction
      .addCase(deleteTransaction.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = state.transactions.filter(
          (transaction) => transaction.id !== action.payload
        );
      })
      .addCase(deleteTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetch inventory transactions
      .addCase(fetchInventoryTransactions.pending, (state) => {
        state.transactionsLoading = true;
        state.error = null;
      })
      .addCase(fetchInventoryTransactions.fulfilled, (state, action) => {
        state.transactionsLoading = false;
        state.transactions = normalizeResponse(action.payload);
      })
      .addCase(fetchInventoryTransactions.rejected, (state, action) => {
        state.transactionsLoading = false;
        state.error = action.payload;
      })

      // fetch departments
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = normalizeResponse(action.payload);
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // create department
      .addCase(createDepartment.pending, (state) => {
        state.loading = true;
      })
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions.push(action.payload);
      })
      .addCase(createDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // update department
      .addCase(updateDepartment.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.transactions.findIndex(
          (transaction) => transaction.id === action.payload.id
        );
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
      })
      .addCase(updateDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Utility function to normalize response
function normalizeResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    return (
      payload.items || payload.results || payload.content || payload.data || []
    );
  }
  return [];
}

export const { setFilters, clearSelected, resetFilters } =
  inventorySlice.actions;

export default inventorySlice.reducer;
