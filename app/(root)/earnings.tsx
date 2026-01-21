import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { DollarSign } from "lucide-react-native";

export default function Earnings() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("earnings")}</Text>
      </View>
      <View style={styles.content}>
        <DollarSign size={64} color="#d1d5db" />
        <Text style={styles.text}>{t("earnings")} Screen</Text>
        <Text style={styles.subtext}>Coming Soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Poppins_600SemiBold",
    color: "black",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  text: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    color: "black",
  },
  subtext: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#9ca3af",
  },
});
