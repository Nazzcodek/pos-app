import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { useSnackbar } from "notistack";
import {
  fetchCategories,
  fetchProducts,
  createSale,
  fetchReceipt,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  setActiveCategory,
} from "../redux/slices/posSlice";
import { logout } from "../redux/slices/authSlice";
import { useAuth } from "../contexts/AuthContext";
import { getUserSessionReport } from "../routes/POSSales";
import { printReceipt } from "../components/pos/ReceiptPrinter";
import PrintButton from "../components/pos/SummaryPrinter";
import POSHeader from "../components/pos/POSHeader";
import { ProductGrid, CategoryBar } from "../components/pos/POSProduct";
import CartSidebar from "../components/pos/POSCart";

const POSSales = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user, logout: logoutUser } = useAuth();
  const [lastSale, setLastSale] = useState(null);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [checkoutConfirmOpen, setCheckoutConfirmOpen] = useState(false);

  const userRole = user?.role;

  const { categories, products, cartItems, activeCategory, loading } =
    useSelector((state) => state.pos);

  const [sessionSummary, setSessionSummary] = useState({
    totalSales: 0,
    totalTransactions: 0,
  });

  const initializeCategories = useCallback(async () => {
    try {
      const result = await dispatch(fetchCategories()).unwrap();
      if (result && result.length > 0) {
        dispatch(setActiveCategory(result[0].id));
        dispatch(fetchProducts(result[0].id));
      }
    } catch (error) {
      enqueueSnackbar("Failed to load categories", { variant: "error" });
    }
  }, [dispatch, enqueueSnackbar]);

  const fetchSessionSummary = useCallback(async () => {
    try {
      const report = await getUserSessionReport();
      const summary = report.summary || {};

      setSessionSummary({
        totalSales: parseFloat(summary.total_amount) || 0,
        totalTransactions: summary.total_sales || 0,
      });
    } catch (error) {
      enqueueSnackbar("Failed to fetch session summary", { variant: "error" });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    if (!userRole) {
      navigate("/dashboard");
      return;
    }
    initializeCategories();
    fetchSessionSummary();
  }, [userRole, navigate, initializeCategories, fetchSessionSummary]);

  const handleLogout = async () => {
    await logoutUser();
    dispatch(logout());
    navigate("/");
  };

  const handleCategoryClick = (categoryId) => {
    dispatch(setActiveCategory(categoryId));
    dispatch(fetchProducts(categoryId));
  };

  const handleAddToCart = (product) => {
    dispatch(addToCart(product));
    enqueueSnackbar(`Added ${product.name} to cart`, { variant: "success" });
  };

  const handleUpdateQuantity = (id, quantity) => {
    if (quantity > 0) {
      dispatch(updateCartItemQuantity({ id, quantity }));
    }
  };

  const handleCheckoutConfirm = async () => {
    setCheckoutConfirmOpen(false);
    try {
      const saleData = {
        items: cartItems.map((item) => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.total,
        })),
        total: cartItems.reduce((sum, item) => sum + item.total, 0),
        timestamp: new Date().toISOString(),
      };

      const saleResult = await dispatch(createSale(saleData)).unwrap();
      const receiptResult = await dispatch(
        fetchReceipt(saleResult.id)
      ).unwrap();

      setLastSale(saleResult);
      setLastReceipt(receiptResult);

      await printReceipt(receiptResult, saleResult);
      await fetchSessionSummary();
      dispatch(clearCart());
      enqueueSnackbar("Sale completed successfully", { variant: "success" });
    } catch (error) {
      console.error("Checkout failed:", error);
      enqueueSnackbar("Failed to complete sale", { variant: "error" });
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      enqueueSnackbar("Cart is empty", { variant: "warning" });
      return;
    }
    setCheckoutConfirmOpen(true);
  };

  const handlePrintLastReceipt = async () => {
    if (lastSale && lastReceipt) {
      await printReceipt(lastReceipt, lastSale);
    } else {
      enqueueSnackbar("No recent sale available", { variant: "warning" });
    }
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <POSHeader
        sessionSummary={sessionSummary}
        onLogout={handleLogout}
        PrintButton={<PrintButton sessionSummary={sessionSummary} />}
        onPrintLastReceipt={handlePrintLastReceipt}
        role={userRole}
        onBackToDashboard={() => navigate("/dashboard")}
      />

      <CategoryBar
        categories={categories}
        activeCategory={activeCategory}
        onCategoryClick={handleCategoryClick}
      />

      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          overflow: "hidden",
        }}
      >
        <Box sx={{ flexGrow: 1, overflow: "auto" }}>
          <ProductGrid
            products={products}
            loading={loading.products}
            onAddToCart={handleAddToCart}
          />
        </Box>

        <CartSidebar
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={(id) => dispatch(removeFromCart(id))}
          onClearCart={() => dispatch(clearCart())}
          onCheckout={handleCheckout}
          loading={loading.checkout}
        />
      </Box>

      <Dialog
        open={checkoutConfirmOpen}
        onClose={() => setCheckoutConfirmOpen(false)}
      >
        <DialogTitle>Confirm Checkout</DialogTitle>
        <DialogContent>
          Are you sure you want to complete this sale?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckoutConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCheckoutConfirm}
            variant="contained"
            color="primary"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default POSSales;
