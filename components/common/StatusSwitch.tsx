import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
} from "react-native";
import { Power } from "lucide-react-native";
import { Colors } from "../../constants/Colors";

interface StatusSwitchProps {
  isOnline: boolean;
  onPress: () => void;
  isLoading?: boolean;
}

export default function StatusSwitch({
  isOnline,
  onPress,
  isLoading = false,
}: StatusSwitchProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.8}
      style={[styles.container, isOnline ? styles.online : styles.offline]}
    >
      <View style={styles.iconContainer}>
        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={isOnline ? Colors.success : Colors.gray[500]}
          />
        ) : (
          <Power
            size={20}
            color={isOnline ? Colors.success : Colors.gray[500]}
          />
        )}
      </View>
      <Text
        style={[styles.text, isOnline ? styles.textOnline : styles.textOffline]}
      >
        {isOnline ? "Online" : "Offline"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    minWidth: 120,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  online: {
    backgroundColor: "rgba(34, 197, 94, 0.1)", // Light green bg
    borderColor: Colors.success,
  },
  offline: {
    backgroundColor: "white",
    borderColor: Colors.gray[200],
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  textOnline: {
    color: Colors.success,
  },
  textOffline: {
    color: Colors.gray[500],
  },
});
