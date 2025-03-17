import api from "../api";

// get all products
export const getAllProducts = async () => {
  try {
    const response = await api.get("/product/all");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch products:", error);
    throw error;
  }
};

// create product
export const createProduct = async (productData) => {
  try {
    // productData is already FormData from the component
    const response = await api.post("/product/create", productData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Failed to create product:", error);
    throw error;
  }
};
// get product by category
export const getProductByCategory = async (categoryId) => {
  try {
    const response = await api.get(`/product/category/${categoryId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch products by category:", error);
    throw error;
  }
};

// get product by category
export const getEnabledProductByCategory = async (categoryId) => {
  try {
    const response = await api.get(`/product/enabled/category/${categoryId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch products by category:", error);
    throw error;
  }
};

// get product by id
export const getProductById = async (id) => {
  try {
    const response = await api.get(`/product/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch product:", error);
    throw error;
  }
};

// update product
export const updateProduct = async (id, productData) => {
  try {
    // productData is already FormData from the component
    const response = await api.put(`/product/${id}`, productData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Failed to create product:", error);
    throw error;
  }
};

// delete product
export const deleteProduct = async (id) => {
  try {
    const response = await api.delete(`/product/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete product:", error);
    throw error;
  }
};

export const toggleProductStatus = async (id) => {
  try {
    const response = await api.put(`/product/toggle-status/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to toggle product status:", error);
    throw error;
  }
};
