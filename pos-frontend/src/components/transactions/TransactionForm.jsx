import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createTransaction,
  updateTransaction,
  fetchRawMaterials,
  fetchEquipments,
  fetchDepartments,
} from "../../redux/slices/inventorySlice";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  FormHelperText,
  Autocomplete,
  CircularProgress,
  Typography,
  Box,
} from "@mui/material";

const initialFormState = {
  inventory_id: "",
  transaction_type: "",
  quantity: "",
  department_id: "",
  notes: "",
  previous_quantity: "",
  resulting_quantity: "",
};

const TransactionForm = ({ open, onClose, transaction, isEditMode }) => {
  const dispatch = useDispatch();
  const { loading, rawMaterials, equipment, departments } = useSelector(
    (state) => state.inventory
  );
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [selectedInventory, setSelectedInventory] = useState(null);

  useEffect(() => {
    dispatch(fetchRawMaterials());
    dispatch(fetchEquipments());
    dispatch(fetchDepartments());
  }, [dispatch]);

  useEffect(() => {
    if (isEditMode && transaction) {
      // Transform transaction_type to uppercase for the select component
      const transactionType = transaction.transaction_type
        ? transaction.transaction_type.toUpperCase()
        : "";

      setFormData({
        inventory_id: transaction.inventory_id || "",
        transaction_type: transactionType,
        quantity: transaction.quantity || "",
        department_id: transaction.department_id || "",
        notes: transaction.notes || "",
        previous_quantity: transaction.previous_quantity || "",
        resulting_quantity: transaction.resulting_quantity || "",
      });

      // Find and set the selected inventory
      const combinedInventory = [...rawMaterials, ...equipment];
      const inv = combinedInventory.find(
        (i) => i.id === transaction.inventory_id
      );
      setSelectedInventory(inv || null);
    } else {
      setFormData(initialFormState);
      setSelectedInventory(null);
    }
  }, [isEditMode, transaction, open, rawMaterials, equipment]);

  // Calculate resulting quantity whenever transaction type, quantity, or selected inventory changes
  useEffect(() => {
    if (selectedInventory && formData.transaction_type && formData.quantity) {
      const quantity = parseFloat(formData.quantity);
      const prevQuantity =
        selectedInventory.quantity || selectedInventory.available_units || 0;

      let resultingQuantity = prevQuantity;

      switch (formData.transaction_type) {
        case "ISSUE":
        case "DAMAGE":
        case "WRITE_OFF":
          resultingQuantity = prevQuantity - quantity;
          break;
        case "RESTOCK":
        case "RETURN":
          resultingQuantity = prevQuantity + quantity;
          break;
        default:
          break;
      }

      setFormData((prev) => ({
        ...prev,
        previous_quantity: prevQuantity,
        resulting_quantity: resultingQuantity >= 0 ? resultingQuantity : 0,
      }));
    }
  }, [formData.transaction_type, formData.quantity, selectedInventory]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.inventory_id) {
      newErrors.inventory_id = "Inventory is required";
    }

    if (!formData.transaction_type) {
      newErrors.transaction_type = "Transaction type is required";
    }

    if (!formData.quantity) {
      newErrors.quantity = "Quantity is required";
    } else if (
      isNaN(Number(formData.quantity)) ||
      Number(formData.quantity) <= 0
    ) {
      newErrors.quantity = "Quantity must be a positive number";
    }

    if (!formData.department_id) {
      newErrors.department_id = "Department is required";
    }

    // Check if resulting quantity would be negative
    if (formData.resulting_quantity < 0) {
      newErrors.quantity = "Transaction would result in negative inventory";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleInventoryChange = (event, value) => {
    setSelectedInventory(value);
    setFormData({
      ...formData,
      inventory_id: value ? value.id : "",
      previous_quantity: value
        ? value.quantity || value.available_units || 0
        : "",
      resulting_quantity: "", // Will be calculated when transaction type and quantity are set
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const payload = {
      ...formData,
      transaction_type: formData.transaction_type.toLowerCase(),
      quantity: parseFloat(formData.quantity),
      previous_quantity: parseFloat(formData.previous_quantity),
      resulting_quantity: parseFloat(formData.resulting_quantity),
    };

    console.log("payload", payload);

    if (isEditMode && transaction) {
      await dispatch(
        updateTransaction({
          transactionId: transaction.id,
          transactionData: payload,
        })
      );
    } else {
      await dispatch(createTransaction(payload));
    }

    onClose();
  };

  const combinedInventory = [...rawMaterials, ...equipment];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">
        {isEditMode ? "Edit Transaction" : "Create Transaction"}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={combinedInventory}
              getOptionLabel={(option) => option.name}
              value={selectedInventory}
              onChange={handleInventoryChange}
              disabled={isEditMode}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label="Inventory"
                  variant="outlined"
                  error={!!errors.inventory_id}
                  helperText={errors.inventory_id}
                  required
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl
              fullWidth
              variant="outlined"
              error={!!errors.transaction_type}
              required
            >
              <InputLabel id="transaction-type-label">
                Transaction Type
              </InputLabel>
              <Select
                labelId="transaction-type-label"
                id="transaction_type"
                name="transaction_type"
                value={formData.transaction_type}
                onChange={handleInputChange}
                label="Transaction Type"
              >
                <MenuItem value="ISSUE">Issue</MenuItem>
                <MenuItem value="RESTOCK">Restock</MenuItem>
                <MenuItem value="RETURN">Return</MenuItem>
                <MenuItem value="DAMAGE">Damage</MenuItem>
                <MenuItem value="WRITE_OFF">Write Off</MenuItem>
                <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
              </Select>
              {errors.transaction_type && (
                <FormHelperText>{errors.transaction_type}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Quantity"
              variant="outlined"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleInputChange}
              error={!!errors.quantity}
              helperText={errors.quantity}
              required
              inputProps={{ min: "0.01", step: "0.01" }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl
              fullWidth
              variant="outlined"
              error={!!errors.department_id}
              required
            >
              <InputLabel id="department-label">Department</InputLabel>
              <Select
                labelId="department-label"
                id="department_id"
                name="department_id"
                value={formData.department_id}
                onChange={handleInputChange}
                label="Department"
              >
                {departments.map((department) => (
                  <MenuItem key={department.id} value={department.id}>
                    {department.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.department_id && (
                <FormHelperText>{errors.department_id}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Previous Quantity
              </Typography>
              <Typography variant="body1">
                {formData.previous_quantity}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Resulting Quantity
              </Typography>
              <Typography variant="body1">
                {formData.resulting_quantity}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              variant="outlined"
              name="notes"
              multiline
              rows={3}
              value={formData.notes}
              onChange={handleInputChange}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : isEditMode ? (
            "Update"
          ) : (
            "Create"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionForm;
