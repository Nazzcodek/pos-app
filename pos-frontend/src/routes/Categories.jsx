import api from "../api";

// get categories
export const getAllCategory = async () => {
  try {
    const response = await api.get("/category/all");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    throw error;
  }
};

// get enabled categories
export const getEnabledCategory = async () => {
  try {
    const response = await api.get("/category/enabled");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    throw error;
  }
};

export const createCategory = async (categoryData) => {
  try {
    // categoryData is already FormData from the component
    const response = await api.post("/category/create", categoryData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Failed to create category:", error);
    throw error;
  }
};

export const updateCategory = async (id, categoryData) => {
  try {
    // categoryData is already FormData from the component
    const response = await api.put(`/category/${id}`, categoryData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Failed to create category:", error);
    throw error;
  }
};

export const deleteCategory = async (categoryId) => {
  try {
    const response = await api.delete(`/category/${categoryId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete category:", error);
    throw error;
  }
};

export const toggleCategoryStatus = async (id) => {
  try {
    const response = await api.put(`/category/toggle-status/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to toggle category status:", error);
    throw error;
  }
};
