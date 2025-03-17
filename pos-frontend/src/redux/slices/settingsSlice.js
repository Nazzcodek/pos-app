import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api";

export const fetchSettings = createAsyncThunk(
  "settings/fetchSettings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`/settings/info`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response.data.detail || "Failed to load settings"
      );
    }
  }
);

export const updateSettings = createAsyncThunk(
  "settings/updateSettings",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post(`/settings/update`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      // Enhanced error logging
      console.error("Error response:", error.response?.data);
      return rejectWithValue(
        error.response?.data?.detail || "Failed to update settings"
      );
    }
  }
);

const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    settings: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default settingsSlice.reducer;
