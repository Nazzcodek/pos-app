import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAllProducts,
  createProduct as newProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
} from "../../routes/Products";

// Async thunks for product actions
export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAllProducts();
      return response;
    } catch (error) {
      // Handle 404 "No products found" as an empty array instead of an error
      if (
        error.response &&
        error.response.status === 404 &&
        error.response.data.detail === "No products found"
      ) {
        return [];
      }
      return rejectWithValue(
        error.response.data.detail || "Failed to fetch products"
      );
    }
  }
);

export const createProduct = createAsyncThunk(
  "products/createProduct",
  async (productData, { rejectWithValue }) => {
    try {
      const response = await newProduct(productData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response.data.detail || "Failed to create product"
      );
    }
  }
);

export const editProduct = createAsyncThunk(
  "products/updateProduct",
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      const response = await updateProduct(id, productData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response.data.detail || "Failed to update product"
      );
    }
  }
);

export const removeProduct = createAsyncThunk(
  "products/deleteProduct",
  async (id, { rejectWithValue }) => {
    try {
      await deleteProduct(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response.data.detail || "Failed to delete product"
      );
    }
  }
);

export const toggleProductEnabled = createAsyncThunk(
  "products/toggleProductEnabled",
  async (id, { rejectWithValue }) => {
    try {
      const response = await toggleProductStatus(id);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response.data.detail || "Failed to toggle product status"
      );
    }
  }
);

// Initial state
const initialState = {
  products: [],
  loading: false,
  error: null,
};

// Product slice
const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Product
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.push(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Product
      .addCase(editProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editProduct.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.products.findIndex(
          (product) => product.id === action.payload.id
        );
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      .addCase(editProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Product
      .addCase(removeProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.filter(
          (product) => product.id !== action.payload
        );
      })
      .addCase(removeProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Toggle Product Enabled
      .addCase(toggleProductEnabled.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleProductEnabled.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.products.findIndex(
          (product) => product.id === action.payload.id
        );
        if (index !== -1) {
          state.products[index].is_enabled = action.payload.is_enabled;
        }
      })
      .addCase(toggleProductEnabled.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default productsSlice.reducer;
