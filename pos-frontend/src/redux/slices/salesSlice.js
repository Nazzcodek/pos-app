import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getDailySales,
  getDateRangeSales,
  exportReportApi,
} from "../../routes/Reports";

import {
  deleteSale,
  updateSale as updateSaleApi,
  getSaleById,
} from "../../routes/POSSales";

// Async thunks for fetching data
export const fetchSalesReport = createAsyncThunk(
  "sales/fetchSalesReport",
  async (
    {
      reportType,
      groupBy,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      receiptNumber,
    },
    { rejectWithValue }
  ) => {
    try {
      // Ensure we're sending proper date format - backend will handle the time component
      const formattedStartDate = startDate;
      const formattedEndDate = endDate;

      const data = await getDateRangeSales({
        reportType,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        ...(minAmount !== null && { minAmount }),
        ...(maxAmount !== null && { maxAmount }),
        ...(receiptNumber && { receiptNumber }),
      });
      return data || { rows: [], summary: {} }; // Ensure default structure
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch sales report"
      );
    }
  }
);

export const fetchDailyReport = createAsyncThunk(
  "sales/fetchDailyReport",
  async (date, { rejectWithValue }) => {
    try {
      const response = await getDailySales(date);
      return response.data || { rows: [], summary: {} }; // Ensure default structure
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch sales report"
      );
    }
  }
);

export const exportReport = createAsyncThunk(
  "sales/exportReport",
  async (params, { rejectWithValue }) => {
    try {
      const response = await exportReportApi(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || error.message || "Export failed"
      );
    }
  }
);

export const fetchSaleDetails = createAsyncThunk(
  "sales/fetchSaleDetails",
  async (saleId, { rejectWithValue }) => {
    try {
      const response = await getSaleById(saleId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateSale = createAsyncThunk(
  "sales/updateSale",
  async ({ saleId, saleData }, { rejectWithValue }) => {
    try {
      const response = await updateSaleApi(saleId, saleData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteReportSale = createAsyncThunk(
  "sales/deleteSale",
  async (saleId, { rejectWithValue }) => {
    try {
      await deleteSale(saleId);
      return saleId;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to delete sale");
    }
  }
);

const initialState = {
  reportData: null,
  rows: [], // Initialize as empty array
  summary: {},
  loading: false,
  error: null,
  exportLoading: false,
  exportError: null,
  filters: {
    reportType: "sales", // 'sales' or 'items'
    groupBy: ["product"], // Allow multiple grouping options
    startDate: new Date().toISOString().split("T")[0], // Today's date
    endDate: new Date().toISOString().split("T")[0], // Today's date
    minAmount: null,
    maxAmount: null,
    receiptNumber: "",
  },
  // state for fetching sale details
  currentSale: {
    data: null,
    loading: false,
    error: null,
  },
  // state for updating sale
  updateStatus: {
    loading: false,
    success: false,
    error: null,
  },

  visibleColumns: {
    sales: ["receipt_number", "date_time", "username", "total"],
    items: [
      "date_time",
      "product",
      "category",
      "quantity",
      "unit_price",
      "username",
      "total",
    ],
  },
};

const salesSlice = createSlice({
  name: "sales",
  initialState,
  reducers: {
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    toggleColumn: (state, action) => {
      const { reportType, column } = action.payload;
      const columns = state.visibleColumns[reportType];

      if (columns.includes(column)) {
        state.visibleColumns[reportType] = columns.filter(
          (col) => col !== column
        );
      } else {
        state.visibleColumns[reportType] = [...columns, column];
      }
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    resetUpdateStatus: (state) => {
      state.updateStatus = {
        loading: false,
        success: false,
        error: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchSalesReport
      .addCase(fetchSalesReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesReport.fulfilled, (state, action) => {
        state.loading = false;
        state.reportData = action.payload || {};
        // Safely handle potentially undefined data
        state.rows = action.payload?.rows || [];
        state.summary = action.payload?.summary || {};
      })
      .addCase(fetchSalesReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch sales report";
        // Reset data on error to avoid stale data
        state.rows = [];
        state.summary = {};
      })

      // fetchDailyReport
      .addCase(fetchDailyReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDailyReport.fulfilled, (state, action) => {
        state.loading = false;
        state.reportData = action.payload || {};
        // Safely handle potentially undefined data
        state.rows = action.payload?.rows || [];
        state.summary = action.payload?.summary || {};
      })
      .addCase(fetchDailyReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch daily report";
        // Reset data on error to avoid stale data
        state.rows = [];
        state.summary = {};
      })
      // fetch details of a sale
      .addCase(fetchSaleDetails.pending, (state) => {
        state.currentSale.loading = true;
        state.currentSale.error = null;
      })
      .addCase(fetchSaleDetails.fulfilled, (state, action) => {
        state.currentSale.loading = false;
        state.currentSale.data = action.payload;
      })
      .addCase(fetchSaleDetails.rejected, (state, action) => {
        state.currentSale.loading = false;
        state.currentSale.error =
          action.payload || "Failed to fetch sale details";
      })
      // update sale
      .addCase(updateSale.pending, (state) => {
        state.updateStatus.loading = true;
        state.updateStatus.success = false;
        state.updateStatus.error = null;
      })
      .addCase(updateSale.fulfilled, (state, action) => {
        state.updateStatus.loading = false;
        state.updateStatus.success = true;

        // Update the sale in the sales report data if it exists
        if (state.salesReports.data.length > 0) {
          const index = state.salesReports.data.findIndex(
            (sale) => sale.sale_id === action.payload.id
          );
          if (index !== -1) {
            state.salesReports.data[index] = {
              ...state.salesReports.data[index],
              total: action.payload.total_amount,
              // Update other fields as needed
            };
          }
        }
      })
      .addCase(updateSale.rejected, (state, action) => {
        state.updateStatus.loading = false;
        state.updateStatus.error = action.payload || "Failed to update sale";
      })

      // exportReport
      .addCase(exportReport.pending, (state) => {
        state.exportLoading = true;
        state.exportError = null;
      })
      .addCase(exportReport.fulfilled, (state) => {
        state.exportLoading = false;
      })
      .addCase(exportReport.rejected, (state, action) => {
        state.exportLoading = false;
        state.exportError = action.payload || "Failed to export report";
      })

      // deleteSale
      .addCase(deleteReportSale.fulfilled, (state, action) => {
        // Handle safely if rows is undefined
        if (Array.isArray(state.rows)) {
          state.rows = state.rows.filter(
            (row) => row.sale_id !== action.payload
          );
        }
      });
  },
});

export const { updateFilters, toggleColumn, resetFilters, resetUpdateStatus } =
  salesSlice.actions;
export default salesSlice.reducer;
