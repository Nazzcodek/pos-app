import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  CircularProgress,
  Paper,
  Divider,
} from "@mui/material";
import { Print } from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { fetchSaleDetails } from "../../redux/slices/salesSlice";

const SaleDetailsModal = ({ open, onClose, saleId, onPrint, isPrinting }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saleData, setSaleData] = useState(null);

  useEffect(() => {
    if (open && saleId) {
      setLoading(true);
      setError(null);

      dispatch(fetchSaleDetails(saleId))
        .unwrap()
        .then((data) => {
          setSaleData(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || "Failed to load sale details");
          setLoading(false);
        });
    }
  }, [open, saleId, dispatch]);

  const calculateTotal = () => {
    if (!saleData || !saleData.items) return "0.00";
    return saleData.items
      .reduce((sum, item) => sum + Number(item.total_price), 0)
      .toFixed(2);
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            py={4}
          >
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Typography color="error" align="center">
            {error}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (!saleData) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">Transaction Details</Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Receipt: {saleData.receipt_number}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box mb={3}>
          <Typography variant="subtitle1">Sale Information</Typography>
          <Box display="flex" flexWrap="wrap" gap={2} mt={1}>
            <TextField
              label="Date & Time"
              value={new Date(saleData.timestamp).toLocaleString()}
              InputProps={{ readOnly: true }}
              size="small"
              variant="outlined"
            />
            <TextField
              label="Username"
              value={saleData.user?.username || "N/A"}
              InputProps={{ readOnly: true }}
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" mb={2}>
          Items
        </Typography>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="center">Quantity</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {saleData.items.map((item) => (
                <TableRow key={item.product.id}>
                  <TableCell>{item.product.name}</TableCell>
                  <TableCell align="right">
                    ₦{Number(item.unit_price).toFixed(2)}
                  </TableCell>
                  <TableCell align="center">{item.quantity}</TableCell>
                  <TableCell align="right">
                    ₦{Number(item.total_price).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box display="flex" justifyContent="flex-end" mt={2}>
          <Typography variant="h6">Total: ₦{calculateTotal()}</Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} sx={{ color: "#2d3748" }}>
          Close
        </Button>
        <Button
          onClick={onPrint}
          variant="contained"
          sx={{ bgcolor: "#2d3748", color: "#fff" }}
          disabled={isPrinting}
          startIcon={isPrinting ? <CircularProgress size={20} /> : <Print />}
        >
          {isPrinting ? "Printing..." : "Print Receipt"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaleDetailsModal;
