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
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import API_URL from "../common/envCall";

const ProductTable = ({ products = [], onEdit, onDelete, onToggleEnabled }) => {
  return (
    <TableContainer component={Paper} elevation={2}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Image</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Category</TableCell>
            <TableCell align="center">Actions</TableCell>
            <TableCell align="center">Enabled</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <img
                  src={`${API_URL}/${product.image}`}
                  alt={product.name}
                  width="50"
                  height="50"
                />
              </TableCell>
              <TableCell sx={{ textTransform: "capitalize" }}>
                {product.name}
              </TableCell>
              <TableCell>{product.description}</TableCell>
              <TableCell>{product.price}</TableCell>
              <TableCell sx={{ textTransform: "capitalize" }}>
                {product.category ? product.category.name : "No Category"}
              </TableCell>
              <TableCell align="center">
                <Tooltip title="Edit Product">
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={() => onEdit(product)}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Product">
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => onDelete(product.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
              <TableCell align="center">
                <Switch
                  checked={product.is_enabled}
                  onChange={() => onToggleEnabled(product.id)}
                  color="primary"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ProductTable;
