import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Typography,
  Alert,
  Chip,
  Stack,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

const ProductForm = ({
  open,
  onClose,
  formData,
  formMode,
  onInputChange,
  onFileChange,
  onSubmit,
  categories,
  validationErrors = [],
}) => {
  const [selectedFile, setSelectedFile] = useState(null);

  // Reset the selected file when the form closes or mode changes
  useEffect(() => {
    setSelectedFile(null);
  }, [open, formMode]);

  // Helper function to check if a field has error
  const hasFieldError = (fieldName) => {
    return validationErrors.some((error) =>
      error.toLowerCase().includes(fieldName.toLowerCase())
    );
  };

  // Helper function to get error message for a specific field
  const getFieldErrorMessage = (fieldName) => {
    const error = validationErrors.find((err) =>
      err.toLowerCase().includes(fieldName.toLowerCase())
    );
    return error || "";
  };

  // Custom file input handler to track the selected file
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      onFileChange(e); // Call the parent handler too
    }
  };

  // Function to remove the selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    // Reset the file input by creating a new event
    onFileChange({ target: { files: null, name: "image" } });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {formMode === "add" ? "Add New Product" : "Edit Product"}
      </DialogTitle>
      <DialogContent>
        {validationErrors.length > 0 && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            Please fix the validation errors
          </Alert>
        )}
        <Box component="form" sx={{ mt: 2 }}>
          <TextField
            margin="dense"
            name="name"
            label="Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name || ""}
            onChange={onInputChange}
            required={formMode === "add"}
            error={hasFieldError("name")}
            helperText={
              hasFieldError("name") ? getFieldErrorMessage("name") : ""
            }
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.description || ""}
            onChange={onInputChange}
            required={formMode === "add"}
            error={hasFieldError("description")}
            helperText={
              hasFieldError("description")
                ? getFieldErrorMessage("description")
                : ""
            }
          />
          <TextField
            margin="dense"
            name="price"
            label="Price"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.price || ""}
            onChange={onInputChange}
            required={formMode === "add"}
            inputProps={{ min: 0, step: "0.01" }}
            error={hasFieldError("price")}
            helperText={
              hasFieldError("price") ? getFieldErrorMessage("price") : ""
            }
          />
          <FormControl
            fullWidth
            margin="dense"
            error={hasFieldError("category")}
          >
            <InputLabel id="category-select-label">Category</InputLabel>
            <Select
              labelId="category-select-label"
              name="category_id"
              value={formData.category_id || ""}
              label="Category"
              onChange={onInputChange}
              required={formMode === "add"}
              displayEmpty={false}
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
            {hasFieldError("category") && (
              <FormHelperText>
                {getFieldErrorMessage("category")}
              </FormHelperText>
            )}
          </FormControl>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {formMode === "add"
                ? "* Image is required"
                : "Update image (optional)"}
            </Typography>

            {/* Show the file chip if a file is selected */}
            {selectedFile && (
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Chip
                  label={selectedFile.name}
                  onDelete={handleRemoveFile}
                  deleteIcon={<CloseIcon />}
                  variant="outlined"
                  color="primary"
                />
              </Stack>
            )}

            <Button
              variant="contained"
              component="label"
              sx={{ backgroundColor: "#1a3a3a", color: "#fff" }}
              fullWidth
            >
              {selectedFile ? "Change Image" : "Upload Image"}
              <input
                type="file"
                hidden
                name="image"
                onChange={handleFileChange}
                accept="image/*"
              />
            </Button>
            {hasFieldError("image") && (
              <FormHelperText error>
                {getFieldErrorMessage("image")}
              </FormHelperText>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          sx={{ backgroundColor: "#1a3a3a", color: "#fff" }}
        >
          {formMode === "add" ? "Add Product" : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductForm;
