import React, { useState, useEffect, useCallback } from "react";
import { Box, Button } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import InventoryTable from "./InventoryTable";
import EmptyInventory from "./Empty";
import { useSelector, useDispatch } from "react-redux";
import EquipmentDetail from "./EquipmentDetails";
import MultipleEquipmentsForm from "./EquipmentForm";
import FilterBar from "./InventoryFilter";
import { fetchEquipments } from "../../redux/slices/inventorySlice";

// Define SingleEquipmentForm component
const SingleEquipmentForm = ({
  open,
  onClose,
  equipment = null,
  isEdit = false,
  onSubmit,
}) => {
  const initialData = equipment ? [equipment] : []; // Use empty array instead of undefined
  const dialogTitle = isEdit ? "Edit Equipment" : "Add Equipment";
  const buttonText = isEdit ? "Update Equipment" : "Save Equipment";

  return (
    <MultipleEquipmentsForm
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

const EquipmentInventory = () => {
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openMultipleCreateModal, setOpenMultipleCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [filters, setFilters] = useState({});
  const currentUser = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  // Load equipments with optional filters
  const loadEquipments = useCallback(
    async (appliedFilters = {}) => {
      setLoading(true);
      try {
        const response = await dispatch(
          fetchEquipments(appliedFilters)
        ).unwrap();

        // Make sure we're setting an array to the equipments state
        if (Array.isArray(response)) {
          setEquipments(response);
        } else if (response && typeof response === "object") {
          // If response is an object with items property
          setEquipments(response.items || []);
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
              setEquipments(dataSource);
              break;
            }
          }

          // If none of the common patterns match, set empty array
          if (equipments.length === 0) {
            console.error("Could not find data array in response:", response);
            setEquipments([]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch equipments:", error);
        setEquipments([]);
      } finally {
        setLoading(false);
      }
    },
    [dispatch, equipments.length]
  );

  // Fetch data on component mount
  useEffect(() => {
    loadEquipments(filters);
  }, [loadEquipments, filters]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters); // Update the filters state
  };

  // Handle row click to show details
  const handleRowClick = (equipment) => {
    setSelectedEquipment(equipment);
    setOpenDetailModal(true);
  };

  // Handle create new equipment
  const handleCreateNew = () => {
    setOpenCreateModal(true);
  };

  // Handle create multiple equipments
  const handleCreateMultiple = () => {
    setOpenMultipleCreateModal(true);
  };

  // Handle edit action
  const handleEdit = (equipment) => {
    setSelectedEquipment(equipment);
    setOpenEditModal(true);
  };

  // Handle form submission (create/edit)
  const handleFormSubmit = () => {
    setOpenCreateModal(false);
    setOpenEditModal(false);
    setOpenMultipleCreateModal(false);
    loadEquipments(filters); // Refresh data with current filters
  };

  // Check if the user is authorized (manager or admin)
  const isAuthorized = ["manager", "admin"].includes(currentUser?.role);

  return (
    <Box sx={{ width: "100%" }}>
      {/* Filter Bar */}
      <FilterBar
        inventoryType="equipment"
        onFilterChange={handleFilterChange}
        onCreateNew={isAuthorized ? handleCreateNew : undefined}
        initialFilters={filters}
      />

      {/* Conditionally render "Add Multiple Items" button when inventory is not empty */}
      {equipments.length > 0 && (
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
      {equipments.length === 0 && !loading ? (
        <EmptyInventory type="equipment" onCreateNew={handleCreateNew} />
      ) : (
        <InventoryTable
          inventoryType="equipment"
          data={equipments}
          loading={loading}
          onRowClick={handleRowClick}
          onEdit={isAuthorized ? handleEdit : undefined}
          filters={filters}
          onRefresh={() => loadEquipments(filters)}
        />
      )}

      {/* Equipment detail modal */}
      <EquipmentDetail
        open={openDetailModal && selectedEquipment !== null}
        onClose={() => setOpenDetailModal(false)}
        equipment={selectedEquipment || {}}
        onEdit={() => {
          setOpenDetailModal(false);
          setOpenEditModal(true);
        }}
        canEdit={isAuthorized}
      />

      {/* Create new equipment modal */}
      <SingleEquipmentForm
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Create multiple equipments modal */}
      <MultipleEquipmentsForm
        open={openMultipleCreateModal}
        onClose={() => setOpenMultipleCreateModal(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Edit equipment modal */}
      <SingleEquipmentForm
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        onSubmit={handleFormSubmit}
        equipment={selectedEquipment}
        isEdit={true}
      />
    </Box>
  );
};

export default EquipmentInventory;
