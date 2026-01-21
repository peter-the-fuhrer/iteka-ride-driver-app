import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Bell, Calendar, Info } from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { useRouter } from "expo-router";

export default function Notifications() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();

  const notifications = [
    {
      id: 1,
      title: t("document_approved"),
      message: t("document_approved_msg"),
      date: "2 hours ago",
      type: "success",
      read: false,
    },
    {
      id: 2,
      title: t("new_bonus_available"),
      message: t("new_bonus_msg"),
      date: "5 hours ago",
      type: "info",
      read: true,
    },
    {
      id: 3,
      title: t("system_maintenance"),
      message: t("system_maintenance_msg"),
      date: "1 day ago",
      type: "warning",
      read: true,
    },
  ];

  const getIcon = (type: string) => {
    // Just simplicity
    return <Info size={20} color={Colors.primary} />;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("notifications")}</Text>
        <TouchableOpacity style={styles.clearBtn}>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {notifications.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.card, !item.read && styles.unreadCard]}
          >
            <View style={styles.iconCol}>
              <View style={styles.iconBg}>
                <Bell size={20} color={Colors.black} />
              </View>
            </View>
            <View style={styles.contentCol}>
              <View style={styles.topRow}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.date}>{item.date}</Text>
              </View>
              <Text style={styles.message} numberOfLines={2}>
                {item.message}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  backButton: {
    padding: 10,
    backgroundColor: Colors.gray[100],
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
  },
  clearBtn: {
    padding: 8,
  },
  clearText: {
    color: Colors.gray[500],
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
  },
  scrollContent: {
    padding: 20,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gray[100],
    alignItems: "flex-start",
    gap: 12,
  },
  unreadCard: {
    backgroundColor: "#f0fdfa",
    borderColor: Colors.primary,
  },
  iconCol: {
    paddingTop: 2,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  contentCol: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
  },
  date: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: Colors.gray[400],
  },
  message: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: Colors.gray[600],
    lineHeight: 18,
  },
});
