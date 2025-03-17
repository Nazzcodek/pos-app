import React from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import SupplierForm from "./SupplierForm";

const SupplierModal = ({ open, onClose, initialData, isEditing }) => {
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
        <SupplierForm
          initialData={initialData}
          isEditing={isEditing}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default SupplierModal;
