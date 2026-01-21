import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Colors } from "../../constants/Colors";

interface GoButtonProps {
  onPress: () => void;
}

export default function GoButton({ onPress }: GoButtonProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={styles.text}>GO</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 40,
  },
  button: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primary, // Uber Blue usually, but we use our Yellow primary
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: Colors.white,
  },
  text: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: Colors.black,
  },
});
