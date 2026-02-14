import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react-native";
import { Colors } from "../../constants/Colors";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLng = i18n.language === "en" ? "fr" : "en";
    i18n.changeLanguage(nextLng);
  };

  return (
    <TouchableOpacity
      onPress={toggleLanguage}
      style={styles.container}
      activeOpacity={0.7}
    >
      <Languages size={18} color={Colors.gray[600]} />
      <Text style={styles.text}>{(i18n.language || "en").toUpperCase()}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray[50],
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  text: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.gray[600],
  },
});
