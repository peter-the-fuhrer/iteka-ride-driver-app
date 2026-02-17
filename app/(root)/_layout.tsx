import { Tabs, Redirect } from "expo-router";
import { useTranslation } from "react-i18next";
import { Home, DollarSign, Clock, User } from "lucide-react-native";
import { Platform, Image } from "react-native";
import { Colors } from "../../constants/Colors";
import { useAuthStore } from "../../store/authStore";
import { API_BASE_URL } from "../../services/api";

export default function RootLayout() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

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
          height: Platform.OS === "android" ? 70 : 90,
          paddingBottom: Platform.OS === "android" ? 10 : 30,
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
    </Tabs>
  );
}
