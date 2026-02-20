import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as authService from "../services/auth";

interface AuthState {
  driver: authService.Driver | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setDriver: (driver: authService.Driver | null) => void;
  setToken: (token: string | null) => void;
  setError: (error: string | null) => void;

  // Auth actions
  login: (data: authService.LoginData) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  driver: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setDriver: (driver) => {
    set({ driver, isAuthenticated: !!driver });
    if (driver) {
      AsyncStorage.setItem("driverData", JSON.stringify(driver)).catch((err) =>
        console.error("Error persisting driver data:", err),
      );
    }
  },
  setToken: (token) => set({ token }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  login: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(data);
      set({
        driver: response.driver,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || "Login failed",
      });
      return false;
    }
  },

  logout: async () => {
    await authService.logout();
    set({
      driver: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await authService.getToken();
      const driver = await authService.getStoredDriver();

      if (token && driver) {
        set({
          driver,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      } else {
        set({
          driver: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return false;
      }
    } catch (error) {
      set({
        driver: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return false;
    }
  },
}));
