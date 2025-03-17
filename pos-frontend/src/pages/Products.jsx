import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Box, Button, Typography, Container, Alert } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import ProductTable from "../components/products/ProductTable";
import ProductForm from "../components/products/ProductForm";
import {
  fetchProducts,
  createProduct,
  editProduct,
  removeProduct,
  toggleProductEnabled,
} from "../redux/slices/productSlice";
import Loader from "../components/common/Loader";
import { fetchCategories } from "../redux/slices/categorySlice";

const ProductManagement = () => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { products, loading, error } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.categories);
  const [open, setOpen] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
  });
  const [currentProductId, setCurrentProductId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [formError, setFormError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleClickOpen = () => {
    setFormMode("add");
    setFormData({
      name: "",
      description: "",
      price: "",
      category_id: "",
    });
    setImageFile(null);
    setFormError(null);
    setValidationErrors([]);
    setOpen(true);
  };

  const handleEditOpen = (product) => {
    setFormMode("edit");
    setCurrentProductId(product.id);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category_id: product.category_id,
    });
    setImageFile(null);
    setFormError(null);
    setValidationErrors([]);
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

  // Validate form data before submission
  const validateForm = () => {
    const errors = [];

    if (!formData.name || formData.name.trim() === "") {
      errors.push("Name is required");
    }

    if (!formData.description || formData.description.trim() === "") {
      errors.push("Description is required");
    }

    if (
      !formData.price ||
      isNaN(Number(formData.price)) ||
      Number(formData.price) <= 0
    ) {
      errors.push("Price must be a valid positive number");
    }

    if (!formData.category_id) {
      errors.push("Category is required");
    }

    if (formMode === "add" && !imageFile) {
      errors.push("Image is required");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async () => {
    // First validate the form
    if (!validateForm()) {
      return;
    }

    try {
      // Create proper FormData object with all required fields
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("name", formData.name);
      formDataToSubmit.append("description", formData.description);
      formDataToSubmit.append("price", formData.price);
      formDataToSubmit.append("category_id", formData.category_id);

      // Only append image if it exists (required for new products)
      if (imageFile) {
        formDataToSubmit.append("image", imageFile);
      }

      if (formMode === "add") {
        await dispatch(createProduct(formDataToSubmit)).unwrap();
      } else {
        await dispatch(
          editProduct({ id: currentProductId, productData: formDataToSubmit })
        ).unwrap();
      }

      // Close the form on success
      handleClose();
    } catch (err) {
      console.error("Error submitting product:", err);

      // Handle API validation errors
      if (err && Array.isArray(err)) {
        // Handle array of validation errors from API
        setValidationErrors(
          err.map((e) => `${e.loc.slice(1).join(".")}: ${e.msg}`)
        );
      } else if (err && typeof err === "object" && err.detail) {
        // Handle FastAPI detailed error response
        if (Array.isArray(err.detail)) {
          setValidationErrors(
            err.detail.map((e) => `${e.loc.slice(1).join(".")}: ${e.msg}`)
          );
        } else {
          setFormError(err.detail);
        }
      } else {
        // Generic error handling
        setFormError(
          err?.message || "An error occurred while saving the product"
        );
      }
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      dispatch(removeProduct(id));
    }
  };

  const handleToggleEnabled = (id) => {
    dispatch(toggleProductEnabled(id))
      .unwrap()
      .then(() => {
        dispatch(fetchProducts());
      })
      .catch((err) => {
        if (
          err.detail ===
          "Cannot enable product because its category is disabled"
        ) {
          enqueueSnackbar(err.detail, { variant: "warning" });
        } else {
          enqueueSnackbar(
            "An error occurred while toggling the product status",
            { variant: "error" }
          );
        }
      });
  };

  // Format error display for user
  const getFormattedErrorMessage = () => {
    if (validationErrors.length > 0) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Please fix the following errors:
          </Typography>
          <ul>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      );
    }

    if (formError) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          {typeof formError === "string" ? formError : "An error occurred"}
        </Alert>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="50vh"
        flexDirection="column"
      >
        <Typography sx={{ mt: 2 }}>
          <Loader />
          Loading products...
        </Typography>
      </Box>
    );
  }

  // Handle global error state (not form-specific)
  // Don't show error message if it's just that no products were found
  if (
    error &&
    !(typeof error === "string" && error.includes("No products found"))
  ) {
    const errorMessage =
      typeof error === "string"
        ? error
        : Array.isArray(error)
        ? error.map((err) => err.msg).join(", ")
        : "An error occurred loading products";

    return (
      <Alert severity="error" sx={{ m: 2 }}>
        <Typography>{errorMessage}</Typography>
      </Alert>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <Typography variant="h4" component="h1">
            Product Management
          </Typography>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#1a3a3a", color: "#fff" }}
            startIcon={<AddIcon />}
            onClick={handleClickOpen}
          >
            Add Product
          </Button>
        </Box>

        {products && products.length > 0 ? (
          <ProductTable
            products={products}
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
              No products found
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              Start by adding your first product
            </Typography>
            <Button
              variant="contained"
              sx={{ backgroundColor: "#1a3a3a", color: "#fff" }}
              startIcon={<AddIcon />}
              onClick={handleClickOpen}
            >
              Add Product
            </Button>
          </Box>
        )}

        <ProductForm
          open={open}
          onClose={handleClose}
          formData={formData}
          formMode={formMode}
          onInputChange={handleInputChange}
          onFileChange={handleFileChange}
          onSubmit={handleSubmit}
          categories={categories}
          validationErrors={validationErrors}
        />

        {getFormattedErrorMessage()}
      </Box>
    </Container>
  );
};

export default ProductManagement;
