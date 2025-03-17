import React, { useEffect, useState } from "react";
import {
  Typography,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Box,
  Chip,
  TablePagination,
} from "@mui/material";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { fetchInventoryTransactions } from "../../redux/slices/inventorySlice";

const InventoryTransactions = ({ inventoryId }) => {
  const dispatch = useDispatch();
  const { transactions, transactionsLoading } = useSelector(
    (state) => state.inventory
  );

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    if (inventoryId) {
      dispatch(fetchInventoryTransactions(inventoryId));
    }
  }, [dispatch, inventoryId]); // Remove transactionsLoading dependency

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case "addition":
        return "success";
      case "removal":
        return "error";
      case "adjustment":
        return "warning";
      case "transfer":
        return "info";
      default:
        return "default";
    }
  };

  const formatTransactionType = (type) => {
    return type?.replace(/_/g, " ");
  };

  if (transactionsLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Transaction History
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary" align="center">
          No transaction records found
        </Typography>
      </Paper>
    );
  }

  // Get current page transactions
  const currentTransactions = transactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Transaction History
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Transaction Type</TableCell>
              <TableCell>Updated By</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  {dayjs(transaction.date).format("MMM DD, YYYY HH:mm")}
                </TableCell>
                <TableCell>{transaction.department || "N/A"}</TableCell>
                <TableCell>{transaction.quantity}</TableCell>
                <TableCell>
                  <Chip
                    label={formatTransactionType(transaction.transaction_type)}
                    color={getTransactionTypeColor(
                      transaction.transaction_type
                    )}
                    size="small"
                    sx={{ textTransform: "capitalize" }}
                  />
                </TableCell>
                <TableCell>{transaction.created_by}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination component */}
      <TablePagination
        component="div"
        count={transactions.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
        sx={{ mt: 1 }}
      />
    </Paper>
  );
};

export default InventoryTransactions;
