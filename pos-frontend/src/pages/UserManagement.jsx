import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Box, Button, Typography, Container } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import UserTable from "../components/users/UserTable";
import UserForm from "../components/users/UserForm";
import {
  fetchUsers,
  createUser,
  editUser,
  removeUser,
  toggleUserEnabled,
} from "../redux/slices/userSlice";
import Loader from "../components/common/Loader";

const UserManagement = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((state) => state.users);
  const [open, setOpen] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    role: "",
    password: "",
  });
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleClickOpen = () => {
    setFormMode("add");
    setFormData({
      first_name: "",
      last_name: "",
      username: "",
      email: "",
      role: "",
      password: "",
    });
    setOpen(true);
  };

  const handleEditOpen = (user) => {
    setFormMode("edit");
    setCurrentUserId(user.id);
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      email: user.email,
      role: user.role,
      password: "",
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = () => {
    if (formMode === "add") {
      dispatch(createUser(formData))
        .unwrap()
        .then(() => {
          dispatch(fetchUsers());
        });
    } else {
      const dataToUpdate = Object.entries(formData)
        .filter(([_, value]) => value !== "")
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

      dispatch(editUser({ id: currentUserId, userData: dataToUpdate }))
        .unwrap()
        .then(() => {
          dispatch(fetchUsers());
        });
    }
    handleClose();
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      dispatch(removeUser(id))
        .unwrap()
        .then(() => {
          dispatch(fetchUsers());
        });
    }
  };

  const handleToggleEnabled = (id) => {
    dispatch(toggleUserEnabled(id))
      .unwrap()
      .then(() => {
        dispatch(fetchUsers());
      });
  };

  if (loading)
    return (
      <Typography>
        <Loader />
        Loading users...
      </Typography>
    );
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <Container maxWidth="lg">
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <Typography variant="h4" component="h1">
            User Management
          </Typography>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#1a3a3a", color: "#fff" }}
            startIcon={<AddIcon />}
            onClick={handleClickOpen}
          >
            Add User
          </Button>
        </Box>

        <UserTable
          users={users}
          onEdit={handleEditOpen}
          onDelete={handleDelete}
          onToggleEnabled={handleToggleEnabled}
        />

        <UserForm
          open={open}
          onClose={handleClose}
          formData={formData}
          formMode={formMode}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
        />
      </Box>
    </Container>
  );
};

export default UserManagement;
