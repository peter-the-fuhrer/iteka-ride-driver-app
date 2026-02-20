import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Bell,
  Clock,
  Trash2,
  AlertCircle,
} from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { useRouter } from "expo-router";
import api from "../../services/api";
import { useDriverStore } from "../../store/driverStore";

interface Notification {
  _id: string;
  title: string;
  message: string;
  date: string;
  target: "driver" | "client" | "all";
  createdAt: string;
}

export default function Notifications() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const setUnreadCount = useDriverStore((state) => state.setUnreadNotificationsCount);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get("/notifications");
      // Filter for driver-relevant notifications
      const filtered = response.data.filter(
        (n: Notification) => n.target === "driver" || n.target === "all"
      );
      setNotifications(filtered);
      // Reset unread count
      setUnreadCount(0);
    } catch (err) {
      console.error("Fetch notifications error:", err);
      setError("Could not load notifications. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const sections = useMemo(() => {
    if (notifications.length === 0) return [];

    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const earlier: Notification[] = [];

    const now = new Date();
    const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toDateString();
    const yesterdayDateObj = new Date(now);
    yesterdayDateObj.setDate(now.getDate() - 1);
    const yesterdayStr = new Date(yesterdayDateObj.getFullYear(), yesterdayDateObj.getMonth(), yesterdayDateObj.getDate()).toDateString();

    notifications.forEach((notif) => {
      const d = new Date(notif.date || notif.createdAt);
      const notifStr = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString();
      if (notifStr === todayStr) {
        today.push(notif);
      } else if (notifStr === yesterdayStr) {
        yesterday.push(notif);
      } else {
        earlier.push(notif);
      }
    });

    const result = [];
    if (today.length > 0) result.push({ title: t("today") || "Today", data: today });
    if (yesterday.length > 0) result.push({ title: t("yesterday") || "Yesterday", data: yesterday });
    if (earlier.length > 0) result.push({ title: t("earlier") || "Earlier", data: earlier });

    return result;
  }, [notifications, t]);

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <View style={styles.notifCard}>
      <View style={[styles.indicator, { backgroundColor: Colors.primary }]} />
      <View style={styles.iconContainer}>
        <View style={[styles.iconInside, { backgroundColor: Colors.primary + "15" }]}>
          <Bell size={18} color={Colors.primary} />
        </View>
      </View>
      <View style={styles.contentCol}>
        <View style={styles.notifHeader}>
          <Text style={styles.notifTitle}>{item.title}</Text>
          <Text style={styles.notifTime}>{getTimeAgo(item.date || item.createdAt)}</Text>
        </View>
        <Text style={styles.notifMessage} numberOfLines={3}>
          {item.message}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
            <ArrowLeft size={22} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("notifications")}</Text>
        </View>
        <TouchableOpacity onPress={fetchNotifications} style={styles.actionBtn}>
          <Clock size={20} color={Colors.gray[500]} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Fetching updates...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <AlertCircle size={48} color={Colors.error} />
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchNotifications}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrapper}>
            <Bell size={60} color={Colors.gray[200]} />
            <View style={styles.emptyCircle} />
          </View>
          <Text style={styles.emptyTitle}>{t("no_notifications") || "No Notifications"}</Text>
          <Text style={styles.emptyDesc}>
            {t("no_notifications_desc") || "When you receive messages or alerts, they will appear here."}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{title}</Text>
              <View style={styles.sectionLine} />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchNotifications}
          refreshing={isLoading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "#111827",
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#6B7280",
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "#111827",
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#000",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  notifCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    position: "relative",
    overflow: "hidden",
  },
  unreadNotifCard: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
  },
  indicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconContainer: {
    marginRight: 16,
  },
  iconInside: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  contentCol: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  boldTitle: {
    fontFamily: "Poppins_700Bold",
    color: "#111827",
  },
  notifTime: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: "#9CA3AF",
  },
  notifMessage: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyCircle: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#F3F4F6",
    borderStyle: "dashed",
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: "#111827",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 22,
  },
});
