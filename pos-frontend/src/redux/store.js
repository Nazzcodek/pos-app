import { configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

// Import reducers
import authReducer from "./slices/authSlice";
import usersReducer from "./slices/userSlice";
import productReducer from "./slices/productSlice";
import inventoryReducer from "./slices/inventorySlice";
import salesReducer from "./slices/salesSlice";
import posReducer from "./slices/posSlice";
import sidebarReducer from "./slices/sidebarSlice";
import dashboardReducer from "./slices/dashboardSlice";
import categoryReducer from "./slices/categorySlice";
import settingsReducer from "./slices/settingsSlice";
import supplierReducer from "./slices/supplierSlice";
import invoiceReducer from "./slices/invoiceSlice";

// Persist configuration for auth
const authPersistConfig = {
  key: "auth",
  version: 1,
  storage,
  whitelist: ["user"],
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

// Create store
const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    sidebar: sidebarReducer,
    dashboard: dashboardReducer,
    users: usersReducer,
    products: productReducer,
    inventory: inventoryReducer,
    sales: salesReducer,
    pos: posReducer,
    categories: categoryReducer,
    settings: settingsReducer,
    suppliers: supplierReducer,
    invoices: invoiceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
export default store;
