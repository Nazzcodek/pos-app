import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  deleteUser,
  getAllUsers,
  createUser as newUser,
  updateUser,
  toggleUserStatus,
} from "../../routes/UserManagement";

// Async thunks for user actions
export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAllUsers();
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response.data.detail || "Failed to fetch users"
      );
    }
  }
);

export const createUser = createAsyncThunk(
  "users/createUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await newUser(userData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response.data.detail || "Failed to create user"
      );
    }
  }
);

export const editUser = createAsyncThunk(
  "users/updateUser",
  async ({ id, userData }, { rejectWithValue }) => {
    try {
      const response = await updateUser(id, userData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response.data.detail || "Failed to update user"
      );
    }
  }
);

export const removeUser = createAsyncThunk(
  "users/deleteUser",
  async (id, { rejectWithValue }) => {
    try {
      await deleteUser(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response.data.detail || "Failed to delete user"
      );
    }
  }
);

export const toggleUserEnabled = createAsyncThunk(
  "users/toggleUserEnabled",
  async (id, { rejectWithValue }) => {
    try {
      const response = await toggleUserStatus(id);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response.data.detail || "Failed to toggle user status"
      );
    }
  }
);

// Initial state
const initialState = {
  users: [],
  loading: false,
  error: null,
};

// User slice
const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create User
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update User
      .addCase(editUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editUser.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.users.findIndex(
          (user) => user.id === action.payload.id
        );
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      .addCase(editUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete User
      .addCase(removeUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter((user) => user.id !== action.payload);
      })
      .addCase(removeUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Toggle User Enabled
      .addCase(toggleUserEnabled.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleUserEnabled.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.users.findIndex(
          (user) => user.id === action.payload.id
        );
        if (index !== -1) {
          state.users[index].is_enabled = action.payload.is_enabled;
        }
      })
      .addCase(toggleUserEnabled.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default usersSlice.reducer;
