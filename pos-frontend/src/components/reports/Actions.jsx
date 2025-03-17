import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Button,
  Menu,
  MenuItem,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  FileDownload,
  PictureAsPdf,
  TableChart,
  Description,
} from "@mui/icons-material";
import { exportData, getExportColumns } from "../../utils/exportUtilsReport";

// Helper function to get column definitions
const getColumnDefinitions = (reportType) => {
  const commonColumns = [
    { id: "receipt_number", label: "Receipt No.", align: "left" },
    {
      id: "date_time",
      label: "Date & Time",
      align: "left",
      format: (value) => {
        if (!value) return "N/A";
        const date = new Date(value);
        return isNaN(date) ? "Invalid Date" : date.toLocaleString();
      },
    },
    { id: "username", label: "Username", align: "left" },
    { id: "product", label: "Product", align: "left" },
    { id: "category", label: "Category", align: "left" },
    {
      id: "quantity",
      label: "Till",
      align: "right",
      format: (value) =>
        value !== undefined && value !== null ? value.toLocaleString() : "0",
    },
    {
      id: "unit_price",
      label: "Unit Price",
      align: "right",
      format: (value) =>
        value !== undefined && value !== null
          ? `₦${value.toFixed(2)}`
          : "₦0.00",
    },
    {
      id: "total",
      label: "Total",
      align: "right",
      format: (value) =>
        value !== undefined && value !== null
          ? `₦${value.toFixed(2)}`
          : "₦0.00",
    },
  ];

  if (reportType === "sales") {
    return [
      ...commonColumns,
      { id: "total_items", label: "Total Items", align: "right" },
      {
        id: "session_start",
        label: "Session Start",
        align: "left",
        format: (value) => {
          if (!value) return "N/A";
          const date = new Date(value);
          return isNaN(date) ? "Invalid Date" : date.toLocaleString();
        },
      },
      {
        id: "session_end",
        label: "Session End",
        align: "left",
        format: (value) => {
          if (!value) return "N/A";
          const date = new Date(value);
          return isNaN(date) ? "Invalid Date" : date.toLocaleString();
        },
      },
    ];
  } else {
    return [
      ...commonColumns,
      {
        id: "session_start",
        label: "Session Start",
        align: "left",
        format: (value) => {
          if (!value) return "N/A";
          const date = new Date(value);
          return isNaN(date) ? "Invalid Date" : date.toLocaleString();
        },
      },
    ];
  }
};

const SalesReportActions = ({
  reportType,
  visibleColumns,
  filters,
  rowCount,
  rows = [],
}) => {
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // Debug: Check what data we have (could be removed in production)
  useEffect(() => {}, [rows]);

  const handleExportClick = (event) => {
    // Check if we have data
    if (!rows || rows.length === 0) {
      setNotification({
        open: true,
        message: "No data available to export",
        severity: "warning",
      });
      return;
    }
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleExport = async (format) => {
    // Double-check data availability
    if (!rows || rows.length === 0) {
      setNotification({
        open: true,
        message: "No data available to export",
        severity: "warning",
      });
      handleExportClose();
      return;
    }

    setLoading(true);
    handleExportClose();

    try {
      // Get column definitions based on report type
      const columnDefs = getColumnDefinitions(reportType);

      // Get formatted columns based on visible columns
      const exportColumns = getExportColumns(
        reportType,
        visibleColumns,
        columnDefs
      );

      // Create a title based on filters
      let reportTitle = `${
        reportType.charAt(0).toUpperCase() + reportType.slice(1)
      } Report`;
      if (filters.startDate && filters.endDate) {
        reportTitle += ` (${new Date(
          filters.startDate
        ).toLocaleDateString()} - ${new Date(
          filters.endDate
        ).toLocaleDateString()})`;
      }

      // Export the data using our util
      const success = await exportData(
        rows,
        exportColumns,
        format,
        reportTitle
      );

      if (success) {
        setNotification({
          open: true,
          message: `Report exported successfully as ${format.toUpperCase()}`,
          severity: "success",
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      setNotification({
        open: true,
        message: error.message || "Failed to export report",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Check if we have data to enable the export button
  const hasData = rows && rows.length > 0;

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Actions
      </Typography>

      <Box mt={2}>
        <Button
          variant="contained"
          startIcon={<FileDownload />}
          onClick={handleExportClick}
          disabled={!hasData || loading}
          fullWidth
        >
          {loading ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              Exporting...
            </>
          ) : (
            "Export"
          )}
        </Button>

        <Menu
          anchorEl={exportAnchorEl}
          open={Boolean(exportAnchorEl)}
          onClose={handleExportClose}
        >
          <MenuItem onClick={() => handleExport("csv")}>
            <TableChart sx={{ mr: 1 }} />
            Export as CSV
          </MenuItem>
          <MenuItem onClick={() => handleExport("pdf")}>
            <PictureAsPdf sx={{ mr: 1 }} />
            Export as PDF
          </MenuItem>
          <MenuItem onClick={() => handleExport("excel")}>
            <TableChart sx={{ mr: 1 }} />
            Export as Excel
          </MenuItem>
          <MenuItem onClick={() => handleExport("json")}>
            <Description sx={{ mr: 1 }} />
            Export as JSON
          </MenuItem>
        </Menu>

        {/* Notification */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>

      {!hasData && (
        <Typography variant="body2" color="text.secondary" mt={1}>
          No data available to export
        </Typography>
      )}
    </Paper>
  );
};

export default SalesReportActions;
