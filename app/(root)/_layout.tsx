import { Tabs, Redirect } from "expo-router";
import { useTranslation } from "react-i18next";
import { Home, DollarSign, Clock, User } from "lucide-react-native";
import { Platform, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { useAuthStore } from "../../store/authStore";
import api, { API_BASE_URL } from "../../services/api";
import { useEffect } from "react";
import { useDriverStore } from "../../store/driverStore";

export default function RootLayout() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUnreadCount = useDriverStore((s) => s.setUnreadNotificationsCount);

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkNotifications = async () => {
      try {
        const response = await api.get("/notifications");
        const filtered = response.data.filter(
          (n: any) => n.target === "driver" || n.target === "all"
        );
        // This is a simple logic: show total count as unread if they haven't visited lately
        // In a real app, you'd track 'lastReadAt' or 'read' status in DB
        setUnreadCount(filtered.length);
      } catch (err) {
        console.error("Error checking notifications:", err);
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const insets = useSafeAreaInsets();

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: "#f3f4f6",
          height: Platform.OS === "android" ? 60 + insets.bottom : 85 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : (Platform.OS === "android" ? 10 : 30),
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontFamily: "Poppins_600SemiBold",
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("home"),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: t("earnings"),
          tabBarIcon: ({ color, size }) => (
            <DollarSign size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t("history"),
          tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile"),
          tabBarIcon: ({ color, size }) => {
            const driver = useAuthStore.getState().driver;
            if (driver?.profile_picture) {
              return (
                <Image
                  source={{
                    uri: driver.profile_picture.startsWith("http")
                      ? driver.profile_picture
                      : `${API_BASE_URL.replace("/api", "")}${driver.profile_picture}`,
                  }}
                  style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderWidth: 1,
                    borderColor: color,
                  }}
                />
              );
            }
            return <User size={size} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="active-ride"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="chat/index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="change-password"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
