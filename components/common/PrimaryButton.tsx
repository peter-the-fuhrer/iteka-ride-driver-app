import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from "react-native";
import { Colors } from "../../constants/Colors";

interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "outline" | "secondary" | "danger";
  isLoading?: boolean;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
}

export default function PrimaryButton({
  title,
  onPress,
  variant = "primary",
  isLoading = false,
  containerStyle,
  textStyle,
  disabled,
  ...props
}: PrimaryButtonProps) {
  const isOutline = variant === "outline";
  const isSecondary = variant === "secondary";
  const isDanger = variant === "danger";

  const getBackgroundColor = () => {
    if (disabled) return Colors.gray[200];
    if (isOutline) return "transparent";
    if (isSecondary) return Colors.gray[100];
    if (isDanger) return Colors.error;
    return Colors.primary;
  };

  const getTextColor = () => {
    if (disabled) return Colors.gray[400];
    if (isOutline) return Colors.black;
    if (isSecondary) return Colors.black;
    if (isDanger) return "white";
    return Colors.black;
  };

  const getBorderColor = () => {
    if (disabled) return Colors.gray[200];
    if (isOutline) return Colors.gray[300];
    return "transparent";
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: isOutline ? 1 : 0,
        },
        containerStyle,
      ]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  text: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    textAlign: "center",
  },
});
