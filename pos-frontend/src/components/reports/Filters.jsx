import React from "react";
import Grid from "@mui/material/Grid2";
import {
  MenuItem,
  TextField,
  Button,
  Box,
  Select,
  OutlinedInput,
  Chip,
  FormControl,
  InputLabel,
} from "@mui/material";
import DateRangePicker from "./Pickers";

const SalesReportFilters = ({
  filters,
  onFilterChange,
  onApplyFilters,
  onResetFilters,
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ [name]: value });
  };

  const handleDateRangeChange = (startDate, endDate) => {
    onFilterChange({ startDate, endDate });
  };

  const handleAmountChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ [name]: value === "" ? null : parseFloat(value) });
  };

  const groupByOptions = [
    { value: "product", label: "Product" },
    { value: "category", label: "Category" },
    { value: "user", label: "User" },
    { value: "session", label: "Session" },
  ];

  // Ensure groupBy is always an array
  const groupBy = Array.isArray(filters.groupBy) ? filters.groupBy : [];

  return (
    <Grid container spacing={3}>
      {/* Receipt Number (only for Sales) */}
      {filters.reportType === "sales" && (
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Receipt Number"
            name="receiptNumber"
            value={filters.receiptNumber || ""}
            onChange={handleChange}
            placeholder="Search by receipt #"
          />
        </Grid>
      )}

      {/* Group By (only for Sale Items) */}
      {filters.reportType === "items" && (
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel id="group-by-label">Group By</InputLabel>
            <Select
              labelId="group-by-label"
              multiple
              value={groupBy}
              onChange={(e) => onFilterChange({ groupBy: e.target.value })}
              input={<OutlinedInput label="Group By" />}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip
                      key={value}
                      label={
                        groupByOptions.find((opt) => opt.value === value)?.label
                      }
                      size="small"
                    />
                  ))}
                </Box>
              )}
            >
              {groupByOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      )}

      {/* Date Range Picker */}
      <Grid item xs={12} sm={6}>
        <DateRangePicker
          startDate={filters.startDate}
          endDate={filters.endDate}
          onChange={handleDateRangeChange}
        />
      </Grid>

      {/* Min Amount */}
      <Grid item xs={12} sm={3}>
        <TextField
          fullWidth
          type="number"
          label="Min Amount"
          name="minAmount"
          value={filters.minAmount === null ? "" : filters.minAmount}
          onChange={handleAmountChange}
          inputProps={{ min: 0 }}
        />
      </Grid>

      {/* Max Amount */}
      <Grid item xs={12} sm={3}>
        <TextField
          fullWidth
          type="number"
          label="Max Amount"
          name="maxAmount"
          value={filters.maxAmount === null ? "" : filters.maxAmount}
          onChange={handleAmountChange}
          inputProps={{
            min: filters.minAmount === null ? 0 : filters.minAmount,
          }}
          error={
            filters.maxAmount !== null &&
            filters.minAmount !== null &&
            filters.maxAmount < filters.minAmount
          }
          helperText={
            filters.maxAmount !== null &&
            filters.minAmount !== null &&
            filters.maxAmount < filters.minAmount
              ? "Max amount must be greater than min amount"
              : ""
          }
        />
      </Grid>

      {/* Reset and Apply Filters Buttons */}
      <Grid item xs={12}>
        <Box display="flex" justifyContent="flex-start">
          <Button
            variant="outlined"
            color="secondary"
            onClick={onResetFilters}
            sx={{ mr: 2 }}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#1a3a3a", color: "#fff" }}
            onClick={onApplyFilters}
          >
            Apply Filters
          </Button>
        </Box>
      </Grid>
    </Grid>
  );
};

export default SalesReportFilters;
