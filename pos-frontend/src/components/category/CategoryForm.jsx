import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormHelperText,
  Typography,
  Alert,
  Chip,
  Stack,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

const CategoryForm = ({
  open,
  onClose,
  formData,
  formMode,
  onInputChange,
  onFileChange,
  onSubmit,
  validationErrors = [],
}) => {
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    setSelectedFile(null);
  }, [open, formMode]);

  const hasFieldError = (fieldName) => {
    return validationErrors.some((error) =>
      error.toLowerCase().includes(fieldName.toLowerCase())
    );
  };

  const getFieldErrorMessage = (fieldName) => {
    const error = validationErrors.find((err) =>
      err.toLowerCase().includes(fieldName.toLowerCase())
    );
    return error || "";
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      onFileChange(e);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    onFileChange({ target: { name: "image", files: null } });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {formMode === "add" ? "Add New Category" : "Edit Category"}
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
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {formMode === "add"
                ? "* Image is required"
                : "Update image (optional)"}
            </Typography>

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
          {formMode === "add" ? "Add Category" : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryForm;
