import React from "react";
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
  Switch,
  CircularProgress,
  Typography,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";

const SuppliersTable = ({
  suppliers,
  loading,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  // Helper function to parse items_supplied
  const parseItemsSupplied = (items) => {
    try {
      if (typeof items === "string") {
        const parsedItems = JSON.parse(items);
        return parsedItems
          .map((item) => (typeof item === "object" ? item.name : item))
          .join(", ");
      }
      if (Array.isArray(items)) {
        return items
          .map((item) => (typeof item === "object" ? item.name : item))
          .join(", ");
      }
      return "N/A";
    } catch {
      return "N/A";
    }
  };

  if (loading) {
    return (
      <Paper
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 4,
        }}
      >
        <CircularProgress />
      </Paper>
    );
  }

  if (!suppliers || suppliers.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6">No suppliers found</Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Company Name</TableCell>
            <TableCell>Contact Person</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Phone Number</TableCell>
            <TableCell>Items Supplied</TableCell>
            <TableCell>Enabled</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow key={supplier.id} hover sx={{ cursor: "pointer" }}>
              <TableCell onClick={() => onView(supplier)}>
                {supplier.company_name}
              </TableCell>
              <TableCell onClick={() => onView(supplier)}>
                {supplier.contact_person}
              </TableCell>
              <TableCell onClick={() => onView(supplier)}>
                {supplier.email || "N/A"}
              </TableCell>
              <TableCell onClick={() => onView(supplier)}>
                {supplier.phone_number}
              </TableCell>
              <TableCell onClick={() => onView(supplier)}>
                {parseItemsSupplied(supplier.items_supplied)}
              </TableCell>
              <TableCell>
                <Switch
                  checked={supplier.is_enabled}
                  onChange={() => onToggleStatus(supplier.id)}
                  color="primary"
                />
              </TableCell>
              <TableCell>
                <Tooltip title="View">
                  <IconButton onClick={() => onView(supplier)}>
                    <ViewIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton onClick={() => onEdit(supplier)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton onClick={() => onDelete(supplier.id)}>
                    <DeleteIcon color="error" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SuppliersTable;
