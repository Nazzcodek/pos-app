import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import SupplierForm from "./SupplierForm";
import SupplierDetails from "./SupplierDetail";

const SupplierModal = ({
  open,
  onClose,
  initialData,
  isEditing: initialIsEditing = false,
}) => {
  // Local state to track editing mode
  const [isEditing, setIsEditing] = useState(initialIsEditing);

  // Reset editing state when modal closes or changes supplier
  React.useEffect(() => {
    setIsEditing(initialIsEditing);
  }, [open, initialData, initialIsEditing]);

  // Handle edit button click
  const handleEditClick = () => {
    setIsEditing(true);
  };

  // Handle form close (could be cancel or submit)
  const handleFormClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {initialData
          ? isEditing
            ? "Edit Supplier"
            : "Supplier Details"
          : "Add New Supplier"}
      </DialogTitle>
      <DialogContent>
        {initialData && !isEditing ? (
          // Show read-only details when viewing an existing supplier
          <>
            <SupplierDetails supplierData={initialData} />
            <DialogActions>
              <Button variant="outlined" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleEditClick}
              >
                Edit Supplier
              </Button>
            </DialogActions>
          </>
        ) : (
          // Show editable form when adding a new supplier or editing
          <SupplierForm
            initialData={initialData}
            isEditing={!!initialData} // Form should be in edit mode if we have initialData
            onClose={handleFormClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SupplierModal;
