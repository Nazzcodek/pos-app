import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  markInvoicePaid,
} from "../../routes/Invoice";

// Async thunks for invoice operations
export const fetchInvoiceById = createAsyncThunk(
  "invoices/fetchInvoiceById",
  async (invoiceId, { rejectWithValue }) => {
    try {
      const response = await getInvoiceById(invoiceId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const removeInvoice = createAsyncThunk(
  "invoices/removeInvoice",
  async (invoiceId, { rejectWithValue }) => {
    try {
      await deleteInvoice(invoiceId);
      return invoiceId;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const markAsPaid = createAsyncThunk(
  "invoices/markAsPaid",
  async ({ invoiceId, paymentDate }, { rejectWithValue }) => {
    try {
      const response = await markInvoicePaid(invoiceId, paymentDate);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const addInvoice = createAsyncThunk(
  "invoices/addInvoice",
  async (invoiceData, { rejectWithValue }) => {
    try {
      const response = await createInvoice(invoiceData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const editInvoice = createAsyncThunk(
  "invoices/editInvoice",
  async ({ invoiceId, updateData }, { rejectWithValue }) => {
    try {
      const response = await updateInvoice(invoiceId, updateData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchInvoices = createAsyncThunk(
  "invoices/fetchInvoices",
  async ({ skip, limit, filters }, { rejectWithValue }) => {
    try {
      const response = await getAllInvoices(skip, limit, filters);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const setFilters = createAsyncThunk(
  "invoices/setFilters",
  async (filters, { rejectWithValue }) => {
    try {
      return filters;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const clearFilters = createAsyncThunk(
  "invoices/clearFilters",
  async () => {
    return {};
  }
);

// Invoice slice
const invoiceSlice = createSlice({
  name: "invoices",
  initialState: {
    invoices: [],
    currentInvoice: null,
    filters: {},
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoiceById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoiceById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentInvoice = action.payload;
      })
      .addCase(fetchInvoiceById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(removeInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = state.invoices.filter(
          (invoice) => invoice.id !== action.payload
        );
      })
      .addCase(removeInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markAsPaid.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markAsPaid.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.invoices.findIndex(
          (invoice) => invoice.id === action.payload.id
        );
        if (index !== -1) {
          state.invoices[index] = action.payload;
        }
      })
      .addCase(markAsPaid.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices.push(action.payload);
      })
      .addCase(addInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(editInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editInvoice.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.invoices.findIndex(
          (invoice) => invoice.id === action.payload.id
        );
        if (index !== -1) {
          state.invoices[index] = action.payload;
        }
      })
      .addCase(editInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = action.payload;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(setFilters.fulfilled, (state, action) => {
        state.filters = action.payload;
      })
      .addCase(clearFilters.fulfilled, (state) => {
        state.filters = {};
      });
  },
});

export default invoiceSlice.reducer;
