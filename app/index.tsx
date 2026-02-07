import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../store/authStore";
import { initSocket } from "../services/socket";
import { Colors } from "../constants/Colors";

/**
 * Root entry screen. Ensures we never show (root) home until auth is resolved.
 * Redirects to: onboard (welcome), auth (login), or main app.
 */
export default function IndexScreen() {
  const [redirectHref, setRedirectHref] = useState<string | null>(null);
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");
        const isLoggedIn = await checkAuth();

        if (cancelled) return;

        if (isLoggedIn) {
          await initSocket();
          setRedirectHref("/(root)");
        } else if (hasSeenOnboarding === "true") {
          setRedirectHref("/auth/login");
        } else {
          setRedirectHref("/auth/welcome");
        }
      } catch (e) {
        if (!cancelled) setRedirectHref("/auth/welcome");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [checkAuth]);

  if (redirectHref === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <Redirect href={redirectHref as any} />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
});
