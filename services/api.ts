import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ============================================
// API CONFIGURATION
// ============================================
// Switch between LOCAL (emulators/device) and PRODUCTION

// LOCAL API – pick one for your run target:
// • Android Emulator: 10.0.2.2 = host machine from emulator
// • iOS Simulator: localhost (same machine)
// • Physical device: your machine's LAN IP (e.g. 192.168.1.113)
// const API_URL_LOCAL = "http://10.0.2.2:5000/api"; // Android emulator
const API_URL_LOCAL = "http://10.60.208.113:5000/api"; // Physical device / LAN
// const API_URL_LOCAL = "http://localhost:5000/api";

// Socket URL – same host as API, no /api path (must match API_URL_LOCAL host)
// const SOCKET_URL_LOCAL = "http://10.0.2.2:5000"; // Android emulator
const SOCKET_URL_LOCAL = "http://10.60.208.113:5000"; // Set to machine IP for discovery
// const SOCKET_URL_LOCAL = "http://localhost:5000";

// PRODUCTION API - Render deployed backend
const API_URL_PROD = "https://iteka-ride-backend.onrender.com/api";

// ============================================
// ACTIVE ENVIRONMENT – use local for emulators
// ============================================
const IS_PRODUCTION = true; // true = production, false = local (emulators / device)

export const API_BASE_URL = IS_PRODUCTION ? API_URL_PROD : API_URL_LOCAL;
export const SOCKET_URL = IS_PRODUCTION
  ? "https://iteka-ride-backend.onrender.com"
  : SOCKET_URL_LOCAL;

// Log API base URL (always, for debugging)
console.log("🌐 Driver App API Base URL:", API_BASE_URL);
console.log("🌐 Driver App Socket URL:", SOCKET_URL);
console.log("🌐 Driver App Production Mode:", IS_PRODUCTION);

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
  },
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
  },
);

export default api;

// Helper to get error message from API response
export const getApiErrorMessage = (error: any): string => {
  // Network error (no response)
  if (
    error.code === "NETWORK_ERROR" ||
    error.message === "Network Error" ||
    !error.response
  ) {
    return "network_error";
  }

  // Server responded with error
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // HTTP status code errors
  if (error.response?.status === 401) {
    return "unauthorized";
  }
  if (error.response?.status === 403) {
    return "account_suspended";
  }
  if (error.response?.status === 404) {
    return "api_not_found";
  }
  if (error.response?.status >= 500) {
    return "server_error";
  }

  if (error.message) {
    return error.message;
  }

  return "An unexpected error occurred";
};
