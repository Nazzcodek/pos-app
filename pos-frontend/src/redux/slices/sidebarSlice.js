import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isProductDropdownOpen: false,
  isInventoryDropdownOpen: false,
};

const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    toggleProductDropdown: (state) => {
      state.isProductDropdownOpen = !state.isProductDropdownOpen;
    },
    toggleInventoryDropdown: (state) => {
      state.isInventoryDropdownOpen = !state.isInventoryDropdownOpen;
    },
  },
});

export const { toggleProductDropdown, toggleInventoryDropdown } =
  sidebarSlice.actions;
export default sidebarSlice.reducer;
