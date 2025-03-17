import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Typography,
  Box,
  Chip,
  Snackbar,
  Alert,
} from "@mui/material";
import { Delete, Edit, Print } from "@mui/icons-material";
import {
  deleteReportSale,
  toggleColumn,
  resetUpdateStatus,
} from "../../redux/slices/salesSlice";
import { printReceipt } from "../pos/ReceiptPrinter";
import { getReceipt } from "../../routes/POSSales";
import ColumnToggleMenu from "./ToggleColumn";
import EditSaleModal from "./EditModal";

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

const SalesReportTable = ({ rows, reportType, visibleColumns }) => {
  const dispatch = useDispatch();
  const [isAdmin, setIsAdmin] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      setIsAdmin(userData?.role === "admin");
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error);
      setIsAdmin(false);
    }
  }, []);

  const columns = getColumnDefinitions(reportType);
  const updatedColumns = columns.map((column) => {
    if (column.id === "quantity") {
      return { ...column, label: "Till" };
    }
    return column;
  });

  const handlePrint = async (saleId) => {
    if (isPrinting) return;

    setIsPrinting(true);
    try {
      const receiptData = await getReceipt(saleId);
      const currentSale = { id: saleId };

      await printReceipt(receiptData, currentSale);

      setNotification({
        open: true,
        message: "Receipt printed successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error printing receipt:", error);
      setNotification({
        open: true,
        message:
          "Failed to print receipt: " + (error.message || "Unknown error"),
        severity: "error",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleEdit = (id) => {
    if (isAdmin) {
      setSelectedSaleId(id);
      setEditModalOpen(true);
    }
  };

  const handleCloseEditModal = (success) => {
    setEditModalOpen(false);

    if (success) {
      setNotification({
        open: true,
        message: "Sale updated successfully",
        severity: "success",
      });

      dispatch(resetUpdateStatus());
    }
  };

  const handleDelete = (id) => {
    if (
      isAdmin &&
      window.confirm("Are you sure you want to delete this sale?")
    ) {
      dispatch(deleteReportSale(id))
        .unwrap()
        .then(() => {
          setNotification({
            open: true,
            message: "Sale deleted successfully",
            severity: "success",
          });
        })
        .catch((error) => {
          setNotification({
            open: true,
            message: `Failed to delete sale: ${
              error.message || "Unknown error"
            }`,
            severity: "error",
          });
        });
    }
  };

  const handleToggleColumn = (column) => {
    dispatch(toggleColumn({ reportType, column }));
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Calculate totals
  const totalQuantity = rows.reduce((sum, row) => sum + (row.quantity || 0), 0);
  const totalPrice = rows.reduce((sum, row) => sum + (row.total || 0), 0);

  return (
    <>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">
          Sales Data
          <Chip label={`${rows.length} rows`} size="small" sx={{ ml: 1 }} />
        </Typography>
        <ColumnToggleMenu
          columns={updatedColumns}
          visibleColumns={visibleColumns}
          onToggle={handleToggleColumn}
        />
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {updatedColumns
                .filter((column) => visibleColumns.includes(column.id))
                .map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    sx={{ fontWeight: "bold" }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              {reportType === "sales" && (
                <TableCell align="center">Actions</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length > 0 ? (
              <>
                {rows.map((row) => (
                  <TableRow
                    key={reportType === "sales" ? row.sale_id : row.item_id}
                  >
                    {updatedColumns
                      .filter((column) => visibleColumns.includes(column.id))
                      .map((column) => {
                        const value = row[column.id];
                        return (
                          <TableCell key={column.id} align={column.align}>
                            {column.format && value !== null
                              ? column.format(value)
                              : value}
                          </TableCell>
                        );
                      })}
                    {reportType === "sales" && (
                      <TableCell align="center">
                        <Tooltip title="Print Receipt">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handlePrint(row.sale_id)}
                              disabled={isPrinting}
                              sx={{
                                opacity: isPrinting ? 0.5 : 1,
                                cursor: isPrinting ? "not-allowed" : "pointer",
                              }}
                            >
                              <Print fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={isAdmin ? "Edit" : "Edit (Admin only)"}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(row.sale_id)}
                              disabled={!isAdmin}
                              sx={{
                                opacity: isAdmin ? 1 : 0.5,
                                cursor: isAdmin ? "pointer" : "not-allowed",
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip
                          title={isAdmin ? "Delete" : "Delete (Admin only)"}
                        >
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(row.sale_id)}
                              disabled={!isAdmin}
                              sx={{
                                opacity: isAdmin ? 1 : 0.5,
                                cursor: isAdmin ? "pointer" : "not-allowed",
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                <TableRow key="totals-row">
                  {updatedColumns
                    .filter((column) => visibleColumns.includes(column.id))
                    .map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.align}
                        sx={{ fontWeight: "bold" }}
                      >
                        {column.id === "till"
                          ? totalQuantity.toLocaleString()
                          : column.id === "total"
                          ? `₦${totalPrice.toFixed(2)}`
                          : ""}
                      </TableCell>
                    ))}
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>
                    Totals
                  </TableCell>
                </TableRow>
              </>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={
                    visibleColumns.length + (reportType === "sales" ? 1 : 0)
                  }
                  align="center"
                  sx={{ py: 3 }}
                >
                  <Typography variant="body1" color="text.secondary">
                    No data available
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <EditSaleModal
        open={editModalOpen}
        onClose={handleCloseEditModal}
        saleId={selectedSaleId}
      />

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SalesReportTable;
