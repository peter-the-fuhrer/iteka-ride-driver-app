import api, { getApiErrorMessage } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Driver {
  _id: string;
  name: string;
  email: string;
  phone: string;
  vehicle_model?: string;
  vehicle_color?: string;
  vehicle_plate?: string;
  rating?: number;
  status?: string;
  is_online?: boolean;
  earnings_total?: number;
  commission_debt?: number;
}

export interface AuthResponse {
  token: string;
  driver: Driver;
}

export interface LoginData {
  email: string;
  password: string;
}

// Login driver
export const login = async (data: LoginData): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>("/driver-app/auth/login", data);

    // Store token and driver data
    await AsyncStorage.setItem("driverAuthToken", response.data.token);
    await AsyncStorage.setItem("driverData", JSON.stringify(response.data.driver));

    return response.data;
  } catch (error: any) {
    throw new Error(getApiErrorMessage(error));
  }
};

// Get stored auth token
export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem("driverAuthToken");
  } catch {
    return null;
  }
};

// Get stored driver data
export const getStoredDriver = async (): Promise<Driver | null> => {
  try {
    const driverData = await AsyncStorage.getItem("driverData");
    return driverData ? JSON.parse(driverData) : null;
  } catch {
    return null;
  }
};

// Logout - clear stored data
export const logout = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem("driverAuthToken");
    await AsyncStorage.removeItem("driverData");
  } catch (error) {
    console.error("Error during logout:", error);
  }
};

// Check if driver is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getToken();
  return !!token;
};
