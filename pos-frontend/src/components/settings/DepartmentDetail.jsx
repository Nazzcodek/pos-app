import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  IconButton,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../../redux/slices/inventorySlice";

const DepartmentDetail = () => {
  const dispatch = useDispatch();
  const departments = useSelector((state) => state.inventory.departments);
  const [isAdding, setIsAdding] = useState(false);
  const [newDepartment, setNewDepartment] = useState({
    name: "",
    description: "",
  });
  const [editingDepartment, setEditingDepartment] = useState(null);

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  const handleAddClick = () => {
    setIsAdding(true);
  };

  const handleSaveClick = async () => {
    if (editingDepartment) {
      await dispatch(
        updateDepartment({
          id: editingDepartment.id,
          departmentData: newDepartment,
        })
      );
    } else {
      await dispatch(createDepartment(newDepartment));
    }

    // Refresh the departments list after the operation completes
    await dispatch(fetchDepartments());

    setIsAdding(false);
    setEditingDepartment(null);
    setNewDepartment({ name: "", description: "" });
  };

  const handleEditClick = (department) => {
    setEditingDepartment(department);
    setNewDepartment({
      name: department.name,
      description: department.description,
    });
    setIsAdding(true);
  };

  const handleDeleteClick = async (id) => {
    await dispatch(deleteDepartment(id));
    // Refresh the departments list after deletion
    await dispatch(fetchDepartments());
  };

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Departments
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={handleAddClick}
        >
          Add Department
        </Button>
      </Box>
      {isAdding && (
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Name"
            value={newDepartment.name}
            onChange={(e) =>
              setNewDepartment({ ...newDepartment, name: e.target.value })
            }
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Description"
            value={newDepartment.description}
            onChange={(e) =>
              setNewDepartment({
                ...newDepartment,
                description: e.target.value,
              })
            }
            fullWidth
            sx={{ mb: 2 }}
          />
          <Button variant="contained" color="primary" onClick={handleSaveClick}>
            Save
          </Button>
        </Box>
      )}
      {departments.map((department) => (
        <Box
          key={department.id}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="body1">{department.name}</Typography>
          <Box>
            <IconButton
              color="primary"
              onClick={() => handleEditClick(department)}
            >
              <Edit />
            </IconButton>
            <IconButton
              color="secondary"
              onClick={() => handleDeleteClick(department.id)}
            >
              <Delete />
            </IconButton>
          </Box>
        </Box>
      ))}
    </Paper>
  );
};

export default DepartmentDetail;
