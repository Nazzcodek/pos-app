import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getEnabledCategory } from "../../routes/Categories";
import { getEnabledProductByCategory } from "../../routes/Products";
import { createSale as createSaleApi, getReceipt } from "../../routes/POSSales";

const SaleStatus = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  CANCELED: "CANCELED",
};

const initialState = {
  categories: [],
  products: [],
  cartItems: [],
  activeCategory: null,
  currentSale: null,
  loading: {
    categories: false,
    products: false,
    checkout: false,
    receipt: false,
  },
  error: null,
  receipt: null,
};

export const fetchCategories = createAsyncThunk(
  "pos/fetchCategories",
  async () => {
    const response = await getEnabledCategory();
    return response;
  }
);

export const fetchProducts = createAsyncThunk(
  "pos/fetchProducts",
  async (categoryId) => {
    const response = await getEnabledProductByCategory(categoryId);
    return response;
  }
);

export const createSale = createAsyncThunk(
  "pos/createSale",
  async (saleData, { rejectWithValue }) => {
    try {
      const response = await createSaleApi(saleData);

      if (!response || !response.id) {
        throw new Error("Invalid sale response");
      }

      return response;
    } catch (error) {
      console.error("CreateSale thunk error:", {
        message: error.message,
        stack: error.stack,
        response: error.response,
      }); // Debug with full error details
      return rejectWithValue(error.message);
    }
  }
);

export const fetchReceipt = createAsyncThunk(
  "pos/fetchReceipt",
  async (saleId, { rejectWithValue }) => {
    try {
      const response = await getReceipt(saleId);
      if (!response || !response.receipt_number) {
        throw new Error("Invalid receipt response");
      }
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const posSlice = createSlice({
  name: "pos",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const existingItem = state.cartItems.find(
        (item) => item.id === action.payload.id
      );
      if (existingItem) {
        existingItem.quantity += 1;
        existingItem.total = existingItem.quantity * existingItem.price;
      } else {
        state.cartItems.push({
          ...action.payload,
          quantity: 1,
          total: action.payload.price,
        });
      }
    },
    updateCartItemQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.cartItems.find((item) => item.id === id);
      if (item && quantity > 0) {
        item.quantity = quantity;
        item.total = quantity * item.price;
      }
    },
    removeFromCart: (state, action) => {
      state.cartItems = state.cartItems.filter(
        (item) => item.id !== action.payload
      );
    },
    clearCart: (state) => {
      state.cartItems = [];
      state.currentSale = null;
      state.receipt = null;
    },
    setActiveCategory: (state, action) => {
      state.activeCategory = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading.categories = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading.categories = false;
        state.categories = action.payload;
        if (action.payload.length > 0 && !state.activeCategory) {
          state.activeCategory = action.payload[0].id;
        }
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading.categories = false;
        state.error = action.error.message;
      })

      // Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading.products = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading.products = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading.products = false;
        state.error = action.error.message;
      })

      // Create Sale
      .addCase(createSale.pending, (state) => {
        state.loading.checkout = true;
        state.error = null;
      })
      .addCase(createSale.fulfilled, (state, action) => {
        state.loading.checkout = false;
        state.currentSale = {
          id: action.payload.id,
          status: SaleStatus.COMPLETED,
          items: state.cartItems,
          total: state.cartItems.reduce((sum, item) => sum + item.total, 0),
          timestamp: new Date().toISOString(),
        };
      })
      .addCase(createSale.rejected, (state, action) => {
        state.loading.checkout = false;
        state.error = action.payload || "Failed to create sale";
      })

      // Fetch Receipt
      .addCase(fetchReceipt.pending, (state) => {
        state.loading.receipt = true;
        state.error = null;
      })
      .addCase(fetchReceipt.fulfilled, (state, action) => {
        state.loading.receipt = false;
        state.receipt = {
          ...action.payload,
          items: state.currentSale.items,
          total: state.currentSale.total,
          timestamp: state.currentSale.timestamp,
        };
      })
      .addCase(fetchReceipt.rejected, (state, action) => {
        state.loading.receipt = false;
        state.error = action.payload || "Failed to fetch receipt";
      });
  },
});

export const {
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  setActiveCategory,
} = posSlice.actions;

export default posSlice.reducer;
