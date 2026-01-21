import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import { useAlertStore, AlertButton } from "../../store/alertStore";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react-native";
import { Colors } from "../../constants/Colors";

const { width } = Dimensions.get("window");

export default function CustomAlert() {
  const { isVisible, config, hideAlert } = useAlertStore();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isVisible]);

  if (!isVisible || !config) return null;

  const getIcon = () => {
    switch (config.type) {
      case "success":
        return <CheckCircle2 size={40} color={Colors.success} />;
      case "error":
        return <XCircle size={40} color={Colors.error} />;
      case "warning":
        return <AlertTriangle size={40} color={Colors.warning} />;
      default:
        return <Info size={40} color={Colors.info} />;
    }
  };

  const renderButton = (button: AlertButton, index: number) => {
    const isDestructive = button.style === "destructive";
    const isCancel = button.style === "cancel";

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.button,
          isDestructive && styles.destructiveButton,
          isCancel && styles.cancelButton,
        ]}
        onPress={() => {
          hideAlert();
          if (button.onPress) button.onPress();
        }}
      >
        <Text
          style={[
            styles.buttonText,
            isDestructive && styles.destructiveButtonText,
            isCancel && styles.cancelButtonText,
          ]}
        >
          {button.text}
        </Text>
      </TouchableOpacity>
    );
  };

  const defaultButtons: AlertButton[] = [{ text: "OK" }];
  const buttons = config.buttons || defaultButtons;

  return (
    <Modal transparent visible={isVisible} animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.alertContainer, { opacity: fadeAnim }]}>
          <View style={styles.iconContainer}>{getIcon()}</View>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.message}>{config.message}</Text>
          <View
            style={[
              styles.buttonContainer,
              buttons.length > 2 && styles.verticalButtons,
            ]}
          >
            {buttons.map(renderButton)}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  alertContainer: {
    width: width * 0.85,
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "black",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#4b5563",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  verticalButtons: {
    flexDirection: "column",
  },
  button: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "black",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
  },
  cancelButtonText: {
    color: "#4b5563",
  },
  destructiveButton: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  destructiveButtonText: {
    color: Colors.error,
  },
});
