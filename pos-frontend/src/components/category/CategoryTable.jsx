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

const CategoryTable = ({
  categories = [],
  onEdit,
  onDelete,
  onToggleEnabled,
}) => {
  return (
    <TableContainer component={Paper} elevation={2}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Image</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Description</TableCell>
            <TableCell align="center">Actions</TableCell>
            <TableCell align="center">Enabled</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell>
                <img
                  src={`${API_URL}/${category.image}`}
                  alt={category.name}
                  width="50"
                  height="50"
                />
              </TableCell>
              <TableCell sx={{ textTransform: "capitalize" }}>
                {category.name}
              </TableCell>
              <TableCell>{category.description}</TableCell>
              <TableCell align="center">
                <Tooltip title="Edit Category">
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={() => onEdit(category)}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Category">
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => onDelete(category.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
              <TableCell align="center">
                <Switch
                  checked={category.is_enabled}
                  onChange={() => onToggleEnabled(category.id)}
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

export default CategoryTable;
