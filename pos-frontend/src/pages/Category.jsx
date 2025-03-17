import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Box, Button, Typography, Container } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import CategoryTable from "../components/category/CategoryTable";
import CategoryForm from "../components/category/CategoryForm";
import {
  fetchCategories,
  createCategory,
  editCategory,
  removeCategory,
  toggleCategoryEnabled,
} from "../redux/slices/categorySlice";
import Loader from "../components/common/Loader";

const CategoryManagement = () => {
  const dispatch = useDispatch();
  const { categories, loading, error } = useSelector(
    (state) => state.categories
  );
  const [open, setOpen] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null,
  });
  const [currentCategoryId, setCurrentCategoryId] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleClickOpen = () => {
    setFormMode("add");
    setFormData({
      name: "",
      description: "",
      image: null,
    });
    setValidationErrors([]);
    setOpen(true);
  };

  const handleEditOpen = (category) => {
    setFormMode("edit");
    setCurrentCategoryId(category.id);
    setFormData({
      name: category.name,
      description: category.description,
      image: null, // Reset image when editing
    });
    setValidationErrors([]);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      name: "",
      description: "",
      image: null,
    });
    setValidationErrors([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData({
        ...formData,
        [name]: files[0],
      });
    }
  };

  const handleSubmit = () => {
    setValidationErrors([]);

    const data = new FormData();

    // Add text fields
    if (formData.name) data.append("name", formData.name);
    if (formData.description) data.append("description", formData.description);

    // Add image file if exists
    if (formData.image instanceof File) {
      data.append("image", formData.image);
    }

    if (formMode === "add") {
      dispatch(createCategory(data))
        .unwrap()
        .then(() => {
          handleClose();
          dispatch(fetchCategories());
        })
        .catch((error) => {
          setValidationErrors(Array.isArray(error) ? error : [error]);
        });
    } else {
      dispatch(editCategory({ id: currentCategoryId, categoryData: data }))
        .unwrap()
        .then(() => {
          handleClose();
          dispatch(fetchCategories());
        })
        .catch((error) => {
          setValidationErrors(Array.isArray(error) ? error : [error]);
        });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      dispatch(removeCategory(id))
        .unwrap()
        .then(() => {
          dispatch(fetchCategories());
        });
    }
  };

  const handleToggleEnabled = (id) => {
    dispatch(toggleCategoryEnabled(id))
      .unwrap()
      .then(() => {
        dispatch(fetchCategories());
      });
  };

  if (loading) return <Loader />;

  // Don't show error message if it's just that no categories were found
  if (
    error &&
    !(typeof error === "string" && error.includes("No categories found"))
  ) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <Typography variant="h4" component="h1">
            Category Management
          </Typography>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#1a3a3a", color: "#fff" }}
            startIcon={<AddIcon />}
            onClick={handleClickOpen}
          >
            Add Category
          </Button>
        </Box>

        {categories && categories.length > 0 ? (
          <CategoryTable
            categories={categories}
            onEdit={handleEditOpen}
            onDelete={handleDelete}
            onToggleEnabled={handleToggleEnabled}
          />
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              my: 8,
              p: 4,
              border: "1px dashed #ccc",
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              No categories found
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              Start by adding your first category
            </Typography>
            <Button
              variant="contained"
              sx={{ backgroundColor: "#1a3a3a", color: "#fff" }}
              startIcon={<AddIcon />}
              onClick={handleClickOpen}
            >
              Add Category
            </Button>
          </Box>
        )}

        <CategoryForm
          open={open}
          onClose={handleClose}
          formData={formData}
          formMode={formMode}
          onInputChange={handleInputChange}
          onFileChange={handleFileChange}
          onSubmit={handleSubmit}
          validationErrors={validationErrors}
        />
      </Box>
    </Container>
  );
};

export default CategoryManagement;
