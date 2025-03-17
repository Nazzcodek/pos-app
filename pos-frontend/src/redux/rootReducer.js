import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import sidebarSlice from "./slices/siderSlice";
// Import other reducers here

const rootReducer = combineReducers({
  auth: authReducer,
  sider: sidebarSlice,
  // Add other reducers here
});

export default rootReducer;
