import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Autocomplete,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";

import {
  setFilters,
  clearFilters,
  fetchInvoices,
} from "../../redux/slices/invoiceSlice";
import { fetchSuppliers } from "../../redux/slices/supplierSlice";

const InvoiceFilter = () => {
  const dispatch = useDispatch();
  const { filters } = useSelector((state) => state.invoices);
  const { suppliers } = useSelector((state) => state.suppliers);

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [isPaid, setIsPaid] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    dispatch(fetchSuppliers());
  }, [dispatch]);

  useEffect(() => {
    // Find the supplier by ID when filters change
    if (filters.supplier_id && suppliers.length > 0) {
      const supplier = suppliers.find((s) => s.id === filters.supplier_id);
      setSelectedSupplier(supplier || null);
    } else {
      setSelectedSupplier(null);
    }

    setFromDate(filters.from_date ? new Date(filters.from_date) : null);
    setToDate(filters.to_date ? new Date(filters.to_date) : null);
    setIsPaid(filters.is_paid);
  }, [filters, suppliers]);

  const handleFilterApply = () => {
    const newFilters = {
      supplier_id: selectedSupplier?.id || null,
      from_date: fromDate ? fromDate.toISOString().split("T")[0] : null,
      to_date: toDate ? toDate.toISOString().split("T")[0] : null,
      is_paid: isPaid,
    };

    dispatch(setFilters(newFilters));
    dispatch(fetchInvoices({ filters: newFilters }));
  };

  const handleFilterClear = () => {
    setSelectedSupplier(null);
    setFromDate(null);
    setToDate(null);
    setIsPaid(null);
    dispatch(clearFilters());
    dispatch(fetchInvoices({ filters: {} }));
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        onClick={toggleExpand}
        sx={{ cursor: "pointer" }}
      >
        <Typography variant="h6" component="div">
          <FilterListIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          Filter Invoices
        </Typography>
        <Button size="small" onClick={toggleExpand}>
          {isExpanded ? "Hide Filters" : "Show Filters"}
        </Button>
      </Box>

      {isExpanded && (
        <Box mt={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Autocomplete
                id="supplier-filter"
                options={suppliers}
                getOptionLabel={(option) => option.company_name || ""}
                value={selectedSupplier}
                onChange={(event, newValue) => {
                  setSelectedSupplier(newValue);
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Supplier" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="From Date"
                  value={fromDate}
                  onChange={(newValue) => {
                    setFromDate(newValue);
                  }}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="To Date"
                  value={toDate}
                  onChange={(newValue) => {
                    setToDate(newValue);
                  }}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isPaid === true}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setIsPaid(true);
                      } else if (isPaid === true) {
                        setIsPaid(null);
                      } else {
                        setIsPaid(false);
                      }
                    }}
                  />
                }
                label={
                  isPaid === null
                    ? "Payment Status (All)"
                    : isPaid
                    ? "Paid"
                    : "Unpaid"
                }
              />
            </Grid>
          </Grid>
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleFilterClear}
              sx={{ mr: 1 }}
            >
              Clear
            </Button>
            <Button
              variant="contained"
              startIcon={<FilterListIcon />}
              onClick={handleFilterApply}
            >
              Apply Filters
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default InvoiceFilter;
