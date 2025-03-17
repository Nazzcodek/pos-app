import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAllCategory,
  createCategory as newCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
} from "../../routes/Categories";

// Async thunks for category actions
export const fetchCategories = createAsyncThunk(
  "categories/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAllCategory();
      return response;
    } catch (error) {
      // Handle 404 "No categories found" as an empty array instead of an error
      if (
        error.response &&
        error.response.status === 404 &&
        error.response.data.detail === "No categories found"
      ) {
        return [];
      }
      return rejectWithValue(
        error.response.data.detail || "Failed to fetch categories"
      );
    }
  }
);

export const createCategory = createAsyncThunk(
  "categories/createCategory",
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await newCategory(categoryData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response.data.detail || "Failed to create category"
      );
    }
  }
);

export const editCategory = createAsyncThunk(
  "categories/updateCategory",
  async ({ id, categoryData }, { rejectWithValue }) => {
    try {
      const response = await updateCategory(id, categoryData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response.data.detail || "Failed to update category"
      );
    }
  }
);

export const removeCategory = createAsyncThunk(
  "categories/deleteCategory",
  async (id, { rejectWithValue }) => {
    try {
      await deleteCategory(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response.data.detail || "Failed to delete category"
      );
    }
  }
);

export const toggleCategoryEnabled = createAsyncThunk(
  "categories/toggleCategoryEnabled",
  async (id, { rejectWithValue }) => {
    try {
      const response = await toggleCategoryStatus(id);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response.data.detail || "Failed to toggle category status"
      );
    }
  }
);

// Initial state
const initialState = {
  categories: [],
  loading: false,
  error: null,
};

// Category slice
const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
        state.error = null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Category
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories.push(action.payload);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Category
      .addCase(editCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editCategory.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.categories.findIndex(
          (category) => category.id === action.payload.id
        );
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
      })
      .addCase(editCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Category
      .addCase(removeCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = state.categories.filter(
          (category) => category.id !== action.payload
        );
      })
      .addCase(removeCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Toggle Category Enabled
      .addCase(toggleCategoryEnabled.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleCategoryEnabled.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.categories.findIndex(
          (category) => category.id === action.payload.id
        );
        if (index !== -1) {
          state.categories[index].is_enabled = action.payload.is_enabled;
        }
      })
      .addCase(toggleCategoryEnabled.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default categoriesSlice.reducer;
