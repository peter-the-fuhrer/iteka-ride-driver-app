import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { Link, router } from "expo-router";
import { Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { useAlertStore } from "../../store/alertStore";
import { useAuthStore } from "../../store/authStore";
import LanguageSwitcher from "../../components/common/LanguageSwitcher";

export default function Login() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      useAlertStore.getState().showAlert({
        title: t("alert_login_failed_title") || "Login Failed",
        message: t("fill_all_fields") || "Please fill all fields",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    clearError();

    const success = await login({ email, password });

    setIsLoading(false);

    if (success) {
      router.replace("/(root)");
    } else {
      useAlertStore.getState().showAlert({
        title: t("alert_login_failed_title") || "Login Failed",
        message: error
          ? t(error, { defaultValue: error })
          : t("invalid_credentials"),
        type: "error",
      });
    }
  };

  const getInputStyle = (fieldName: string) => [
    styles.inputContainer,
    focusedField === fieldName && styles.inputContainerFocused,
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft color="black" size={20} />
            </TouchableOpacity>
            <LanguageSwitcher />
          </View>

          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <Image
                source={require("../../assets/iteka-ride-icon.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>{t("login_title")}</Text>
            <Text style={styles.subtitle}>{t("login_subtitle")}</Text>
          </View>

          <View style={styles.form}>
            <View style={getInputStyle("email")}>
              <Mail size={20} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder={t("enter_email") || "Email address"}
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                editable={!isLoading}
              />
            </View>

            <View style={getInputStyle("password")}>
              <Lock size={20} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder={t("enter_password") || "Password"}
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#9ca3af" />
                ) : (
                  <Eye size={20} color="#9ca3af" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPin}>
              <Text style={styles.forgotPinText}>
                {t("forgot_password") || "Forgot password?"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogin}
              style={[
                styles.loginButton,
                isLoading && styles.loginButtonDisabled,
              ]}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="black" />
              ) : (
                <Text style={styles.loginButtonText}>{t("login")}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.noAccountText}>{t("dont_have_account")}</Text>
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL(
                    "https://iteka-ride-dashboard.vercel.app/register-driver",
                  )
                }
              >
                <Text style={styles.signupText}>{t("sign_up")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    paddingHorizontal: 24,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    marginTop: 8,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: "#f9fafb",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoWrapper: {
    width: 96,
    height: 96,
    backgroundColor: "rgba(254, 202, 5, 0.1)",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    transform: [{ rotate: "3deg" }],
  },
  logo: {
    width: 64,
    height: 64,
  },
  title: {
    fontSize: 30,
    fontFamily: "Poppins_600SemiBold",
    color: "black",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "#6b7280",
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    fontSize: 15,
    paddingHorizontal: 32,
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#f3f4f6",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  inputContainerFocused: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(254, 202, 5, 0.05)",
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: "black",
  },
  forgotPin: {
    alignSelf: "flex-end",
  },
  forgotPinText: {
    color: Colors.primary,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "black",
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
  eyeIcon: {
    padding: 4,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },
  noAccountText: {
    color: "#6b7280",
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  signupText: {
    color: Colors.primary,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
});
