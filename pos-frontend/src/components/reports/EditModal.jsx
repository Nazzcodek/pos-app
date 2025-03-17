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
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Paper,
  Divider,
} from "@mui/material";
import { Add, Remove, Delete } from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { updateSale, fetchSaleDetails } from "../../redux/slices/salesSlice";

const EditSaleModal = ({ open, onClose, saleId }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saleData, setSaleData] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (open && saleId) {
      setLoading(true);
      setError(null);

      dispatch(fetchSaleDetails(saleId))
        .unwrap()
        .then((data) => {
          setSaleData(data);
          setItems(
            data.items.map((item) => ({
              product_id: item.product.id,
              product_name: item.product.name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              original_quantity: item.quantity,
            }))
          );
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || "Failed to load sale details");
          setLoading(false);
        });
    }
  }, [open, saleId, dispatch]);

  const handleUpdateQuantity = (index, newQuantity) => {
    if (newQuantity < 0) return;

    const updatedItems = [...items];
    const item = updatedItems[index];
    item.quantity = newQuantity;
    item.total_price = item.unit_price * newQuantity;
    setItems(updatedItems);
  };

  const handleRemoveItem = (index) => {
    const updatedItems = [...items];
    updatedItems[index].quantity = 0;
    setItems(updatedItems);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Prepare data in the format expected by the API
      const updateData = {
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      };

      await dispatch(updateSale({ saleId, saleData: updateData })).unwrap();
      onClose(true); // Close with success flag
    } catch (error) {
      setError(error.message || "Failed to update sale");
    } finally {
      setSaving(false);
    }
  };

  const calculateTotal = () => {
    return items
      .reduce((sum, item) => sum + Number(item.total_price), 0)
      .toFixed(2);
  };

  if (loading) {
    return (
      <Dialog
        open={open}
        onClose={() => onClose(false)}
        maxWidth="md"
        fullWidth
      >
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
      <Dialog
        open={open}
        onClose={() => onClose(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <Typography color="error" align="center">
            {error}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        Edit Sale
        <Typography variant="subtitle2" color="text.secondary">
          Receipt: {saleData?.receipt_number}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box mb={3}>
          <Typography variant="subtitle1">Sale Information</Typography>
          <Box display="flex" flexWrap="wrap" gap={2} mt={1}>
            <TextField
              label="Date & Time"
              value={new Date(saleData?.timestamp).toLocaleString()}
              InputProps={{ readOnly: true }}
              size="small"
              variant="outlined"
            />
            <TextField
              label="Username"
              value={saleData?.user?.username || "N/A"}
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
        <Typography variant="body2" color="text.secondary" mb={2}>
          You can only modify quantities or remove items. To add new items,
          please create a new sale.
        </Typography>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="center">Quantity</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items
                .filter((item) => item.quantity > 0)
                .map((item, index) => (
                  <TableRow key={item.product_id}>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell align="right">
                      ₦{Number(item.unit_price).toFixed(2)}
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleUpdateQuantity(index, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                        >
                          <Remove fontSize="small" />
                        </IconButton>
                        <TextField
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            handleUpdateQuantity(index, val);
                          }}
                          InputProps={{
                            inputProps: {
                              min: 1,
                              style: { textAlign: "center" },
                            },
                          }}
                          variant="outlined"
                          size="small"
                          type="number"
                          sx={{ width: 60, mx: 1 }}
                        />
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleUpdateQuantity(index, item.quantity + 1)
                          }
                        >
                          <Add fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      ₦{Number(item.total_price).toFixed(2)}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveItem(index)}
                        color="error"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              {items.filter((item) => item.quantity > 0).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary" py={2}>
                      All items have been removed. Please add at least one item
                      or cancel.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box display="flex" justifyContent="flex-end" mt={2}>
          <Typography variant="h6">Total: ₦{calculateTotal()}</Typography>
        </Box>

        {items.some((item) => item.quantity !== item.original_quantity) && (
          <Box
            mt={2}
            p={2}
            bgcolor="primary.light"
            color="primary.contrastText"
            borderRadius={1}
          >
            <Typography variant="body2">
              Changes detected. The receipt will be updated with the new
              quantities and totals.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={
            saving ||
            items.filter((item) => item.quantity > 0).length === 0 ||
            !items.some((item) => item.quantity !== item.original_quantity)
          }
        >
          {saving ? <CircularProgress size={24} /> : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditSaleModal;
