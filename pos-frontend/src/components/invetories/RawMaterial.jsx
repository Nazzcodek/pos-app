import React, { useState, useEffect, useCallback } from "react";
import { Box, Button } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import InventoryTable from "./InventoryTable";
import EmptyInventory from "./Empty";
import { useSelector, useDispatch } from "react-redux";
import RawMaterialDetail from "./RawDetails";
import MultipleRawMaterialsForm from "./RawForm";
import FilterBar from "./InventoryFilter";
import { fetchRawMaterials } from "../../redux/slices/inventorySlice";

// Define SingleMaterialForm component
const SingleMaterialForm = ({
  open,
  onClose,
  material = null,
  isEdit = false,
  onSubmit,
}) => {
  const initialData = material ? [material] : []; // Use empty array instead of undefined
  const dialogTitle = isEdit ? "Edit Raw Material" : "Add Raw Material";
  const buttonText = isEdit ? "Update Material" : "Save Material";

  return (
    <MultipleRawMaterialsForm
      open={open}
      onClose={onClose}
      initialData={initialData}
      onSubmit={onSubmit}
      singleMode={true}
      dialogTitle={dialogTitle}
      buttonText={buttonText}
    />
  );
};

const RawMaterialInventory = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openMultipleCreateModal, setOpenMultipleCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [filters, setFilters] = useState({});
  const currentUser = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  // Load materials with optional filters
  const loadMaterials = useCallback(
    async (appliedFilters = {}) => {
      setLoading(true);
      try {
        const response = await dispatch(
          fetchRawMaterials(appliedFilters)
        ).unwrap();

        // Make sure we're setting an array to the materials state
        if (Array.isArray(response)) {
          setMaterials(response);
        } else if (response && typeof response === "object") {
          // If response is an object with items property
          setMaterials(response.items || []);
        } else {
          // If response structure is different, check for other common patterns
          const possibleDataArrays = [
            response,
            response?.items,
            response?.results,
            response?.content,
          ];

          for (const dataSource of possibleDataArrays) {
            if (Array.isArray(dataSource)) {
              setMaterials(dataSource);
              break;
            }
          }

          // If none of the common patterns match, set empty array
          if (materials.length === 0) {
            console.error("Could not find data array in response:", response);
            setMaterials([]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch raw materials:", error);
        setMaterials([]);
      } finally {
        setLoading(false);
      }
    },
    [dispatch, materials.length]
  );

  // Fetch data on component mount
  useEffect(() => {
    loadMaterials(filters);
  }, [loadMaterials, filters]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters); // Update the filters state
  };

  // Handle row click to show details
  const handleRowClick = (material) => {
    setSelectedMaterial(material);
    setOpenDetailModal(true);
  };

  // Handle create new material
  const handleCreateNew = () => {
    setOpenCreateModal(true);
  };

  // Handle create multiple materials
  const handleCreateMultiple = () => {
    setOpenMultipleCreateModal(true);
  };

  // Handle edit action
  const handleEdit = (material) => {
    setSelectedMaterial(material);
    setOpenEditModal(true);
  };

  // Handle form submission (create/edit)
  const handleFormSubmit = () => {
    setOpenCreateModal(false);
    setOpenEditModal(false);
    setOpenMultipleCreateModal(false);
    loadMaterials(filters); // Refresh data with current filters
  };

  // Check if the user is authorized (manager or admin)
  const isAuthorized = ["manager", "admin"].includes(currentUser?.role);

  return (
    <Box sx={{ width: "100%" }}>
      {/* Filter Bar */}
      <FilterBar
        inventoryType="rawMaterial"
        onFilterChange={handleFilterChange}
        onCreateNew={isAuthorized ? handleCreateNew : undefined}
        initialFilters={filters}
      />

      {/* Conditionally render "Add Multiple Items" button when inventory is not empty */}
      {materials.length > 0 && (
        <Box sx={{ mt: 2, mb: 2, display: "flex", justifyContent: "flex-end" }}>
          {isAuthorized && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleCreateMultiple}
              sx={{ ml: 2 }}
            >
              Add Multiple Items
            </Button>
          )}
        </Box>
      )}

      {/* Conditionally render table or empty state */}
      {materials.length === 0 && !loading ? (
        <EmptyInventory type="raw materials" onCreateNew={handleCreateNew} />
      ) : (
        <InventoryTable
          inventoryType="raw_material"
          data={materials}
          loading={loading}
          onRowClick={handleRowClick}
          onEdit={isAuthorized ? handleEdit : undefined}
          filters={filters}
          onRefresh={() => loadMaterials(filters)}
        />
      )}

      {/* Material detail modal */}
      <RawMaterialDetail
        open={openDetailModal && selectedMaterial !== null}
        onClose={() => setOpenDetailModal(false)}
        material={selectedMaterial || {}}
        onEdit={() => {
          setOpenDetailModal(false);
          setOpenEditModal(true);
        }}
        canEdit={isAuthorized}
      />

      {/* Create new material modal */}
      <SingleMaterialForm
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Create multiple materials modal */}
      <MultipleRawMaterialsForm
        open={openMultipleCreateModal}
        onClose={() => setOpenMultipleCreateModal(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Edit material modal */}
      <SingleMaterialForm
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        onSubmit={handleFormSubmit}
        material={selectedMaterial}
        isEdit={true}
      />
    </Box>
  );
};

export default RawMaterialInventory;
