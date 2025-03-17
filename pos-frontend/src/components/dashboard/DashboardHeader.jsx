import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

const DashboardHeader = ({ title, handleRefresh, isRefreshing }) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
          color: "#1e293b",
        }}
      >
        {title}
      </Typography>

      <Tooltip title="Refresh data">
        <IconButton
          onClick={handleRefresh}
          disabled={isRefreshing}
          sx={{
            bgcolor: "#f1f5f9",
            "&:hover": { bgcolor: "#e2e8f0" },
            height: 42,
            width: 42,
          }}
        >
          {isRefreshing ? (
            <CircularProgress size={24} sx={{ color: "#4338ca" }} />
          ) : (
            <RefreshIcon sx={{ color: "#4338ca" }} />
          )}
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default DashboardHeader;
