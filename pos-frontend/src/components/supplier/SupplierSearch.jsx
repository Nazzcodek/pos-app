import React from "react";
import { Box, TextField, Button } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";

const SupplierSearchBar = ({
  searchTerm,
  onSearchChange,
  onAddNewSupplier,
}) => {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
      <TextField
        label="Search Suppliers"
        variant="outlined"
        fullWidth
        sx={{ mr: 2 }}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={onAddNewSupplier}
      >
        Add Supplier
      </Button>
    </Box>
  );
};

export default SupplierSearchBar;
