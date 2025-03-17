import React, { useState, useMemo } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Switch,
  Typography,
  Chip,
  Button,
  Snackbar,
  Alert,
  TableFooter,
} from "@mui/material";
import { useSnackbar } from "notistack";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  FileDownload,
  PictureAsPdf,
  TableChart,
  Description,
} from "@mui/icons-material";
import dayjs from "dayjs";
import { useAuth } from "../../contexts/AuthContext";
import { inventoryApi } from "../../routes/Inventories";
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  exportToJSON,
} from "../../utils/exportUtils";

const InventoryTable = ({
  inventoryType, // 'raw_material' or 'equipment'
  data = [],
  loading = false,
  onRowClick,
  onEdit,
  filters = {},
  onRefresh,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isManagerOrAdmin = ["admin", "manager"].includes(user?.role);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState("name");
  const [order, setOrder] = useState("asc");
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [columnMenuAnchorEl, setColumnMenuAnchorEl] = useState(null);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const [statusChangeLoading, setStatusChangeLoading] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [errorOpen, setErrorOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  // Function to calculate total for a row
  const calculateRowTotal = (row) => {
    const price = parseFloat(row.price_per_unit) || 0;
    const quantity =
      parseFloat(row.quantity) || parseFloat(row.available_units) || 0;
    return price * quantity;
  };

  // Add total data to each row
  const dataWithTotals = useMemo(() => {
    return data.map((row) => ({
      ...row,
      total: calculateRowTotal(row),
    }));
  }, [data]);

  // Calculate grand totals for footer
  const grandTotals = useMemo(() => {
    const totals = {
      quantity: 0,
      available_units: 0,
      total: 0,
    };

    dataWithTotals.forEach((row) => {
      if (inventoryType === "raw_material") {
        totals.quantity += parseFloat(row.quantity) || 0;
      } else {
        totals.available_units += parseFloat(row.available_units) || 0;
      }
      totals.total += row.total || 0;
    });

    return totals;
  }, [dataWithTotals, inventoryType]);

  // Define columns based on inventory type
  const commonColumns = [
    { id: "name", label: "Name" },
    { id: "description", label: "Description" },
    {
      id: "price_per_unit",
      label: "Price Per Unit",
      render: (row) => `₦${row.price_per_unit?.toFixed(2) || "0.00"}`,
    },
    {
      id: "status",
      label: "Status",
      render: (row) => (
        <Chip
          label={row.status}
          color={
            row.status === "in_stock"
              ? "success"
              : row.status === "issued"
              ? "info"
              : row.status === "returned"
              ? "primary"
              : row.status === "depleted"
              ? "error"
              : row.status === "maintenance"
              ? "warning"
              : row.status === "damaged"
              ? "error"
              : row.status === "expired"
              ? "error"
              : row.status === "decommissioned"
              ? "default"
              : "default"
          }
          size="small"
        />
      ),
    },
    {
      id: "suppliers",
      label: "Suppliers",
      render: (row) =>
        row.suppliers?.map((supplier) => supplier.name).join(", ") || "N/A",
    },
    {
      id: "is_enabled",
      label: "Enabled",
      render: (row) => (
        <Switch
          checked={Boolean(row.is_enabled)} // Convert to boolean
          onChange={(e) => {
            e.stopPropagation();
            handleToggleStatus(row);
          }}
          disabled={!isManagerOrAdmin || statusChangeLoading === row.id}
          size="small"
        />
      ),
    },
    {
      id: "created_at",
      label: "Created At",
      render: (row) => dayjs(row.created_at).format("MMM DD, YYYY"),
    },
    {
      id: "updated_at",
      label: "Updated At",
      render: (row) => dayjs(row.updated_at).format("MMM DD, YYYY"),
    },
    {
      id: "created_by",
      label: "Created By",
      render: (row) => row.created_by || "N/A",
    },
  ];

  const rawMaterialColumns = [
    ...commonColumns,
    {
      id: "quantity",
      label: "Quantity",
      render: (row) => `${row.quantity || 0} ${row.quantity_unit || ""}`,
    },
    { id: "batch_number", label: "Batch Number" },
    {
      id: "expiry_date",
      label: "Expiry Date",
      render: (row) =>
        row.expiry_date ? dayjs(row.expiry_date).format("MMM DD, YYYY") : "N/A",
    },
    {
      id: "is_perishable",
      label: "Perishable",
      render: (row) => (row.is_perishable ? "Yes" : "No"),
    },
    // Add Total Column for Raw Materials
    {
      id: "total",
      label: "Total",
      render: (row) => `₦${row.total.toFixed(2) || "0.00"}`,
    },
  ];

  const equipmentColumns = [
    ...commonColumns,
    { id: "total_units", label: "Total Units" },
    { id: "available_units", label: "Available Units" },
    {
      id: "maintenance_schedule",
      label: "Maintenance Due",
      render: (row) =>
        row.maintenance_schedule
          ? dayjs(row.maintenance_schedule).format("MMM DD, YYYY")
          : "N/A",
    },
    {
      id: "last_maintained",
      label: "Last Maintained",
      render: (row) =>
        row.last_maintained
          ? dayjs(row.last_maintained).format("MMM DD, YYYY")
          : "N/A",
    },
    // Add Total Column for Equipment
    {
      id: "total",
      label: "Total",
      render: (row) => `₦${row.total.toFixed(2) || "0.00"}`,
    },
  ];

  const columns =
    inventoryType === "raw_material" ? rawMaterialColumns : equipmentColumns;

  const [visibleColumns, setVisibleColumns] = useState(
    columns.reduce((acc, col) => ({ ...acc, [col.id]: true }), {})
  );

  // Toggle column visibility
  const toggleColumnVisibility = (columnId) => {
    setVisibleColumns({
      ...visibleColumns,
      [columnId]: !visibleColumns[columnId],
    });
  };

  // Handle status toggle
  const handleToggleStatus = async (row) => {
    if (!isManagerOrAdmin) return;

    try {
      setStatusChangeLoading(row.id);
      await inventoryApi.toggleInventoryStatus(row.id);
      enqueueSnackbar("Status toggled successfully", { variant: "success" });
      if (onRefresh) onRefresh();
    } catch (error) {
      // Display the error message from the server
      const errorMessage =
        error.response?.data?.detail || "Error toggling inventory status";
      enqueueSnackbar(errorMessage, { variant: "error" });
      console.error("Error toggling inventory status:", error);
    } finally {
      setStatusChangeLoading(null);
    }
  };

  // Handle row actions (Edit/Delete)
  const handleActionClick = (event, row) => {
    event.stopPropagation();
    setMenuAnchorEl({ el: event.currentTarget, row });
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleEditClick = () => {
    if (onEdit && isManagerOrAdmin) {
      onEdit(menuAnchorEl.row);
    }
    handleMenuClose();
  };

  const handleDeleteClick = async () => {
    if (!isAdmin) return;

    try {
      const isConfirmed = window.confirm(
        "Are you sure you want to delete this inventory item? This action cannot be undone."
      );

      if (!isConfirmed) {
        handleMenuClose();
        return;
      }

      await inventoryApi.deleteInventory(menuAnchorEl.row.id);
      enqueueSnackbar("Inventory deleted successfully", { variant: "success" });
      if (onRefresh) onRefresh();
    } catch (error) {
      // Display the error message from the server
      enqueueSnackbar(error.message, { variant: "error" });
      console.error("Error deleting inventory:", error);
    }
    handleMenuClose();
  };

  // Table sorting
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  // Pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Get visible columns data for export (including totals)
  const getVisibleColumnsData = () => {
    const visibleData = sortedData.map((row) => {
      const rowData = Object.keys(visibleColumns)
        .filter((key) => visibleColumns[key])
        .reduce((obj, key) => {
          obj[key] = row[key];
          return obj;
        }, {});

      // Ensure total is included when exporting
      if (visibleColumns["total"]) {
        rowData.total = row.total;
      }

      return rowData;
    });

    // Add a sum row to the exported data
    const totalRow = {
      name: "GRAND TOTAL",
      description: "",
      price_per_unit: "",
      status: "",
      suppliers: "",
      is_enabled: "",
      created_at: "",
      updated_at: "",
      created_by: "",
    };

    if (inventoryType === "raw_material") {
      totalRow.quantity = grandTotals.quantity;
    } else {
      totalRow.available_units = grandTotals.available_units;
    }

    totalRow.total = grandTotals.total;

    // Add the total row at the end
    visibleData.push(totalRow);

    return visibleData;
  };

  // Handle export functions
  const handleExport = (format) => {
    setExportLoading(true);
    const visibleData = getVisibleColumnsData();
    const visibleColumnDefs = columns.filter((col) => visibleColumns[col.id]);
    const fileName = `inventory_${inventoryType}_export`;

    try {
      switch (format) {
        case "csv":
          exportToCSV(visibleData, fileName, visibleColumnDefs);
          break;
        case "excel":
          exportToExcel(visibleData, fileName, visibleColumnDefs);
          break;
        case "pdf":
          exportToPDF(visibleData, fileName, visibleColumnDefs);
          break;
        case "json":
          exportToJSON(visibleData, fileName);
          break;
        default:
          break;
      }
    } catch (error) {
      setExportError(error);
      setErrorOpen(true);
    } finally {
      setExportLoading(false);
      setExportAnchorEl(null);
    }
  };

  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleErrorClose = () => {
    setErrorOpen(false);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Sort data (now using dataWithTotals)
  const sortedData = React.useMemo(() => {
    return [...dataWithTotals].sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      return (
        (order === "asc" ? 1 : -1) *
        (typeof aValue === "string"
          ? aValue.localeCompare(bValue)
          : aValue - bValue)
      );
    });
  }, [dataWithTotals, orderBy, order]);

  // Get data for current page
  const currentPageData = sortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // No data state
  if (data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          No inventory items found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {Object.keys(filters).length > 0
            ? "Try adjusting your filters"
            : `No ${
                inventoryType === "raw_material" ? "raw materials" : "equipment"
              } available`}
        </Typography>
      </Paper>
    );
  }

  // Function to render footer cell based on column
  const renderFooterCell = (column) => {
    // Only show values for relevant columns
    if (column.id === "name") {
      return <Typography variant="subtitle2">GRAND TOTAL</Typography>;
    }
    if (inventoryType === "raw_material" && column.id === "quantity") {
      return (
        <Typography variant="subtitle2">{grandTotals.quantity}</Typography>
      );
    }
    if (inventoryType === "equipment" && column.id === "available_units") {
      return (
        <Typography variant="subtitle2">
          {grandTotals.available_units}
        </Typography>
      );
    }
    if (column.id === "total") {
      return (
        <Typography variant="subtitle2">
          ₦{grandTotals.total.toFixed(2)}
        </Typography>
      );
    }

    // For all other columns, return empty cell
    return null;
  };

  // Get visible columns
  const visibleColumnsList = columns.filter((col) => visibleColumns[col.id]);

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box>
          {/* Toggle Columns Button */}
          <Button
            variant="contained"
            startIcon={
              Object.values(visibleColumns).every(Boolean) ? (
                <VisibilityIcon />
              ) : (
                <VisibilityOffIcon />
              )
            }
            onClick={(e) => setColumnMenuAnchorEl(e.currentTarget)}
          >
            {Object.values(visibleColumns).every(Boolean)
              ? "Hide Columns"
              : "Show Columns"}
          </Button>
          <Menu
            anchorEl={columnMenuAnchorEl}
            open={Boolean(columnMenuAnchorEl)}
            onClose={() => setColumnMenuAnchorEl(null)}
          >
            {columns.map((column) => (
              <MenuItem key={column.id} dense>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={visibleColumns[column.id]}
                      onChange={() => toggleColumnVisibility(column.id)}
                    />
                  }
                  label={column.label}
                />
              </MenuItem>
            ))}
          </Menu>
        </Box>

        {/* Export Button */}
        <Button
          variant="contained"
          startIcon={<FileDownload />}
          onClick={handleExportClick}
          disabled={data.length === 0 || exportLoading}
        >
          {exportLoading ? (
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

        {/* Error notification */}
        <Snackbar
          open={errorOpen}
          autoHideDuration={6000}
          onClose={handleErrorClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleErrorClose}
            severity="error"
            variant="filled"
            sx={{ width: "100%" }}
          >
            {exportError?.message ||
              exportError?.toString() ||
              "Failed to export report. Please try again."}
          </Alert>
        </Snackbar>
      </Box>
      <Paper sx={{ width: "100%", mb: 2 }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {visibleColumnsList.map((column) => (
                  <TableCell
                    key={column.id}
                    sortDirection={orderBy === column.id ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : "asc"}
                      onClick={() => handleRequestSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
                {isManagerOrAdmin && <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {currentPageData.map((row) => (
                <TableRow
                  hover
                  key={row.id}
                  onClick={() => onRowClick(row)}
                  sx={{ cursor: "pointer" }}
                >
                  {visibleColumnsList.map((column) => (
                    <TableCell key={column.id}>
                      {column.render ? column.render(row) : row[column.id]}
                    </TableCell>
                  ))}
                  {isManagerOrAdmin && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        size="small"
                        onClick={(e) => handleActionClick(e, row)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>

            {/* Table Footer with aligned Totals */}
            <TableFooter>
              <TableRow sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}>
                {visibleColumnsList.map((column) => (
                  <TableCell key={`footer-${column.id}`}>
                    {renderFooterCell(column)}
                  </TableCell>
                ))}
                {isManagerOrAdmin && <TableCell />}
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <Menu
        anchorEl={menuAnchorEl?.el}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        {isManagerOrAdmin && (
          <MenuItem onClick={handleEditClick}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}
        {isAdmin && (
          <MenuItem onClick={handleDeleteClick}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default InventoryTable;
