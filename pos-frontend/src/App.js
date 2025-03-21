import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import store, { persistor } from "./redux/store";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import PrivateRoute from "./components/common/PrivateRoute";
import { SnackbarProvider } from "notistack";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import POSSales from "./pages/POSSales";
import SalesReportPage from "./pages/Report";
import UserManagement from "./pages/UserManagement";
import Layout from "./components/common/Layout";
import ProductManagement from "./pages/Products";
import CategoryManagement from "./pages/Category";
import InventoryPage from "./pages/Inventory";
import Settings from "./pages/Settings";
import SupplierManagementPage from "./pages/Suppliers";
import InvoicePage from "./pages/Invoice";
import TransactionPage from "./pages/Transaction";
import WebSocketStatus from "./components/common/WebSocketStatus";
import { initializeApiInterceptors } from "./api";

const App = () => {
  const { wsInitialized } = useAuth();
  const [showReconnect, setShowReconnect] = useState(false);

  // Initialize API interceptors
  useEffect(() => {
    initializeApiInterceptors(store);
  }, []);

  // Show reconnect UI if connection is lost
  useEffect(() => {
    if (!wsInitialized) {
      // Wait a few seconds before showing reconnect UI
      const timer = setTimeout(() => {
        setShowReconnect(true);
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setShowReconnect(false);
    }
  }, [wsInitialized]);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <SnackbarProvider
              maxSnack={3}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              autoHideDuration={4000}
            >
              <Router>
                <Routes>
                  <Route path="/" element={<Login />} />
                  <Route
                    path="/dashboard"
                    element={
                      <PrivateRoute>
                        <Layout>
                          <Dashboard />
                        </Layout>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/user"
                    element={
                      <PrivateRoute>
                        <Layout>
                          <UserManagement />
                        </Layout>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/category"
                    element={
                      <PrivateRoute>
                        <Layout>
                          <CategoryManagement />
                        </Layout>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/product"
                    element={
                      <PrivateRoute>
                        <Layout>
                          <ProductManagement />
                        </Layout>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/report"
                    element={
                      <PrivateRoute>
                        <Layout>
                          <SalesReportPage />
                        </Layout>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/inventory"
                    element={
                      <PrivateRoute>
                        <Layout>
                          <InventoryPage />
                        </Layout>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/supplier"
                    element={
                      <PrivateRoute>
                        <Layout>
                          <SupplierManagementPage />
                        </Layout>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/invoice"
                    element={
                      <PrivateRoute>
                        <Layout>
                          <InvoicePage />
                        </Layout>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/transaction"
                    element={
                      <PrivateRoute>
                        <Layout>
                          <TransactionPage />
                        </Layout>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/posSales"
                    element={
                      <PrivateRoute>
                        <POSSales />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <PrivateRoute>
                        <Settings />
                      </PrivateRoute>
                    }
                  />
                </Routes>
              </Router>
            </SnackbarProvider>
            {showReconnect && (
              <div className="fixed bottom-4 right-4 z-50">
                <WebSocketStatus />
              </div>
            )}
          </ThemeProvider>
        </AuthProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;
