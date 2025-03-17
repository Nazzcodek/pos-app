import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  Autocomplete,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import {
  fetchRawMaterials,
  fetchEquipments,
  fetchTransactions,
} from "../../redux/slices/inventorySlice";

const TransactionFilterModal = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const { rawMaterials, equipment } = useSelector((state) => state.inventory);

  // Combine raw materials and equipment for inventory selection
  const inventoryItems = [...rawMaterials, ...equipment];

  const [filters, setFilters] = useState({
    inventory_id: null,
    transaction_type: "",
    inventory_type: "",
    from_date: null,
    to_date: null,
  });

  const [activeFilters, setActiveFilters] = useState([]);

  useEffect(() => {
    // Fetch inventory items if not already loaded
    if (rawMaterials.length === 0) {
      dispatch(fetchRawMaterials());
    }
    if (equipment.length === 0) {
      dispatch(fetchEquipments());
    }
  }, [dispatch, rawMaterials.length, equipment.length]);

  const transactionTypes = [
    "ISSUE",
    "RESTOCK",
    "RETURN",
    "DAMAGE",
    "WRITE_OFF",
    "MAINTENANCE",
  ];

  const inventoryTypes = ["RAW_MATERIAL", "EQUIPMENT"];

  const handleChange = (field, value) => {
    setFilters({
      ...filters,
      [field]: value,
    });
  };

  const applyFilters = () => {
    // Create array of active filter descriptions for display
    const newActiveFilters = [];

    if (filters.inventory_id) {
      const inventoryItem = inventoryItems.find(
        (item) => item.id === filters.inventory_id
      );
      newActiveFilters.push(`Inventory: ${inventoryItem?.name || "Unknown"}`);
    }

    if (filters.transaction_type) {
      newActiveFilters.push(`Type: ${filters.transaction_type}`);
    }

    if (filters.inventory_type) {
      newActiveFilters.push(`Category: ${filters.inventory_type}`);
    }

    if (filters.from_date) {
      newActiveFilters.push(
        `From: ${dayjs(filters.from_date).format("MMM D, YYYY")}`
      );
    }

    if (filters.to_date) {
      newActiveFilters.push(
        `To: ${dayjs(filters.to_date).format("MMM D, YYYY")}`
      );
    }

    setActiveFilters(newActiveFilters);

    // Dispatch action to fetch filtered transactions
    dispatch(fetchTransactions(filters));
    onClose();
  };

  const clearFilters = () => {
    setFilters({
      inventory_id: null,
      transaction_type: "",
      inventory_type: "",
      from_date: null,
      to_date: null,
    });
    setActiveFilters([]);
    dispatch(fetchTransactions({}));
    onClose();
  };

  const removeFilter = (index) => {
    const newActiveFilters = [...activeFilters];
    newActiveFilters.splice(index, 1);

    // Reset the corresponding filter value
    const filterText = activeFilters[index];

    let updatedFilters = { ...filters };

    if (filterText.startsWith("Inventory:")) {
      updatedFilters.inventory_id = null;
    } else if (filterText.startsWith("Type:")) {
      updatedFilters.transaction_type = "";
    } else if (filterText.startsWith("Category:")) {
      updatedFilters.inventory_type = "";
    } else if (filterText.startsWith("From:")) {
      updatedFilters.from_date = null;
    } else if (filterText.startsWith("To:")) {
      updatedFilters.to_date = null;
    }

    setFilters(updatedFilters);
    setActiveFilters(newActiveFilters);

    // Re-fetch with updated filters
    dispatch(fetchTransactions(updatedFilters));
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Filter Transactions</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={inventoryItems}
                getOptionLabel={(option) => option.name || ""}
                value={
                  inventoryItems.find(
                    (item) => item.id === filters.inventory_id
                  ) || null
                }
                onChange={(event, newValue) => {
                  handleChange("inventory_id", newValue?.id || null);
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Inventory Item" fullWidth />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Transaction Type</InputLabel>
                <Select
                  value={filters.transaction_type}
                  onChange={(e) =>
                    handleChange("transaction_type", e.target.value)
                  }
                  label="Transaction Type"
                >
                  <MenuItem value="">
                    <em>All Types</em>
                  </MenuItem>
                  {transactionTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Inventory Category</InputLabel>
                <Select
                  value={filters.inventory_type}
                  onChange={(e) =>
                    handleChange("inventory_type", e.target.value)
                  }
                  label="Inventory Category"
                >
                  <MenuItem value="">
                    <em>All Categories</em>
                  </MenuItem>
                  {inventoryTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="From Date"
                  value={filters.from_date}
                  onChange={(date) => handleChange("from_date", date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="To Date"
                  value={filters.to_date}
                  onChange={(date) => handleChange("to_date", date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={clearFilters} color="secondary">
            Clear Filters
          </Button>
          <Button onClick={onClose} color="primary">
            Cancel
          </Button>
          <Button onClick={applyFilters} color="primary" variant="contained">
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Active Filters:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {activeFilters.map((filter, index) => (
              <Chip
                key={index}
                label={filter}
                onDelete={() => removeFilter(index)}
                color="primary"
                variant="outlined"
              />
            ))}
            <Chip
              label="Clear All"
              onClick={clearFilters}
              color="secondary"
              variant="outlined"
            />
          </Box>
        </Box>
      )}
    </>
  );
};

export default TransactionFilterModal;
