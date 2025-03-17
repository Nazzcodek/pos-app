import React from "react";
import { Box, Typography, Button } from "@mui/material";
import {
  Add as AddIcon,
  Inventory as InventoryIcon,
} from "@mui/icons-material";

const EmptyInventory = ({ type, onCreateNew }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: 5,
        minHeight: "50vh",
        bgcolor: "background.paper",
        borderRadius: 2,
        boxShadow: 1,
      }}
    >
      <InventoryIcon sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        No {type} inventory found
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        align="center"
        sx={{ mb: 3 }}
      >
        You haven't added any {type} to your inventory yet.
        <br />
        Add a new {type} to get started.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={onCreateNew}
      >
        Add New {type}
      </Button>
    </Box>
  );
};

export default EmptyInventory;
