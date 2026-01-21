import { create } from "zustand";

export type AlertType = "success" | "error" | "warning" | "info";

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

export interface AlertConfig {
  title: string;
  message: string;
  type?: AlertType;
  buttons?: AlertButton[];
}

interface AlertState {
  isVisible: boolean;
  config: AlertConfig | null;
  showAlert: (config: AlertConfig) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  isVisible: false,
  config: null,

  showAlert: (config) =>
    set({
      isVisible: true,
      config,
    }),

  hideAlert: () =>
    set({
      isVisible: false,
      config: null,
    }),
}));
