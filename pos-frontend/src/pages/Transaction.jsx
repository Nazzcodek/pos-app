import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTransactions,
  deleteTransaction,
} from "../redux/slices/inventorySlice";
import {
  Box,
  Button,
  Typography,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import TransactionTable from "../components/transactions/TransactionTable";
import TransactionForm from "../components/transactions/TransactionForm";
import TransactionDetail from "../components/transactions/TransactionDetail";
import TransactionFilterModal from "../components/transactions/TransactionFilter";
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  exportToJSON,
} from "../utils/exportUtils";

const defaultColumns = {
  inventory_name: true,
  transaction_type: true,
  quantity: true,
  transaction_date: true,
  created_by: true,
  notes: true,
  previous_quantity: true,
  resulting_quantity: true,
  updated_by: true,
  actions: true,
};

const allColumns = [
  { id: "inventory_name", label: "Inventory Name" },
  { id: "transaction_type", label: "Type" },
  { id: "quantity", label: "Quantity" },
  { id: "transaction_date", label: "Date" },
  { id: "created_by", label: "Created By" },
  { id: "notes", label: "Notes" },
  { id: "previous_quantity", label: "Previous Qty" },
  { id: "resulting_quantity", label: "Resulting Qty" },
  { id: "updated_by", label: "Updated By" },
  { id: "is_locked", label: "Locked" },
  { id: "is_system_generated", label: "System Generated" },
  { id: "actions", label: "Actions" },
];

const TransactionPage = () => {
  const dispatch = useDispatch();
  const { transactions, loading } = useSelector((state) => state.inventory);

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const [visibilityAnchorEl, setVisibilityAnchorEl] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);

  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch]);

  const handleAddTransaction = () => {
    setSelectedTransaction(null);
    setIsEditMode(false);
    setIsFormOpen(true);
  };

  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleViewDetail = (transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailOpen(true);
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      await dispatch(deleteTransaction(id));
      if (selectedTransaction && selectedTransaction.id === id) {
        setSelectedTransaction(null);
        setIsDetailOpen(false);
      }
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
  };

  const handleDetailClose = () => {
    setIsDetailOpen(false);
  };

  const handleFilterOpen = () => {
    setIsFilterOpen(true);
  };

  const handleFilterClose = () => {
    setIsFilterOpen(false);
  };

  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleColumnVisibilityClick = (event) => {
    setVisibilityAnchorEl(event.currentTarget);
  };

  const handleColumnVisibilityClose = () => {
    setVisibilityAnchorEl(null);
  };

  const toggleColumnVisibility = (column) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const getColumns = () => {
    return allColumns.filter((col) => visibleColumns[col.id]);
  };

  const handleExport = (format) => {
    const columns = getColumns();
    const fileName = `inventory-transactions-${
      new Date().toISOString().split("T")[0]
    }`;

    switch (format) {
      case "csv":
        exportToCSV(transactions, fileName, columns);
        break;
      case "excel":
        exportToExcel(transactions, fileName, columns);
        break;
      case "pdf":
        exportToPDF(transactions, fileName, columns);
        break;
      case "json":
        exportToJSON(transactions, fileName);
        break;
      default:
        break;
    }

    handleExportClose();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h4">Inventory Transactions</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={handleFilterOpen}
            sx={{ mr: 1 }}
          >
            Filter
          </Button>
          <Button
            variant="outlined"
            startIcon={<ViewColumnIcon />}
            onClick={handleColumnVisibilityClick}
            sx={{ mr: 1 }}
          >
            Columns
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportClick}
            sx={{ mr: 1 }}
          >
            Export
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddTransaction}
          >
            Create Transaction
          </Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Filter Modal */}
      <TransactionFilterModal open={isFilterOpen} onClose={handleFilterClose} />

      <TransactionTable
        transactions={transactions}
        loading={loading}
        onEdit={handleEditTransaction}
        onDelete={handleDeleteTransaction}
        onView={handleViewDetail}
        columns={getColumns()}
      />

      <TransactionForm
        open={isFormOpen}
        onClose={handleFormClose}
        transaction={selectedTransaction}
        isEditMode={isEditMode}
      />

      <TransactionDetail
        open={isDetailOpen}
        onClose={handleDetailClose}
        transaction={selectedTransaction}
        onEdit={handleEditTransaction}
      />

      {/* Export Menu */}
      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={handleExportClose}
      >
        <MenuItem onClick={() => handleExport("csv")}>
          <ListItemText>CSV</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExport("excel")}>
          <ListItemText>Excel</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExport("pdf")}>
          <ListItemText>PDF</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExport("json")}>
          <ListItemText>JSON</ListItemText>
        </MenuItem>
      </Menu>

      {/* Column Visibility Menu */}
      <Menu
        anchorEl={visibilityAnchorEl}
        open={Boolean(visibilityAnchorEl)}
        onClose={handleColumnVisibilityClose}
      >
        {allColumns.map((column) => (
          <MenuItem
            key={column.id}
            onClick={() => toggleColumnVisibility(column.id)}
          >
            <ListItemIcon>
              {visibleColumns[column.id] ? (
                <input type="checkbox" checked readOnly />
              ) : (
                <input type="checkbox" readOnly />
              )}
            </ListItemIcon>
            <ListItemText>{column.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default TransactionPage;
