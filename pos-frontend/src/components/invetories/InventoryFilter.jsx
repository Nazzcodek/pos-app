import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  IconButton,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Popover,
  Typography,
  Tooltip,
  Chip,
  Divider,
  InputAdornment,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Add as AddIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

const FilterBar = ({ 
  inventoryType = "raw_material", // 'raw_material' or 'equipment'
  onFilterChange,
  onCreateNew,
  supplierOptions = [],
  initialFilters = {}
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeFilters, setActiveFilters] = useState(initialFilters || {});
  const [searchValue, setSearchValue] = useState(initialFilters?.search_term || "");
  
  // Update local state when initialFilters change
  useEffect(() => {
    setActiveFilters(initialFilters || {});
    setSearchValue(initialFilters?.search_term || "");
  }, [initialFilters]);

  // Define filter configurations based on inventory type
  const getFilters = () => {
    const commonFilters = [
      {
        key: "status_list",
        label: "Status",
        type: "multiSelect",
        options: [
          { value: "IN_STOCK", label: "In Stock" },
          { value: "ISSUED", label: "Issued" },
          { value: "RETURNED", label: "Returned" },
          { value: "DEPLETED", label: "Depleted" },
          { value: "MAINTENANCE", label: "Maintenance" },
          { value: "DAMAGED", label: "Damaged" },
          { value: "EXPIRED", label: "Expired" },
          { value: "DECOMMISSIONED", label: "Decommissioned" },
        ],
      },
      {
        key: "price",
        label: "Price Range",
        type: "range",
        prefix: "₦",
      },
      {
        key: "from_date",
        label: "From Date",
        type: "date",
      },
      {
        key: "to_date",
        label: "To Date",
        type: "date",
      },
    ];

    // Add raw material specific filters
    if (inventoryType === "raw_material") {
      return [
        ...commonFilters,
        {
          key: "quantity",
          label: "Quantity Range",
          type: "range",
        },
        {
          key: "supplier_ids",
          label: "Suppliers",
          type: "multiSelect",
          options: supplierOptions,
        },
      ];
    }

    // Add equipment specific filters
    return [
      ...commonFilters,
      {
        key: "supplier_ids",
        label: "Suppliers",
        type: "multiSelect",
        options: supplierOptions,
      },
    ];
  };

  const filters = getFilters();

  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...activeFilters };
    
    if (value === "" || value === null || value === undefined || 
        (Array.isArray(value) && value.length === 0)) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    
    setActiveFilters(newFilters);
  };

  const handleApplyFilters = () => {
    // Convert any date objects to ISO strings for the API
    const processedFilters = { ...activeFilters };
    
    // Convert dates
    ['from_date', 'to_date'].forEach(key => {
      if (processedFilters[key] && dayjs.isDayjs(processedFilters[key])) {
        processedFilters[key] = processedFilters[key].format('YYYY-MM-DD');
      }
    });
    
    // Handle price range
    if (processedFilters.price_min !== undefined || processedFilters.price_max !== undefined) {
      // These are already set properly
    } else if (processedFilters.price) {
      processedFilters.price_min = processedFilters.price.min;
      processedFilters.price_max = processedFilters.price.max;
      delete processedFilters.price;
    }
    
    // Add search term
    if (searchValue) {
      processedFilters.search_term = searchValue;
    } else {
      delete processedFilters.search_term;
    }
    
    // Set inventory type
    processedFilters.inventory_type = inventoryType.toUpperCase();
    
    onFilterChange(processedFilters);
    handleClose();
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setSearchValue("");
    onFilterChange({ inventory_type: inventoryType.toUpperCase() });
    handleClose();
  };

  const handleRemoveChip = (key) => {
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    setActiveFilters(newFilters);
    onFilterChange({ 
      ...newFilters, 
      inventory_type: inventoryType.toUpperCase() 
    });
  };

  const handleSearch = () => {
    const newFilters = { 
      ...activeFilters,
      search_term: searchValue,
      inventory_type: inventoryType.toUpperCase()
    };
    onFilterChange(newFilters);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const renderFilterControl = (filter) => {
    switch (filter.type) {
      case "multiSelect":
        return (
          <FormControl fullWidth size="small" key={filter.key}>
            <InputLabel id={`filter-${filter.key}-label`}>
              {filter.label}
            </InputLabel>
            <Select
              labelId={`filter-${filter.key}-label`}
              multiple
              value={activeFilters[filter.key] || []}
              label={filter.label}
              renderValue={(selected) => selected.join(', ')}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            >
              {filter.options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case "date":
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs} key={filter.key}>
            <DatePicker
              label={filter.label}
              value={activeFilters[filter.key] || null}
              onChange={(date) => handleFilterChange(filter.key, date)}
              slotProps={{ 
                textField: { 
                  size: "small", 
                  fullWidth: true 
                } 
              }}
            />
          </LocalizationProvider>
        );

      case "range":
        return (
          <Box key={filter.key} sx={{ width: "100%", px: 2 }}>
            <Typography gutterBottom>{filter.label}</Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={5}>
                <TextField
                  label="Min"
                  type="number"
                  size="small"
                  value={
                    activeFilters[`${filter.key}_min`] || 
                    (filter.key === 'price' ? activeFilters.price?.min : activeFilters.quantity?.min) || 
                    ""
                  }
                  onChange={(e) =>
                    handleFilterChange(
                      filter.key === 'price' ? 'price_min' : 'quantity_min', 
                      e.target.value
                    )
                  }
                  InputProps={{
                    startAdornment: filter.prefix ? (
                      <InputAdornment position="start">
                        {filter.prefix}
                      </InputAdornment>
                    ) : null,
                  }}
                />
              </Grid>
              <Grid item xs={2} sx={{ textAlign: "center" }}>
                <Typography>-</Typography>
              </Grid>
              <Grid item xs={5}>
                <TextField
                  label="Max"
                  type="number"
                  size="small"
                  value={
                    activeFilters[`${filter.key}_max`] || 
                    (filter.key === 'price' ? activeFilters.price?.max : activeFilters.quantity?.max) || 
                    ""
                  }
                  onChange={(e) =>
                    handleFilterChange(
                      filter.key === 'price' ? 'price_max' : 'quantity_max', 
                      e.target.value
                    )
                  }
                  InputProps={{
                    startAdornment: filter.prefix ? (
                      <InputAdornment position="start">
                        {filter.prefix}
                      </InputAdornment>
                    ) : null,
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  const open = Boolean(anchorEl);
  
  // Count active filters, excluding specific parameters
  const activeFilterCount = Object.keys(activeFilters)
    .filter(key => 
      key !== 'skip' && 
      key !== 'limit' && 
      key !== 'search_term' &&
      key !== 'inventory_type'
    ).length + (searchValue ? 1 : 0);

  // Format filter display values for chips
  const getFilterDisplayValue = (key, value) => {
    // Handle special cases
    if (key === "status_list") {
      const statusOption = filters.find(f => f.key === "status_list")?.options;
      return value.map(v => 
        statusOption?.find(o => o.value === v)?.label || v
      ).join(", ");
    }
    
    if (key === "supplier_ids") {
      return value.map(v => 
        supplierOptions.find(o => o.value === v)?.label || v
      ).join(", ");
    }
    
    if (key === "from_date" || key === "to_date") {
      return dayjs.isDayjs(value) 
        ? value.format("MM/DD/YYYY") 
        : dayjs(value).format("MM/DD/YYYY");
    }
    
    if (key === "price_min") {
      return `₦${value}`;
    }
    
    if (key === "price_max") {
      return `₦${value}`;
    }
    
    return value;
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder={`Search ${inventoryType === "raw_material" ? "raw materials" : "equipment"}...`}
              size="small"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchValue && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSearchValue("");
                        onFilterChange({ 
                          inventory_type: inventoryType.toUpperCase() 
                        });
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item>
            <Tooltip
              title={activeFilterCount > 0 ? `${activeFilterCount} active filters` : "Filter"}
            >
              <Button
                variant={activeFilterCount > 0 ? "contained" : "outlined"}
                color={activeFilterCount > 0 ? "primary" : "inherit"}
                startIcon={<FilterListIcon />}
                onClick={handleFilterClick}
              >
                Filters
                {activeFilterCount > 0 && (
                  <Box
                    component="span"
                    sx={{
                      ml: 1,
                      borderRadius: "50%",
                      width: 20,
                      height: 20,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "background.paper",
                      color: "primary.main",
                      fontSize: "0.75rem",
                    }}
                  >
                    {activeFilterCount}
                  </Box>
                )}
              </Button>
            </Tooltip>
          </Grid>
          <Grid item sx={{ ml: "auto" }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={onCreateNew}
            >
              Add New
            </Button>
          </Grid>
        </Grid>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
            {/* Display search term chip */}
            {searchValue && (
              <Chip
                key="search_term"
                label={`Search: ${searchValue}`}
                onDelete={() => {
                  setSearchValue("");
                  onFilterChange({ 
                    inventory_type: inventoryType.toUpperCase() 
                  });
                }}
                color="primary"
                variant="outlined"
              />
            )}
            
            {/* Display other filter chips */}
            {Object.entries(activeFilters)
              .filter(([key]) => 
                key !== 'skip' && 
                key !== 'limit' && 
                key !== 'search_term' &&
                key !== 'inventory_type'
              )
              .map(([key, value]) => {
                let label;
                
                // Find the matching filter definition to get its label
                const filter = filters.find(f => f.key === key);
                label = filter?.label || key;
                
                const displayValue = getFilterDisplayValue(key, value);
                
                return (
                  <Chip
                    key={key}
                    label={`${label}: ${displayValue}`}
                    onDelete={() => handleRemoveChip(key)}
                    color="primary"
                    variant="outlined"
                  />
                );
              })}
              
            {/* Clear all filters chip */}
            {activeFilterCount > 0 && (
              <Chip
                label="Clear All"
                onDelete={handleClearFilters}
                deleteIcon={<ClearIcon />}
                color="secondary"
              />
            )}
          </Box>
        )}
      </Paper>

      {/* Filter popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          sx: { width: 400, p: 2, maxHeight: 500, overflow: "auto" },
        }}
      >
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          {filters.map((filter) => (
            <Grid item xs={12} key={filter.key}>
              {renderFilterControl(filter)}
            </Grid>
          ))}
        </Grid>

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleClearFilters}
            startIcon={<ClearIcon />}
          >
            Clear All
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleApplyFilters}
          >
            Apply Filters
          </Button>
        </Box>
      </Popover>
    </Box>
  );
};

export default FilterBar;