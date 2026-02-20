import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { Stack, router } from "expo-router";
import { ArrowLeft, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useColorScheme } from "react-native";
import { Colors } from "../../constants/Colors";
import api from "../../services/api";
import { useAlertStore } from "../../store/alertStore";

const InputField = ({
    label,
    value,
    onChangeText,
    showSecure,
    onToggleSecure,
    isDark
}: any) => (
    <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, isDark ? styles.textGray400 : styles.textGray500]}>
            {label}
        </Text>
        <View style={[
            styles.inputWrapper,
            isDark ? styles.wrapperDark : styles.wrapperLight
        ]}>
            <Lock size={18} color={isDark ? "#9CA3AF" : "#6B7280"} style={{ marginRight: 12 }} />
            <TextInput
                style={[styles.input, isDark ? styles.textWhite : styles.textBlack]}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={!showSecure}
                placeholder="••••••••"
                placeholderTextColor={isDark ? "#4B5563" : "#9CA3AF"}
                autoCapitalize="none"
            />
            <TouchableOpacity onPress={onToggleSecure} style={styles.eyeIcon}>
                {showSecure ? (
                    <EyeOff size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
                ) : (
                    <Eye size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
                )}
            </TouchableOpacity>
        </View>
    </View>
);

export default function ChangePassword() {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { showAlert } = useAlertStore();

    const handleUpdatePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            showAlert({
                title: t("error"),
                message: t("fill_all_fields"),
                type: "error",
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            showAlert({
                title: t("error"),
                message: t("passwords_dont_match"),
                type: "error",
            });
            return;
        }

        if (newPassword.length < 6) {
            showAlert({
                title: t("error"),
                message: t("password_too_short"),
                type: "error",
            });
            return;
        }

        setLoading(true);
        try {
            await api.post("/driver-app/change-password", {
                currentPassword,
                newPassword,
            });

            showAlert({
                title: t("success"),
                message: t("password_update_success"),
                type: "success",
            });
            router.back();
        } catch (error: any) {
            const message = error.response?.data?.message || t("password_update_error");
            showAlert({
                title: t("error"),
                message,
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.container, { backgroundColor: isDark ? "#010101" : "#F9FAFB" }]}
        >
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backButton, isDark ? styles.backButtonDark : styles.backButtonLight]}
                >
                    <ArrowLeft color={isDark ? "white" : "black"} size={24} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDark ? styles.textWhite : styles.textBlack]}>
                    {t("change_password")}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.infoBox}>
                    <View style={styles.infoIconWrapper}>
                        <ShieldCheck size={24} color={Colors.primary} />
                    </View>
                    <Text style={[styles.infoText, isDark ? styles.textGray400 : styles.textGray500]}>
                        Enhance your account security by updating your password regularly.
                    </Text>
                </View>

                <InputField
                    label={t("current_password")}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    showSecure={showCurrent}
                    onToggleSecure={() => setShowCurrent(!showCurrent)}
                    isDark={isDark}
                />

                <InputField
                    label={t("new_password")}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    showSecure={showNew}
                    onToggleSecure={() => setShowNew(!showNew)}
                    isDark={isDark}
                />

                <InputField
                    label={t("confirm_new_password")}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    showSecure={showConfirm}
                    onToggleSecure={() => setShowConfirm(!showConfirm)}
                    isDark={isDark}
                />

                <TouchableOpacity
                    onPress={handleUpdatePassword}
                    disabled={loading}
                    style={[styles.submitButton, loading && styles.disabledButton]}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="black" />
                    ) : (
                        <Text style={styles.submitButtonText}>{t("done")}</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    backButtonLight: {
        backgroundColor: "white",
    },
    backButtonDark: {
        backgroundColor: "#111827",
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: "Poppins_700Bold",
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    infoBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(254, 202, 5, 0.05)",
        padding: 16,
        borderRadius: 16,
        marginBottom: 30,
    },
    infoIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(254, 202, 5, 0.1)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        fontFamily: "Poppins_400Regular",
        lineHeight: 18,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontFamily: "Poppins_600SemiBold",
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        height: 56,
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
    },
    wrapperLight: {
        backgroundColor: "white",
        borderColor: "#F3F4F6",
    },
    wrapperDark: {
        backgroundColor: "#111827",
        borderColor: "#1F2937",
    },
    input: {
        flex: 1,
        height: "100%",
        fontSize: 15,
        fontFamily: "Poppins_400Regular",
    },
    eyeIcon: {
        padding: 8,
    },
    submitButton: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
        marginBottom: 40,
        ...Platform.select({
            ios: {
                shadowColor: Colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    submitButtonText: {
        fontSize: 16,
        fontFamily: "Poppins_700Bold",
        color: "black",
        textAlign: "center",
    },
    disabledButton: {
        opacity: 0.6,
    },
    textWhite: { color: "#FFFFFF" },
    textBlack: { color: "#000000" },
    textGray400: { color: "#9CA3AF" },
    textGray500: { color: "#6B7280" },
});
