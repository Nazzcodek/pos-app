import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import {
  ArrowBack,
  LogoutOutlined,
  Receipt,
  MoreVert,
} from "@mui/icons-material";
import { useState, useRef } from "react";
import PrintButton from "./SummaryPrinter";
import { useAuth } from "../../contexts/AuthContext";

const POSHeader = ({
  sessionSummary,
  onLogout,
  onPrintLastReceipt,
  role,
  onBackToDashboard,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const { user } = useAuth();
  const [username] = useState(user?.username || "");
  const printButtonRef = useRef(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    // First print the session summary
    if (printButtonRef.current) {
      await printButtonRef.current.handlePrint();
    }

    // Then proceed with logout
    onLogout();
    handleClose();
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: "#284d4d" }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Restaurant POS
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography sx={{ mr: 2 }}>
            Transactions: {sessionSummary.totalTransactions}
          </Typography>

          <IconButton
            color="inherit"
            onClick={handleClick}
            aria-controls={open ? "options-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
          >
            <MoreVert />
          </IconButton>

          <Menu
            id="header-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              "aria-labelledby": "options-button",
            }}
          >
            <MenuItem disabled>
              <Typography variant="body2" color="textSecondary">
                Logged in as: {username}
              </Typography>
            </MenuItem>
            <MenuItem disabled>
              <Typography variant="body2" color="textSecondary">
                Total Sales: ₦{sessionSummary.totalSales.toFixed(2)}
              </Typography>
            </MenuItem>

            <Divider />

            {role !== "cashier" && (
              <MenuItem
                onClick={() => {
                  onBackToDashboard();
                  handleClose();
                }}
              >
                <ArrowBack sx={{ mr: 1 }} />
                Back to Dashboard
              </MenuItem>
            )}

            <MenuItem
              onClick={() => {
                onPrintLastReceipt();
                handleClose();
              }}
            >
              <Receipt sx={{ mr: 1 }} />
              Print Last Receipt
            </MenuItem>

            <MenuItem
              onClick={() => {
                if (printButtonRef.current) {
                  printButtonRef.current.handlePrint();
                }
                handleClose();
              }}
            >
              <Receipt sx={{ mr: 1 }} />
              Print Session
            </MenuItem>

            <Divider />

            <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
              <LogoutOutlined sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>

        {/* Hidden PrintButton component with ref */}
        <div style={{ display: "none" }}>
          <PrintButton ref={printButtonRef} sessionSummary={sessionSummary} />
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default POSHeader;
