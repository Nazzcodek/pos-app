import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  toggleSupplier,
} from "../../routes/Suppliers";

// Helper function to extract meaningful error information
const extractErrorMessage = (error) => {
  if (error.response && error.response.data) {
    if (error.response.data.detail) {
      if (Array.isArray(error.response.data.detail)) {
        return error.response.data.detail
          .map((err) => `${err.loc.join(".")} : ${err.msg}`)
          .join("; ");
      }
      return JSON.stringify(error.response.data.detail);
    }
    return error.response.statusText;
  }
  return error.message || "An unknown error occurred";
};

// Async Thunks
export const fetchSuppliers = createAsyncThunk(
  "suppliers/fetchSuppliers",
  async (
    { skip = 0, limit = 100, companyName = null },
    { rejectWithValue }
  ) => {
    try {
      const response = await getAllSuppliers(skip, limit, companyName);
      return response;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const fetchSupplierById = createAsyncThunk(
  "suppliers/fetchSupplierById",
  async (supplierId, { rejectWithValue }) => {
    try {
      const response = await getSupplierById(supplierId);
      return response;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const addSupplier = createAsyncThunk(
  "suppliers/addSupplier",
  async (supplierData, { rejectWithValue }) => {
    try {
      const processedData = {
        ...supplierData,
        items_supplied: supplierData.items_supplied
          ? supplierData.items_supplied.map((item) =>
              typeof item === "string" ? { name: item } : item
            )
          : [],
      };
      const response = await createSupplier(processedData);
      return response;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const editSupplier = createAsyncThunk(
  "suppliers/editSupplier",
  async ({ supplierId, updateData }, { rejectWithValue }) => {
    try {
      const processedData = {
        ...updateData,
        items_supplied: updateData.items_supplied
          ? updateData.items_supplied.map((item) =>
              typeof item === "string" ? { name: item } : item
            )
          : [],
      };
      const response = await updateSupplier(supplierId, processedData);
      return response;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const removeSupplier = createAsyncThunk(
  "suppliers/removeSupplier",
  async (supplierId, { rejectWithValue }) => {
    try {
      await deleteSupplier(supplierId);
      return supplierId;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const toggleSupplierStatus = createAsyncThunk(
  "suppliers/toggleSupplierStatus",
  async (supplierId, { rejectWithValue }) => {
    try {
      const response = await toggleSupplier(supplierId);
      return response;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

// Initial State
const initialState = {
  suppliers: [],
  selectedSupplier: null,
  loading: false,
  error: null,
};

// Slice
const supplierSlice = createSlice({
  name: "suppliers",
  initialState,
  reducers: {
    clearSelectedSupplier: (state) => {
      state.selectedSupplier = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const handlePendingState = (state) => {
      state.loading = true;
      state.error = null;
    };

    const handleRejectedState = (state, action) => {
      state.loading = false;
      state.error = action.payload || "An unknown error occurred";
    };

    builder
      .addCase(fetchSuppliers.pending, handlePendingState)
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers = action.payload;
      })
      .addCase(fetchSuppliers.rejected, handleRejectedState)

      .addCase(fetchSupplierById.pending, handlePendingState)
      .addCase(fetchSupplierById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedSupplier = action.payload;
      })
      .addCase(fetchSupplierById.rejected, handleRejectedState)

      .addCase(addSupplier.pending, handlePendingState)
      .addCase(addSupplier.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers = [...state.suppliers, action.payload];
      })
      .addCase(addSupplier.rejected, handleRejectedState)

      .addCase(editSupplier.pending, handlePendingState)
      .addCase(editSupplier.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers = state.suppliers.map((supplier) =>
          supplier.id === action.payload.id ? action.payload : supplier
        );
      })
      .addCase(editSupplier.rejected, handleRejectedState)

      .addCase(removeSupplier.pending, handlePendingState)
      .addCase(removeSupplier.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers = state.suppliers.filter(
          (supplier) => supplier.id !== action.payload
        );
      })
      .addCase(removeSupplier.rejected, handleRejectedState)

      .addCase(toggleSupplierStatus.pending, handlePendingState)
      .addCase(toggleSupplierStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers = state.suppliers.map((supplier) =>
          supplier.id === action.payload.id ? action.payload : supplier
        );
      })
      .addCase(toggleSupplierStatus.rejected, handleRejectedState);
  },
});

// Selectors
export const selectFilteredSuppliers = createSelector(
  [
    (state) => state.suppliers?.suppliers || [],
    (state, searchTerm) => searchTerm || "",
  ],
  (suppliers, searchTerm) => {
    if (!searchTerm) return suppliers;

    const normalizedSearchTerm = searchTerm.toLowerCase();

    return suppliers.filter((supplier) => {
      const companyNameMatch = supplier.company_name
        ?.toLowerCase()
        .includes(normalizedSearchTerm);

      let itemsSuppliedMatch = false;
      try {
        const parsedItems = supplier.items_supplied
          ? JSON.parse(supplier.items_supplied)
          : [];

        itemsSuppliedMatch = parsedItems.some((item) =>
          item.toLowerCase().includes(normalizedSearchTerm)
        );
      } catch {
        itemsSuppliedMatch = false;
      }

      return companyNameMatch || itemsSuppliedMatch;
    });
  }
);

// Export Actions
export const { clearSelectedSupplier, clearError } = supplierSlice.actions;

// Export Reducer
export default supplierSlice.reducer;
