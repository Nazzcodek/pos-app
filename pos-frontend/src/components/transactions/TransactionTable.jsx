import React, { useState } from "react";
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
  Chip,
  TablePagination,
  CircularProgress,
  Box,
  Typography,
  TextField,
  InputAdornment,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import AutorenewIcon from "@mui/icons-material/Autorenew";

const TransactionTable = ({
  transactions,
  loading,
  onEdit,
  onDelete,
  onView,
  columns,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case "ISSUE":
        return "default";
      case "RESTOCK":
        return "primary";
      case "RETURN":
        return "secondary";
      case "DAMAGE":
        return "error";
      case "WRITE_OFF":
        return "warning";
      case "MAINTENANCE":
        return "info";
      default:
        return "default";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const searchFields = [
      transaction.inventory_name,
      transaction.transaction_type,
      transaction.notes,
      transaction.created_by,
      transaction.updated_by,
      transaction.department,
    ];

    return searchFields.some(
      (field) =>
        field &&
        field.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const paginatedTransactions = filteredTransactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (transactions.length === 0) {
    return (
      <Box sx={{ p: 5, textAlign: "center" }}>
        <Typography variant="h6">No transactions found</Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          size="small"
        />
      </Box>
      <TableContainer
        component={Paper}
        sx={{ maxHeight: "calc(100vh - 300px)" }}
      >
        <Table stickyHeader aria-label="transactions table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  style={{ minWidth: column.minWidth, fontWeight: "bold" }}
                >
                  {column.label}
                </TableCell>
              ))}
              <TableCell style={{ minWidth: 120, fontWeight: "bold" }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTransactions.map((transaction) => (
              <TableRow
                hover
                key={transaction.id}
                onClick={() => onView(transaction)}
                sx={{ cursor: "pointer" }}
              >
                {columns.map((column) => {
                  const value = transaction[column.id];

                  if (column.id === "transaction_type") {
                    return (
                      <TableCell key={column.id}>
                        <Chip
                          label={transaction.transaction_type}
                          color={getTransactionTypeColor(
                            transaction.transaction_type
                          )}
                          size="small"
                        />
                      </TableCell>
                    );
                  }

                  if (column.id === "transaction_date") {
                    return (
                      <TableCell key={column.id}>
                        {formatDate(transaction.transaction_date)}
                      </TableCell>
                    );
                  }

                  if (column.id === "created_by") {
                    return (
                      <TableCell key={column.id}>
                        {transaction.created_by || ""}
                      </TableCell>
                    );
                  }

                  if (column.id === "updated_by") {
                    return (
                      <TableCell key={column.id}>
                        {transaction.updated_by || ""}
                      </TableCell>
                    );
                  }

                  if (column.id === "is_locked") {
                    return (
                      <TableCell key={column.id}>
                        {transaction.is_locked ? (
                          <Tooltip title="Locked">
                            <LockIcon color="error" fontSize="small" />
                          </Tooltip>
                        ) : (
                          <Tooltip title="Unlocked">
                            <LockOpenIcon color="success" fontSize="small" />
                          </Tooltip>
                        )}
                      </TableCell>
                    );
                  }

                  if (column.id === "is_system_generated") {
                    return (
                      <TableCell key={column.id}>
                        {transaction.is_system_generated ? (
                          <Tooltip title="System Generated">
                            <AutorenewIcon color="info" fontSize="small" />
                          </Tooltip>
                        ) : (
                          "No"
                        )}
                      </TableCell>
                    );
                  }

                  return (
                    <TableCell key={column.id}>
                      {column.render ? column.render(transaction) : value}
                    </TableCell>
                  );
                })}

                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(transaction);
                      }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      color="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(transaction);
                      }}
                      disabled={transaction.is_locked}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(transaction.id);
                      }}
                      disabled={transaction.is_locked}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredTransactions.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default TransactionTable;
