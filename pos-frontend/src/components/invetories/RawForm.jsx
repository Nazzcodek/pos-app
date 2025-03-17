import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Box,
  IconButton,
  Divider,
  Typography,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { useDispatch, useSelector } from "react-redux";
import {
  createMultipleRawMaterials,
  createRawMaterial,
  updateRawMaterial,
} from "../../redux/slices/inventorySlice";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import dayjs from "dayjs";

const defaultItem = {
  name: "",
  description: "",
  price_per_unit: "",
  quantity: "",
  quantity_unit: "",
  status: "in_stock",
  batch_number: "",
  expiry_date: null,
  supplier_id: null,
  inventory_type: "raw_material",
  critical_threshold: null,
  is_perishable: false,
};

const MultipleRawMaterialsForm = ({
  open,
  onClose,
  onSubmit,
  initialData = null,
  singleMode = false,
  dialogTitle = "Add Multiple Raw Materials",
  buttonText = null,
}) => {
  const [materials, setMaterials] = useState([{ ...defaultItem }]);
  const [errors, setErrors] = useState([{}]);
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.inventory.loading);
  const suppliers = useSelector((state) => state.suppliers?.suppliers || []);
  const suppliersLoading = useSelector((state) => state.suppliers?.loading);

  useEffect(() => {
    // Initialize with initial data if provided
    if (initialData && initialData.length > 0) {
      setMaterials(initialData);
      setErrors(Array(initialData.length).fill({}));
    } else {
      setMaterials([{ ...defaultItem }]);
      setErrors([{}]);
    }
  }, [initialData, open]);

  if (suppliersLoading) {
    return (
      <Dialog open={open}>
        <DialogContent>Loading suppliers...</DialogContent>
      </Dialog>
    );
  }

  const validateForm = () => {
    const newErrors = materials.map((material) => {
      const itemErrors = {};
      if (!material.name?.trim()) itemErrors.name = "Name is required";
      if (!material.quantity) itemErrors.quantity = "Quantity is required";
      if (!material.quantity_unit)
        itemErrors.quantity_unit = "Unit is required";
      if (material.price_per_unit && isNaN(Number(material.price_per_unit))) {
        itemErrors.price_per_unit = "Price must be a number";
      }
      if (
        material.critical_threshold &&
        isNaN(Number(material.critical_threshold))
      ) {
        itemErrors.critical_threshold = "Critical threshold must be a number";
      }
      return itemErrors;
    });

    setErrors(newErrors);
    return newErrors.every((error) => Object.keys(error).length === 0);
  };

  const handleChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const updatedMaterials = [...materials];
    updatedMaterials[index] = {
      ...updatedMaterials[index],
      [name]: type === "checkbox" ? checked : value,
    };
    setMaterials(updatedMaterials);
  };

  const handleDateChange = (index, date) => {
    const updatedMaterials = [...materials];
    updatedMaterials[index] = {
      ...updatedMaterials[index],
      expiry_date: date ? dayjs(date).format("YYYY-MM-DD") : null,
    };
    setMaterials(updatedMaterials);
  };

  const addNewMaterialForm = () => {
    if (!singleMode) {
      setMaterials([...materials, { ...defaultItem }]);
      setErrors([...errors, {}]);
    }
  };

  const removeMaterialForm = (index) => {
    if (materials.length > 1 && !singleMode) {
      const updatedMaterials = [...materials];
      updatedMaterials.splice(index, 1);
      setMaterials(updatedMaterials);

      const updatedErrors = [...errors];
      updatedErrors.splice(index, 1);
      setErrors(updatedErrors);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (singleMode) {
        const material = materials[0];
        if (material.id) {
          // It's an edit
          await dispatch(updateRawMaterial(material)).unwrap();
        } else {
          // It's a single create
          await dispatch(createRawMaterial(material)).unwrap();
        }
      } else {
        // It's a multiple create
        await dispatch(createMultipleRawMaterials(materials)).unwrap();
      }

      if (onSubmit) {
        onSubmit();
      } else {
        onClose();
      }
    } catch (error) {
      console.error("Failed to save raw materials:", error);
    }
  };

  const renderMaterialForm = (material, index) => (
    <Box key={index} sx={{ mt: 2 }}>
      {index > 0 && !singleMode && (
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="subtitle1">Material {index + 1}</Typography>
          <IconButton
            color="error"
            onClick={() => removeMaterialForm(index)}
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )}

      <Grid container spacing={2}>
        {/* Material Name */}
        <Grid item xs={12} md={6}>
          <TextField
            name="name"
            label="Material Name"
            fullWidth
            value={material.name || ""}
            onChange={(e) => handleChange(index, e)}
            error={!!errors[index]?.name}
            helperText={errors[index]?.name}
            required
          />
        </Grid>

        {/* Unit */}
        <Grid item xs={12} md={6}>
          <FormControl
            fullWidth
            error={!!errors[index]?.quantity_unit}
            required
          >
            <InputLabel>Unit</InputLabel>
            <Select
              name="quantity_unit"
              value={material.quantity_unit || ""}
              onChange={(e) => handleChange(index, e)}
              label="Unit"
              fullWidth
            >
              <MenuItem value="kg">Kilogram (kg)</MenuItem>
              <MenuItem value="gram">Gram (g)</MenuItem>
              <MenuItem value="liter">Liter (L)</MenuItem>
              <MenuItem value="milliliter">Milliliter (mL)</MenuItem>
              <MenuItem value="piece">Piece</MenuItem>
              <MenuItem value="count">Count</MenuItem>
            </Select>
            {errors[index]?.quantity_unit && (
              <FormHelperText>{errors[index].quantity_unit}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        {/* Quantity */}
        <Grid item xs={12} md={6}>
          <TextField
            name="quantity"
            label="Quantity"
            type="number"
            fullWidth
            value={material.quantity || ""}
            onChange={(e) => handleChange(index, e)}
            error={!!errors[index]?.quantity}
            helperText={errors[index]?.quantity}
            required
            slotProps={{
              input: { min: 0, step: "0.01" },
            }}
          />
        </Grid>

        {/* Price Per Unit */}
        <Grid item xs={12} md={6}>
          <TextField
            name="price_per_unit"
            label="Price Per Unit"
            type="number"
            fullWidth
            value={material.price_per_unit || ""}
            onChange={(e) => handleChange(index, e)}
            error={!!errors[index]?.price_per_unit}
            helperText={errors[index]?.price_per_unit}
            slotProps={{
              input: { min: 0, step: "0.01" },
            }}
          />
        </Grid>

        {/* Status */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={material.status || "in_stock"}
              onChange={(e) => handleChange(index, e)}
              label="Status"
              fullWidth
            >
              <MenuItem value="in_stock">In Stock</MenuItem>
              <MenuItem value="depleted">Depleted</MenuItem>
              <MenuItem value="damaged">Damaged</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Supplier */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Supplier</InputLabel>
            <Select
              name="supplier_id"
              value={material.supplier_id || ""}
              onChange={(e) => handleChange(index, e)}
              label="Supplier"
              fullWidth
            >
              <MenuItem value="">
                <em>N/A</em>
              </MenuItem>
              {suppliers && suppliers.length > 0 ? (
                suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.company_name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="" disabled>
                  No suppliers available
                </MenuItem>
              )}
            </Select>
          </FormControl>
        </Grid>

        {/* Batch Number */}
        <Grid item xs={12} md={6}>
          <TextField
            name="batch_number"
            label="Batch Number"
            fullWidth
            value={material.batch_number || ""}
            onChange={(e) => handleChange(index, e)}
          />
        </Grid>

        {/* Expiry Date */}
        <Grid item xs={12} md={6}>
          <DatePicker
            label="Expiry Date"
            value={material.expiry_date ? dayjs(material.expiry_date) : null}
            onChange={(date) => handleDateChange(index, date)}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>

        {/* Critical Threshold */}
        <Grid item xs={12} md={6}>
          <TextField
            name="critical_threshold"
            label="Critical Threshold"
            type="number"
            fullWidth
            value={material.critical_threshold || ""}
            onChange={(e) => handleChange(index, e)}
            error={!!errors[index]?.critical_threshold}
            helperText={errors[index]?.critical_threshold}
            slotProps={{
              input: { min: 0, step: "0.01" },
            }}
          />
        </Grid>

        {/* Is Perishable */}
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Checkbox
                name="is_perishable"
                checked={material.is_perishable || false}
                onChange={(e) => handleChange(index, e)}
              />
            }
            label="Is Perishable"
          />
        </Grid>

        {/* Description */}
        <Grid item xs={12}>
          <TextField
            name="description"
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={material.description || ""}
            onChange={(e) => handleChange(index, e)}
          />
        </Grid>
      </Grid>

      {index < materials.length - 1 && <Divider sx={{ my: 3 }} />}
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          {materials.map((material, index) =>
            renderMaterialForm(material, index)
          )}

          {!singleMode && (
            <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addNewMaterialForm}
              >
                Add Another Material
              </Button>
            </Box>
          )}
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : buttonText || `Save ${materials.length} Materials`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MultipleRawMaterialsForm;
