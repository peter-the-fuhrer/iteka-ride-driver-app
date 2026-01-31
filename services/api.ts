import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ============================================
// API CONFIGURATION
// ============================================
// Switch between LOCAL and PRODUCTION by changing the active URL below

// LOCAL API - Use your machine's IP for device/emulator testing
// Find your IP: macOS/Linux: `ifconfig | grep inet`  Windows: `ipconfig`
const API_URL_LOCAL = "http://localhost:5000/api";
// const API_URL_LOCAL = "http://192.168.1.100:5000/api"; // Example: Replace with your actual IP

// PRODUCTION API - Render deployed backend
const API_URL_PROD = "https://iteka-ride-backend.onrender.com/api";

// ============================================
// ACTIVE API URL - Change this to switch environments
// ============================================
const IS_PRODUCTION = true; // Set to true for production

export const API_BASE_URL = IS_PRODUCTION ? API_URL_PROD : API_URL_LOCAL;

// Socket URL (same host, no /api path)
export const SOCKET_URL = IS_PRODUCTION
  ? "https://iteka-ride-backend.onrender.com"
  : "http://localhost:5000";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add auth token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("driverAuthToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error getting auth token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth data
      await AsyncStorage.removeItem("driverAuthToken");
      await AsyncStorage.removeItem("driverData");
    }
    return Promise.reject(error);
  }
);

export default api;

// Helper to get error message from API response
export const getApiErrorMessage = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return "An unexpected error occurred";
};
