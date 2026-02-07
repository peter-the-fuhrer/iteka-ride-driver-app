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

// Open on index (auth gate) so we never show home until signed in
export const unstable_settings = {
  initialRouteName: "index",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated } = useAuthStore();

  const [loaded, error] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
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
          <Stack.Screen name="index" options={{ headerShown: false }} />
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
