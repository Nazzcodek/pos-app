import axios from "axios";
import API_CONFIG from "./apiConfig";

// const API_URL = process.env.LOCAL_API_URL || "http://localhost:8000";
// console.log("axios url:", API_URL);
const api = axios.create({
  baseURL: `${API_CONFIG.BASE_URL}/api/v1`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
