import { create } from "zustand";

export type AlertType = "success" | "error" | "info" | "warning";

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "cancel" | "default" | "destructive";
}

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  type: AlertType;
  buttons: AlertButton[];
  showAlert: (params: {
    title: string;
    message: string;
    type?: AlertType;
    buttons?: AlertButton[];
  }) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: "",
  message: "",
  type: "info",
  buttons: [],
  showAlert: ({ title, message, type = "info", buttons = [] }) =>
    set({
      visible: true,
      title,
      message,
      type,
      buttons: buttons.length ? buttons : [{ text: "OK", style: "default" }],
    }),
  hideAlert: () =>
    set({
      visible: false,
      title: "",
      message: "",
      buttons: [],
    }),
}));
