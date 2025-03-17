import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Collapse,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  Apps as AppsIcon,
  Storage as StorageIcon,
  ShoppingCart as ShoppingCartIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Receipt as ReceiptIcon,
  LocalShipping as SupplierIcon,
} from "@mui/icons-material";
import SellIcon from "@mui/icons-material/Sell";
import {
  toggleProductDropdown,
  toggleInventoryDropdown,
} from "../../redux/slices/sidebarSlice";

const drawerWidth = 240;
const headerHeight = 64; // Adjust this value to match your header's height

const Sidebar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isProductDropdownOpen, isInventoryDropdownOpen } = useSelector(
    (state) => state.sidebar
  );

  const menuItems = [
    { path: "/dashboard", icon: <DashboardIcon />, text: "Dashboard" },
    { path: "/user", icon: <PersonIcon />, text: "User" },
    { path: "/report", icon: <DescriptionIcon />, text: "Report" },
    {
      text: "Product",
      icon: <AppsIcon />,
      isDropdown: true,
      isOpen: isProductDropdownOpen,
      toggle: () => dispatch(toggleProductDropdown()),
      items: [
        { path: "/product", text: "Product", icon: <InventoryIcon /> },
        { path: "/category", text: "Category", icon: <CategoryIcon /> },
      ],
    },
    {
      text: "Inventory",
      icon: <StorageIcon />,
      isDropdown: true,
      isOpen: isInventoryDropdownOpen,
      toggle: () => dispatch(toggleInventoryDropdown()),
      items: [
        { path: "/invoice", text: "Invoice", icon: <ReceiptIcon /> },
        { path: "/supplier", text: "Supplier", icon: <SupplierIcon /> },
        { path: "/inventory", text: "Inventory", icon: <StorageIcon /> },
        { path: "/transaction", text: "Transaction", icon: <SellIcon /> },
      ],
    },
    { path: "/posSales", icon: <ShoppingCartIcon />, text: "Sales" },
    { path: "/settings", icon: <SettingsIcon />, text: "Settings" },
  ];

  const renderMenuItem = (item) => {
    if (item.isDropdown) {
      return (
        <Box key={item.text} sx={{ color: "#fff" }}>
          <ListItemButton
            onClick={item.toggle}
            sx={{
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
              padding: "12px 24px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <ListItemIcon sx={{ color: "#fff", minWidth: "40px" }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </Box>
            {item.isOpen ? (
              <ExpandLess sx={{ color: "#fff" }} />
            ) : (
              <ExpandMore sx={{ color: "#fff" }} />
            )}
          </ListItemButton>
          <Collapse in={item.isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.items.map((subItem) => (
                <ListItemButton
                  key={subItem.path}
                  component={Link}
                  to={subItem.path}
                  selected={location.pathname === subItem.path}
                  sx={{
                    pl: 4,
                    "&.Mui-selected": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                    padding: "8px 24px 8px 48px",
                  }}
                >
                  <ListItemIcon sx={{ color: "#fff", minWidth: "40px" }}>
                    {subItem.icon}
                  </ListItemIcon>
                  <ListItemText primary={subItem.text} />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        </Box>
      );
    }

    return (
      <ListItem key={item.path} disablePadding>
        <ListItemButton
          component={Link}
          to={item.path}
          selected={location.pathname === item.path}
          sx={{
            "&.Mui-selected": {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
            padding: "12px 24px",
          }}
        >
          <ListItemIcon sx={{ color: "#fff", minWidth: "40px" }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText primary={item.text} />
        </ListItemButton>
      </ListItem>
    );
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          backgroundColor: "#1a3a3a",
          color: "#fff",
          borderRight: "none",
          position: "fixed",
          height: `calc(100vh - ${headerHeight}px)`,
          overflowY: "auto",
          top: `${headerHeight}px`,
        },
      }}
    >
      <Box sx={{ overflow: "auto" }}>
        <List sx={{ pt: 0 }}>{menuItems.map(renderMenuItem)}</List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
