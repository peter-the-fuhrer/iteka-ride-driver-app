import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";

import "../i18n";
import { Colors } from "../constants/Colors";
import CustomAlert from "../components/common/CustomAlert";
import { useAuthStore } from "../store/authStore";
import { initSocket, disconnectSocket } from "../services/socket";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { checkAuth, isAuthenticated } = useAuthStore();

  const [loaded, error] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Check auth status and onboarding on app start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if driver has seen onboarding
        const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");

        // Check if driver is authenticated
        const isLoggedIn = await checkAuth();

        if (isLoggedIn) {
          // Driver is logged in, initialize socket and go to main app
          await initSocket();
          router.replace("/(root)");
        } else if (hasSeenOnboarding === "true") {
          // Driver has seen onboarding but not logged in, go to login
          router.replace("/auth/login");
        }
        // else: Driver hasn't seen onboarding, stay on welcome screen
      } catch (e) {
        console.error("Failed to initialize app", e);
      }
    };

    if (loaded || error) {
      initializeApp().finally(() => {
        SplashScreen.hideAsync();
      });
    }
  }, [loaded, error]);

  // Initialize/disconnect socket based on auth status
  useEffect(() => {
    if (isAuthenticated) {
      initSocket();
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor:
                colorScheme === "dark" ? Colors.black : Colors.primary,
            },
            headerTintColor: colorScheme === "dark" ? "#fff" : "#000",
            headerTitleStyle: {
              fontFamily: "Poppins_700Bold",
            },
          }}
        >
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="(root)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <CustomAlert />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
