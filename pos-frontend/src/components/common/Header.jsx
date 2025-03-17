import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { logout } from "../../redux/slices/authSlice";
import { useAuth } from "../../contexts/AuthContext";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Box,
} from "@mui/material";
import { Logout as LogoutIcon } from "@mui/icons-material";

const Header = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { logout: logoutUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    dispatch(logout());
    navigate("/");
  };

  const getTitle = () => {
    const path = location.pathname.split("/")[1];
    const titles = {
      dashboard: "DASHBOARD",
      user: "USERS",
      product: "PRODUCTS",
      category: "CATEGORIES",
      sales: "SALES",
      report: "REPORTS",
      settings: "SETTINGS",
      inventory: "INVENTORY",
      invoice: "INVOICES",
      supplier: "SUPPLIERS",
      transaction: "TRANSACTIONS",
    };
    return titles[path] || "";
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: "#284d4d",
        boxShadow: "none",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: "bold" }}>
          {getTitle()}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: "#1976d2" }}>
            {user?.username?.[0]?.toUpperCase()}
          </Avatar>
          <Typography sx={{ color: "#fff", mr: 2 }}>
            {user?.username}
          </Typography>
          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{
              backgroundColor: "hsl(0, 92%, 26%)",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            Log Out
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
