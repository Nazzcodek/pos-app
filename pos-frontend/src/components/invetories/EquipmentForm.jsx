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
  Box,
  IconButton,
  Divider,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { useDispatch, useSelector } from "react-redux";
import {
  createMultipleEquipments,
  createEquipment,
  updateEquipment,
} from "../../redux/slices/inventorySlice";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import dayjs from "dayjs";

const defaultItem = {
  name: "",
  description: "",
  price_per_unit: "",
  total_units: "",
  available_units: "",
  status: "in_stock",
  maintenance_schedule: null,
  last_maintained: null,
  maintenance_threshold_hours: null,
  supplier_id: null,
  inventory_type: "equipment",
};

const MultipleEquipmentForm = ({
  open,
  onClose,
  onSubmit,
  initialData = null,
  singleMode = false,
  dialogTitle = "Add Multiple Equipments",
  buttonText = null,
}) => {
  const [equipments, setEquipments] = useState([{ ...defaultItem }]);
  const [errors, setErrors] = useState([{}]);
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.inventory.loading);

  const suppliers = useSelector((state) => state.suppliers?.suppliers || []);
  const suppliersLoading = useSelector((state) => state.suppliers?.loading);

  useEffect(() => {
    // Initialize with initial data if provided
    if (initialData && initialData.length > 0) {
      setEquipments(initialData);
      setErrors(Array(initialData.length).fill({}));
    } else {
      setEquipments([{ ...defaultItem }]);
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
    const newErrors = equipments.map((equipment) => {
      const itemErrors = {};
      if (!equipment.name?.trim()) itemErrors.name = "Name is required";
      if (!equipment.total_units)
        itemErrors.total_units = "Total units is required";
      if (!equipment.available_units)
        itemErrors.available_units = "Available units is required";
      if (equipment.price_per_unit && isNaN(Number(equipment.price_per_unit))) {
        itemErrors.price_per_unit = "Price must be a number";
      }
      if (
        equipment.maintenance_threshold_hours &&
        isNaN(Number(equipment.maintenance_threshold_hours))
      ) {
        itemErrors.maintenance_threshold_hours =
          "Maintenance threshold must be a number";
      }
      return itemErrors;
    });

    setErrors(newErrors);
    return newErrors.every((error) => Object.keys(error).length === 0);
  };

  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const updatedEquipments = [...equipments];
    updatedEquipments[index] = {
      ...updatedEquipments[index],
      [name]: value,
    };
    setEquipments(updatedEquipments);
  };

  const handleDateChange = (index, date, field) => {
    const updatedEquipments = [...equipments];
    updatedEquipments[index] = {
      ...updatedEquipments[index],
      [field]: date ? dayjs(date).format("YYYY-MM-DD") : null,
    };
    setEquipments(updatedEquipments);
  };

  const addNewEquipmentForm = () => {
    if (!singleMode) {
      setEquipments([...equipments, { ...defaultItem }]);
      setErrors([...errors, {}]);
    }
  };

  const removeEquipmentForm = (index) => {
    if (equipments.length > 1 && !singleMode) {
      const updatedEquipments = [...equipments];
      updatedEquipments.splice(index, 1);
      setEquipments(updatedEquipments);

      const updatedErrors = [...errors];
      updatedErrors.splice(index, 1);
      setErrors(updatedErrors);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (singleMode) {
        const equipment = equipments[0];
        if (equipment.id) {
          // It's an edit
          await dispatch(updateEquipment(equipment)).unwrap();
        } else {
          // It's a single create
          await dispatch(createEquipment(equipment)).unwrap();
        }
      } else {
        // It's a multiple create
        await dispatch(createMultipleEquipments(equipments)).unwrap();
      }

      if (onSubmit) {
        onSubmit();
      } else {
        onClose();
      }
    } catch (error) {
      console.error("Failed to save equipments:", error);
    }
  };

  const renderEquipmentForm = (equipment, index) => (
    <Box key={index} sx={{ mt: 2 }}>
      {index > 0 && !singleMode && (
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="subtitle1">Equipment {index + 1}</Typography>
          <IconButton
            color="error"
            onClick={() => removeEquipmentForm(index)}
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            name="name"
            label="Equipment Name"
            fullWidth
            value={equipment.name || ""}
            onChange={(e) => handleChange(index, e)}
            error={!!errors[index]?.name}
            helperText={errors[index]?.name}
            required
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            name="total_units"
            label="Total Units"
            type="number"
            fullWidth
            value={equipment.total_units || ""}
            onChange={(e) => handleChange(index, e)}
            error={!!errors[index]?.total_units}
            helperText={errors[index]?.total_units}
            required
            slotProps={{
              input: { min: 0, step: "1" },
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            name="available_units"
            label="Available Units"
            type="number"
            fullWidth
            value={equipment.available_units || ""}
            onChange={(e) => handleChange(index, e)}
            error={!!errors[index]?.available_units}
            helperText={errors[index]?.available_units}
            required
            slotProps={{
              input: { min: 0, step: "1" },
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            name="price_per_unit"
            label="Price Per Unit"
            type="number"
            fullWidth
            value={equipment.price_per_unit || ""}
            onChange={(e) => handleChange(index, e)}
            error={!!errors[index]?.price_per_unit}
            helperText={errors[index]?.price_per_unit}
            slotProps={{
              input: { min: 0, step: "0.01" },
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={equipment.status || "in_stock"}
              onChange={(e) => handleChange(index, e)}
              label="Status"
            >
              <MenuItem value="in_stock">In Stock</MenuItem>
              <MenuItem value="depleted">Depleted</MenuItem>
              <MenuItem value="damaged">Damaged</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
              <MenuItem value="decommissioned">Decommissioned</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Supplier</InputLabel>
            <Select
              name="supplier_id"
              value={equipment.supplier_id || ""}
              onChange={(e) => handleChange(index, e)}
              label="Supplier"
            >
              <MenuItem value="">
                <em>N/A</em>
              </MenuItem>
              {suppliers?.length > 0 ? (
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

        <Grid item xs={12} md={6}>
          <DatePicker
            label="Maintenance Schedule"
            value={
              equipment.maintenance_schedule
                ? dayjs(equipment.maintenance_schedule)
                : null
            }
            onChange={(date) =>
              handleDateChange(index, date, "maintenance_schedule")
            }
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <DatePicker
            label="Last Maintained"
            value={
              equipment.last_maintained
                ? dayjs(equipment.last_maintained)
                : null
            }
            onChange={(date) =>
              handleDateChange(index, date, "last_maintained")
            }
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            name="maintenance_threshold_hours"
            label="Maintenance Threshold (Hours)"
            type="number"
            fullWidth
            value={equipment.maintenance_threshold_hours || ""}
            onChange={(e) => handleChange(index, e)}
            error={!!errors[index]?.maintenance_threshold_hours}
            helperText={errors[index]?.maintenance_threshold_hours}
            slotProps={{
              input: { min: 0, step: "1" },
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            name="description"
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={equipment.description || ""}
            onChange={(e) => handleChange(index, e)}
          />
        </Grid>
      </Grid>

      {index < equipments.length - 1 && <Divider sx={{ my: 3 }} />}
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          {equipments.map((equipment, index) =>
            renderEquipmentForm(equipment, index)
          )}

          {!singleMode && (
            <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addNewEquipmentForm}
              >
                Add Another Equipment
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
            : buttonText || `Save ${equipments.length} Equipments`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MultipleEquipmentForm;
