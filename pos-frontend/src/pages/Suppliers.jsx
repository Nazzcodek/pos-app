import React, { useState, useEffect } from "react";
import { Container, Box, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import SupplierSearchBar from "../components/supplier/SupplierSearch";
import SuppliersTable from "../components/supplier/SupplierTable";
import SupplierActionButtons from "../components/supplier/SupplierAction";
import SupplierModal from "../components/supplier/SupplierModal";
import SupplierErrorHandler from "../components/supplier/SupplierError";

import {
  fetchSuppliers,
  removeSupplier,
  fetchSupplierById,
  clearSelectedSupplier,
  toggleSupplierStatus,
} from "../redux/slices/supplierSlice";

const SupplierManagementPage = () => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Destructure suppliers directly from the state
  const {
    suppliers = [],
    loading = false,
    error = null,
    selectedSupplier,
  } = useSelector((state) => state.suppliers || {});

  // Client-side filtering
  const filteredSuppliers = searchTerm
    ? suppliers.filter((supplier) => {
        const companyNameMatch = supplier.company_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

        let itemsSuppliedMatch = false;
        try {
          const parsedItems = supplier.items_supplied
            ? JSON.parse(supplier.items_supplied)
            : [];

          itemsSuppliedMatch = parsedItems.some((item) =>
            item.toLowerCase().includes(searchTerm.toLowerCase())
          );
        } catch {
          itemsSuppliedMatch = false;
        }

        return companyNameMatch || itemsSuppliedMatch;
      })
    : suppliers;

  // Initial data fetch
  useEffect(() => {
    dispatch(fetchSuppliers({}));
  }, [dispatch]);

  // View supplier details
  const handleView = (supplier) => {
    dispatch(fetchSupplierById(supplier.id));
    setIsEditing(false);
    setOpenModal(true);
  };

  // Edit supplier
  const handleEdit = (supplier) => {
    dispatch(fetchSupplierById(supplier.id));
    setIsEditing(true);
    setOpenModal(true);
  };

  // Delete supplier
  const handleDelete = (supplierId) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      dispatch(removeSupplier(supplierId));
    }
  };

  // Toggle supplier status
  const handleToggleStatus = (supplierId) => {
    dispatch(toggleSupplierStatus(supplierId));
  };

  // Close modal and reset state
  const handleCloseModal = () => {
    setOpenModal(false);
    dispatch(clearSelectedSupplier());
    setIsEditing(false);
  };

  // Open modal for adding new supplier
  const handleAddNewSupplier = () => {
    dispatch(clearSelectedSupplier());
    setIsEditing(false);
    setOpenModal(true);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Supplier Management
        </Typography>

        <SupplierSearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddNewSupplier={handleAddNewSupplier}
        />

        <SupplierActionButtons suppliers={filteredSuppliers} />

        <SuppliersTable
          suppliers={filteredSuppliers}
          loading={loading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />

        <SupplierModal
          open={openModal}
          onClose={handleCloseModal}
          initialData={selectedSupplier}
          isEditing={isEditing} // Optional - component will use internal state if this is undefined
        />

        <SupplierErrorHandler error={error} />
      </Box>
    </Container>
  );
};

export default SupplierManagementPage;
