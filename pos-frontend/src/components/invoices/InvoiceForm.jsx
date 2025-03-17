import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addInvoice, editInvoice } from "../../redux/slices/invoiceSlice";
import { fetchSuppliers } from "../../redux/slices/supplierSlice";
import {
  fetchRawMaterials,
  fetchEquipments,
} from "../../redux/slices/inventorySlice";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  FormHelperText,
  Divider,
  Typography,
  IconButton,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import dayjs from "dayjs";

const InvoiceFormModal = ({ open, onClose, editData }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.invoices);
  const { suppliers } = useSelector((state) => state.suppliers);
  const { rawMaterials, equipments } = useSelector((state) => state.inventory);

  // State for combined inventory items
  const [combinedInventory, setCombinedInventory] = useState([]);

  // Separate state for calculations to avoid infinite loops
  const [calculations, setCalculations] = useState({
    subtotal: 0,
    tax_amount: 0,
    total_amount: 0,
  });

  // Fetch suppliers, raw materials, and equipment when the component mounts
  useEffect(() => {
    dispatch(fetchSuppliers({ skip: 0, limit: 100 }));
    dispatch(fetchRawMaterials({ skip: 0, limit: 100 }));
    dispatch(fetchEquipments({ skip: 0, limit: 100 }));
  }, [dispatch]);

  // Form state
  const [formData, setFormData] = useState({
    invoice_number: "",
    supplier_id: "",
    invoice_date: dayjs(),
    due_date: dayjs().add(30, "day"),
    status: "draft",
    notes: "",
    items: [
      {
        description: "",
        quantity: 1,
        unit_price: 0,
        total: 0,
        inventory_id: "",
        quantity_unit: "piece",
      },
    ],
    tax_rate: 0,
  });

  // Form validation
  const [errors, setErrors] = useState({});

  // Combine raw materials and equipments with a source identifier
  useEffect(() => {
    const rawWithSource = (rawMaterials || []).map((item) => ({
      ...item,
      source: "raw_material",
    }));

    const equipWithSource = (equipments || []).map((item) => ({
      ...item,
      source: "equipment",
    }));

    setCombinedInventory([...rawWithSource, ...equipWithSource]);
  }, [rawMaterials, equipments]);

  // Set edit data if provided
  useEffect(() => {
    if (editData) {
      let items = [
        {
          description: "",
          quantity: 1,
          unit_price: 0,
          total: 0,
          inventory_id: "",
          quantity_unit: "piece",
        },
      ];

      if (editData.inventory_items && editData.inventory_items.length > 0) {
        items = editData.inventory_items.map((item) => ({
          description: item.inventory ? item.inventory.name : "",
          quantity: item.quantity || 0,
          unit_price: item.unit_price || 0,
          total: (item.quantity || 0) * (item.unit_price || 0),
          inventory_id: item.inventory_id || "",
          quantity_unit: item.quantity_unit || "piece",
        }));
      } else if (editData.items && editData.items.length > 0) {
        items = editData.items.map((item) => ({
          ...item,
          quantity: Number(item.quantity) || 0,
          unit_price: Number(item.unit_price) || 0,
          total: (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
        }));
      }

      const newFormData = {
        ...editData,
        items: items,
        invoice_date: editData.invoice_date
          ? dayjs(editData.invoice_date)
          : dayjs(),
        due_date: editData.due_date
          ? dayjs(editData.due_date)
          : dayjs().add(30, "day"),
        tax_rate: editData.tax_rate || 0,
      };

      setFormData(newFormData);
    } else {
      // Reset form for new invoice
      setFormData({
        invoice_number: "",
        supplier_id: "",
        invoice_date: dayjs(),
        due_date: dayjs().add(30, "day"),
        status: "draft",
        notes: "",
        items: [
          {
            description: "",
            quantity: 1,
            unit_price: 0,
            total: 0,
            inventory_id: "",
            quantity_unit: "piece",
          },
        ],
        tax_rate: 0,
      });
    }

    // Clear errors
    setErrors({});
  }, [editData, open]);

  // Calculate totals when items or tax rate changes - FIXED VERSION
  useEffect(() => {
    // Calculate item totals first
    const updatedItems = formData.items.map((item) => ({
      ...item,
      total: (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    }));

    // Only update the items if totals changed to avoid unnecessary renders
    const itemsChanged = updatedItems.some(
      (item, idx) => item.total !== formData.items[idx].total
    );

    if (itemsChanged) {
      setFormData((prev) => ({
        ...prev,
        items: updatedItems,
      }));
    }

    // Calculate invoice totals
    const subtotal = updatedItems.reduce(
      (sum, item) => sum + (Number(item.total) || 0),
      0
    );
    const taxAmount = subtotal * (Number(formData.tax_rate) / 100);
    const totalAmount = subtotal + taxAmount;

    // Store calculations in separate state
    setCalculations({
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
    });
  }, [formData.items, formData.tax_rate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];

    if (field === "inventory_id") {
      const selectedItem = combinedInventory.find((item) => item.id === value);
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
        description: selectedItem
          ? selectedItem.name
          : updatedItems[index].description,
      };
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        [field]:
          field === "quantity" || field === "unit_price"
            ? Number(value)
            : value,
      };
    }

    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: "",
          quantity: 1,
          unit_price: 0,
          total: 0,
          inventory_id: "",
          quantity_unit: "piece",
        },
      ],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const updatedItems = [...formData.items];
      updatedItems.splice(index, 1);
      setFormData((prev) => ({ ...prev, items: updatedItems }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.invoice_number)
      newErrors.invoice_number = "Invoice number is required";
    if (!formData.supplier_id) newErrors.supplier_id = "Supplier is required";
    if (!formData.invoice_date)
      newErrors.invoice_date = "Invoice date is required";
    if (!formData.due_date) newErrors.due_date = "Due date is required";

    formData.items.forEach((item, index) => {
      if (!item.description) {
        newErrors[`items[${index}].description`] = "Description is required";
      }
      if (item.quantity <= 0) {
        newErrors[`items[${index}].quantity`] =
          "Quantity must be greater than 0";
      }
      if (item.unit_price < 0) {
        newErrors[`items[${index}].unit_price`] = "Price cannot be negative";
      }
      if (!item.inventory_id) {
        newErrors[`items[${index}].inventory_id`] =
          "Inventory item is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const inventory_items = formData.items.map((item) => {
      const selectedItem = combinedInventory.find(
        (inv) => inv.id === item.inventory_id
      );
      const inventory_type = selectedItem ? selectedItem.source : null;

      return {
        quantity: item.quantity,
        quantity_unit: item.quantity_unit,
        unit_price: item.unit_price,
        inventory_id: item.inventory_id,
        inventory_type: inventory_type,
      };
    });

    const payload = {
      invoice_number: formData.invoice_number,
      invoice_date: formData.invoice_date
        ? formData.invoice_date.format("YYYY-MM-DD")
        : null,
      due_date: formData.due_date
        ? formData.due_date.format("YYYY-MM-DD")
        : null,
      total_amount: calculations.total_amount,
      subtotal: calculations.subtotal,
      tax_rate: formData.tax_rate,
      tax_amount: calculations.tax_amount,
      is_paid: formData.status === "paid",
      status: formData.status,
      supplier_id: formData.supplier_id,
      notes: formData.notes,
      inventory_items: inventory_items,
    };

    if (editData) {
      dispatch(editInvoice({ invoiceId: editData.id, updateData: payload }))
        .unwrap()
        .then(() => onClose())
        .catch((error) => console.error("Failed to update invoice:", error));
    } else {
      dispatch(addInvoice(payload))
        .unwrap()
        .then(() => onClose())
        .catch((error) => console.error("Failed to create invoice:", error));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="invoice-form-dialog-title"
    >
      <DialogTitle id="invoice-form-dialog-title">
        {editData ? "Edit Invoice" : "Create New Invoice"}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={3}>
            {/* Invoice Header */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Invoice Number"
                name="invoice_number"
                value={formData.invoice_number}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                error={!!errors.invoice_number}
                helperText={errors.invoice_number}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
                margin="normal"
                error={!!errors.supplier_id}
                required
              >
                <InputLabel id="supplier-label">Supplier</InputLabel>
                <Select
                  labelId="supplier-label"
                  name="supplier_id"
                  value={formData.supplier_id}
                  onChange={handleInputChange}
                  label="Supplier"
                >
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.company_name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.supplier_id && (
                  <FormHelperText>{errors.supplier_id}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label="Invoice Date"
                value={formData.invoice_date}
                onChange={(date) =>
                  setFormData((prev) => ({ ...prev, invoice_date: date }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    margin="normal"
                    required
                    error={!!errors.invoice_date}
                    helperText={errors.invoice_date}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label="Due Date"
                value={formData.due_date}
                onChange={(date) =>
                  setFormData((prev) => ({ ...prev, due_date: date }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    margin="normal"
                    required
                    error={!!errors.due_date}
                    helperText={errors.due_date}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  label="Status"
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="sent">Sent</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Line Items */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Line Items
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {formData.items.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={5}>
                    <FormControl
                      fullWidth
                      error={!!errors[`items[${index}].inventory_id`]}
                    >
                      <InputLabel>Inventory Item</InputLabel>
                      <Select
                        value={item.inventory_id || ""}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "inventory_id",
                            e.target.value
                          )
                        }
                        label="Inventory Item"
                      >
                        {combinedInventory.map((invItem) => (
                          <MenuItem key={invItem.id} value={invItem.id}>
                            {invItem.name} (
                            {invItem.source === "raw_material"
                              ? "Raw"
                              : "Equipment"}
                            )
                          </MenuItem>
                        ))}
                      </Select>
                      {errors[`items[${index}].inventory_id`] && (
                        <FormHelperText>
                          {errors[`items[${index}].inventory_id`]}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={2}>
                    <TextField
                      label="Description"
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(index, "description", e.target.value)
                      }
                      fullWidth
                      error={!!errors[`items[${index}].description`]}
                      helperText={errors[`items[${index}].description`]}
                    />
                  </Grid>

                  <Grid item xs={4} sm={1}>
                    <TextField
                      label="Quantity"
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, "quantity", e.target.value)
                      }
                      fullWidth
                      error={!!errors[`items[${index}].quantity`]}
                      helperText={errors[`items[${index}].quantity`]}
                    />
                  </Grid>

                  <Grid item xs={4} sm={1}>
                    <FormControl fullWidth>
                      <InputLabel>Unit</InputLabel>
                      <Select
                        value={item.quantity_unit}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "quantity_unit",
                            e.target.value
                          )
                        }
                        label="Unit"
                      >
                        <MenuItem value="kg">kg</MenuItem>
                        <MenuItem value="gram">gram</MenuItem>
                        <MenuItem value="liter">liter</MenuItem>
                        <MenuItem value="milliliter">milliliter</MenuItem>
                        <MenuItem value="piece">piece</MenuItem>
                        <MenuItem value="count">count</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={5} sm={1}>
                    <TextField
                      label="Unit Price"
                      type="number"
                      value={item.unit_price}
                      onChange={(e) =>
                        handleItemChange(index, "unit_price", e.target.value)
                      }
                      fullWidth
                      error={!!errors[`items[${index}].unit_price`]}
                      helperText={errors[`items[${index}].unit_price`]}
                    />
                  </Grid>

                  <Grid item xs={3} sm={1}>
                    <Box display="flex" alignItems="center" height="100%">
                      <Typography>₦{(item.total || 0).toFixed(2)}</Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={1}>
                    <Box display="flex" alignItems="center" height="100%">
                      <IconButton
                        color="error"
                        onClick={() => removeItem(index)}
                        disabled={formData.items.length <= 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
              ))}

              <Button
                startIcon={<AddIcon />}
                onClick={addItem}
                variant="outlined"
                sx={{ mt: 1 }}
              >
                Add Item
              </Button>
            </Grid>

            {/* Totals */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Invoice Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    fullWidth
                    multiline
                    rows={4}
                    margin="normal"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box
                    sx={{ p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body1">Subtotal:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1" align="right">
                          ₦{(calculations.subtotal || 0).toFixed(2)}
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <TextField
                          label="Tax Rate (%)"
                          name="tax_rate"
                          type="number"
                          value={formData.tax_rate}
                          onChange={handleInputChange}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1" align="right">
                          ₦{(calculations.tax_amount || 0).toFixed(2)}
                        </Typography>
                      </Grid>

                      <Grid item xs={12}>
                        <Divider />
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="h6">Total:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="h6" align="right">
                          ₦{(calculations.total_amount || 0).toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : editData ? (
            "Update Invoice"
          ) : (
            "Create Invoice"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceFormModal;
