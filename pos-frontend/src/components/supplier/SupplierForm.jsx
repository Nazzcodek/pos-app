import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useDispatch, useSelector } from "react-redux";
import { useSnackbar } from "notistack";
import {
  addSupplier,
  editSupplier,
  clearError,
} from "../../redux/slices/supplierSlice";

const SupplierForm = ({ initialData, isEditing, onClose }) => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const { error, loading } = useSelector((state) => state.suppliers || {});

  const [formData, setFormData] = useState({
    company_name: "",
    contact_person: "",
    email: "",
    website: "",
    phone_number: "",
    address: "",
    items_supplied: [],
  });

  const [itemInput, setItemInput] = useState("");
  const [errors, setErrors] = useState({});
  const [openErrorSnackbar, setOpenErrorSnackbar] = useState(false);
  const [wasSubmitted, setWasSubmitted] = useState(false);

  // Normalize website by adding http:// or https:// prefix
  const normalizeWebsite = (website) => {
    if (!website) return "";

    // Remove any existing http:// or https:// prefix
    const cleanWebsite = website.replace(/^https?:\/\//, "");

    // Check if it looks like a valid domain
    const domainRegex = /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
    if (domainRegex.test(cleanWebsite)) {
      return `https://${cleanWebsite}`;
    }

    return website;
  };

  // Initialize form with existing data when editing
  useEffect(() => {
    if (initialData) {
      // Parse items_supplied if it's a string
      const parsedItemsSupplied = initialData.items_supplied
        ? typeof initialData.items_supplied === "string"
          ? JSON.parse(initialData.items_supplied)
          : initialData.items_supplied
        : [];

      setFormData({
        ...initialData,
        items_supplied: parsedItemsSupplied.map((item) =>
          typeof item === "string" ? { name: item } : item
        ),
        website: initialData.website
          ? normalizeWebsite(initialData.website)
          : "",
      });
    }
  }, [initialData]);

  // Close form after successful submission
  useEffect(() => {
    if (wasSubmitted && !loading && !error) {
      enqueueSnackbar(
        isEditing
          ? "Supplier updated successfully!"
          : "Supplier created successfully!",
        { variant: "success" }
      );
      onClose();
    }
  }, [wasSubmitted, loading, error, onClose, enqueueSnackbar, isEditing]);

  // Handle global error state
  useEffect(() => {
    if (error) {
      setOpenErrorSnackbar(true);
    }
  }, [error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Special handling for website
    if (name === "website") {
      processedValue = normalizeWebsite(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleAddItem = () => {
    if (itemInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        items_supplied: [...prev.items_supplied, { name: itemInput.trim() }],
      }));
      setItemInput("");
    }
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items_supplied: prev.items_supplied.filter((_, i) => i !== index),
    }));
  };

  const handleCloseErrorSnackbar = () => {
    setOpenErrorSnackbar(false);
    dispatch(clearError());
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate required fields
    if (!formData.company_name)
      newErrors.company_name = "Company Name is required";
    if (!formData.contact_person)
      newErrors.contact_person = "Contact Person is required";
    if (!formData.phone_number)
      newErrors.phone_number = "Phone Number is required";

    // Email validation (optional field)
    if (formData.email && !formData.email.includes("@")) {
      newErrors.email = "Please enter a valid email address";
    }

    // Website validation (optional field)
    if (formData.website) {
      try {
        new URL(formData.website);
      } catch {
        newErrors.website =
          "Please enter a valid URL (http:// or https:// will be added automatically)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return; // Stop submission if validation fails
    }

    const submitData = {
      ...formData,
      // Ensure items_supplied is in the correct format
      items_supplied: formData.items_supplied.map((item) =>
        typeof item === "string" ? { name: item } : item
      ),
      // Remove empty string for optional fields
      email: formData.email || null,
      website: formData.website || null,
      address: formData.address || null,
    };

    setWasSubmitted(true);

    if (isEditing) {
      dispatch(
        editSupplier({
          supplierId: initialData.id,
          updateData: submitData,
        })
      );
    } else {
      dispatch(addSupplier(submitData));
    }
  };

  return (
    <>
      <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid xs={12} md={6}>
            <TextField
              fullWidth
              label="Company Name"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              required
              error={!!errors.company_name}
              helperText={errors.company_name}
            />
          </Grid>
          <Grid xs={12} md={6}>
            <TextField
              fullWidth
              label="Contact Person"
              name="contact_person"
              value={formData.contact_person}
              onChange={handleChange}
              required
              error={!!errors.contact_person}
              helperText={errors.contact_person}
            />
          </Grid>
          <Grid xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
            />
          </Grid>
          <Grid xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone Number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              required
              error={!!errors.phone_number}
              helperText={errors.phone_number}
            />
          </Grid>
          <Grid xs={12} md={6}>
            <TextField
              fullWidth
              label="Website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              error={!!errors.website}
              helperText={
                errors.website || "Will automatically add https:// if needed"
              }
              placeholder="example.com"
            />
          </Grid>
          <Grid xs={12}>
            <TextField
              fullWidth
              label="Address"
              name="address"
              multiline
              rows={2}
              value={formData.address}
              onChange={handleChange}
            />
          </Grid>
          <Grid xs={12}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <TextField
                fullWidth
                label="Items Supplied"
                value={itemInput}
                onChange={(e) => setItemInput(e.target.value)}
                sx={{ mr: 1 }}
              />
              <Button
                variant="contained"
                onClick={handleAddItem}
                disabled={!itemInput.trim()}
              >
                Add Item
              </Button>
            </Box>
            {formData.items_supplied.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Current Items:</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {formData.items_supplied.map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        bgcolor: "grey.200",
                        borderRadius: 1,
                        px: 1,
                        py: 0.5,
                      }}
                    >
                      <Typography variant="body2">
                        {item.name || item}
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => handleRemoveItem(index)}
                        sx={{ ml: 1, minWidth: 0, p: 0 }}
                      >
                        ×
                      </Button>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Grid>
          <Grid xs={12}>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="outlined"
                sx={{ mr: 1 }}
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading
                  ? isEditing
                    ? "Updating..."
                    : "Creating..."
                  : isEditing
                  ? "Update Supplier"
                  : "Create Supplier"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Snackbar
        open={openErrorSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseErrorSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseErrorSnackbar}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error || "An unknown error occurred"}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SupplierForm;
