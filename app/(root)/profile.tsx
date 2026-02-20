import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  User,
  Car,
  LogOut,
  ChevronRight,
  Shield,
  Bell,
  Languages,
  Wallet,
  HelpCircle,
  Star,
  CheckCircle2,
  AlertCircle,
  Banknote,
  Navigation,
  History,
} from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { useRouter } from "expo-router";
import { useDriverStore } from "../../store/driverStore";
import { useAuthStore } from "../../store/authStore";
import { useEffect, useState } from "react";
import api, { API_BASE_URL } from "../../services/api";
import * as ImagePicker from "expo-image-picker";
import { useAlertStore } from "../../store/alertStore";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { stats, rideHistory, unreadNotificationsCount } = useDriverStore();
  const { driver, logout, setDriver } = useAuthStore();
  const [driverProfile, setDriverProfile] = useState<any>(null);
  const [documentsStatus, setDocumentsStatus] = useState<string>("");

  useEffect(() => {
    const fetchDriverProfile = async () => {
      if (!driver?._id) return;
      try {
        const response = await api.get(`/drivers/${driver._id}`);
        setDriverProfile(response.data);

        const docs = response.data?.documents || {};
        const hasAllDocs = docs.id_card_front && docs.id_card_back && docs.license && docs.registration;
        const hasSomeDocs = docs.id_card_front || docs.id_card_back || docs.license || docs.registration;

        if (hasAllDocs) {
          setDocumentsStatus("Verified");
        } else if (hasSomeDocs) {
          setDocumentsStatus("Pending");
        } else {
          setDocumentsStatus("Action Required");
        }
      } catch (error) {
        console.log("Could not fetch full profile, using auth store data");
        const docs = driver?.documents || {};
        const hasAllDocs = docs.id_card_front && docs.id_card_back && docs.license && docs.registration;
        const hasSomeDocs = docs.id_card_front || docs.id_card_back || docs.license || docs.registration;

        if (hasAllDocs) {
          setDocumentsStatus("Verified");
        } else if (hasSomeDocs) {
          setDocumentsStatus("Pending");
        } else {
          setDocumentsStatus("Action Required");
        }
      }
    };
    fetchDriverProfile();
  }, [driver?._id, t]);

  const handleAvatarPress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      const { useAlertStore } = require("../../store/alertStore");
      useAlertStore.getState().showAlert({
        title: t("error") || "Error",
        message: t("camera_permission_required") || "Sorry, we need camera roll permissions to make this work!",
        type: "error",
      });
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImage = result.assets[0];
      await uploadProfilePicture(selectedImage.uri);
    }
  };

  const uploadProfilePicture = async (uri: string) => {
    try {
      const formData = new FormData();
      // @ts-ignore
      formData.append("image", {
        uri,
        name: `profile_driver.jpg`,
        type: "image/jpeg",
      });

      const uploadRes = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (uploadRes.data.path) {
        const imagePath = uploadRes.data.path;
        await api.put("/driver-app/profile", { profile_picture: imagePath });

        if (imagePath) {
          setDriver({ ...driver, profile_picture: imagePath } as any);
        }

        const response = await api.get(`/drivers/${driver?._id}`);
        setDriverProfile(response.data);
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      const { useAlertStore } = require("../../store/alertStore");
      useAlertStore.getState().showAlert({
        title: t("error") || "Error",
        message: "Failed to upload profile picture",
        type: "error",
      });
    }
  };

  const toggleLanguage = () => {
    const nextLng = i18n.language === "en" ? "fr" : "en";
    i18n.changeLanguage(nextLng);
  };

  const handleLogout = () => {
    useAlertStore.getState().showAlert({
      title: t("logout") || "Logout",
      message: t("logout_confirm") || "Are you sure you want to logout?",
      type: "warning",
      buttons: [
        { text: t("cancel") || "Cancel", style: "cancel" },
        {
          text: t("logout") || "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/auth/login");
          },
        },
      ],
    });
  };

  const getVehicleDisplay = () => {
    if (driverProfile?.vehicle_plate || driver?.vehicle_plate) {
      return driverProfile?.vehicle_plate || driver?.vehicle_plate;
    }
    return t("no_vehicle") || "No Vehicle Assigned";
  };

  const ProfileItem = ({
    icon: Icon,
    label,
    value,
    onPress,
    isSwitch,
    switchValue,
    onValueChange,
    isLast,
    variant = "default",
  }: any) => (
    <TouchableOpacity
      style={[styles.profileItem, isLast && styles.noBorder]}
      onPress={onPress}
      disabled={isSwitch}
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        <View style={styles.iconWrapper}>
          <Icon size={18} color={Colors.primary} />
        </View>
        <View>
          <Text style={styles.itemLabel}>{label}</Text>
          {value && !isSwitch && (
            <Text style={styles.itemValueText}>{value}</Text>
          )}
        </View>
      </View>
      <View style={styles.itemRight}>
        {isSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onValueChange}
            trackColor={{ false: "#E5E7EB", true: Colors.primary }}
            thumbColor={"#fff"}
          />
        ) : onPress ? (
          <ChevronRight size={18} color="#9CA3AF" />
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const Section = ({ title, children }: any) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const stats_data = [
    { label: t("rating") || "Rating", value: (driverProfile?.rating || driver?.rating || 0).toFixed(1), icon: Star },
    { label: t("trips") || "Trips", value: rideHistory.length || "0", icon: Navigation },
    { label: t("balance") || "Balance", value: `${stats.netBalance.toLocaleString()} FBU`, icon: Banknote },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.topGradient, { height: insets.top + 180 }]} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>{t("profile")}</Text>
        <TouchableOpacity
          onPress={() => router.push("/notifications")}
          style={styles.notifButton}
        >
          <View>
            <Bell size={22} color="black" />
            {unreadNotificationsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.cardHeader}>
            <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                {driverProfile?.profile_picture || driver?.profile_picture ? (
                  <Image
                    source={{
                      uri: (driverProfile?.profile_picture || driver?.profile_picture).startsWith("http")
                        ? driverProfile?.profile_picture || driver?.profile_picture
                        : `${API_BASE_URL.replace("/api", "")}${driverProfile?.profile_picture || driver?.profile_picture}`,
                    }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <User size={40} color="white" />
                )}
              </View>
              <View style={styles.editBadge}>
                <Car color="white" size={10} />
              </View>
            </TouchableOpacity>

            <View style={styles.profileInfo}>
              <Text style={styles.driverName}>
                {driverProfile?.name || driver?.name || "Driver"}
              </Text>
              <View style={styles.statusRow}>
                {driver?.status === "active" ? (
                  <CheckCircle2 size={14} color={Colors.success} />
                ) : (
                  <AlertCircle size={14} color={Colors.warning} />
                )}
                <Text style={[styles.statusText, { color: driver?.status === "active" ? Colors.success : Colors.warning }]}>
                  {driver?.status === "active" ? t("verified") : t("pending_verification")}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            {stats_data.map((stat, index) => (
              <View key={index} style={[styles.statItem, index < stats_data.length - 1 && styles.statDivider]}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Account Section */}
        <Section title={t("account")?.toUpperCase() || "ACCOUNT"}>
          <ProfileItem
            icon={User}
            label={t("personal_info")}
            value={driver?.phone || driver?.email}
            onPress={() => { }}
          />
          <ProfileItem
            icon={Wallet}
            label={t("wallet")}
            value={stats.totalDebt > 0 ? `${t("commission_owed")}: ${stats.totalDebt.toLocaleString()} FBU` : null}
            onPress={() => router.push("/wallet")}
            isLast
          />
        </Section>

        {/* Vehicle Section */}
        <Section title={t("vehicle")?.toUpperCase() || "VEHICLE"}>
          <ProfileItem
            icon={Car}
            label={t("vehicle_info")}
            value={getVehicleDisplay()}
            onPress={() => { }}
          />
          <ProfileItem
            icon={Shield}
            label={t("documents") || "Documents"}
            value={documentsStatus}
            onPress={() => { }}
            isLast
          />
        </Section>

        {/* App Settings Section */}
        <Section title={t("support_legal")?.toUpperCase()}>
          <ProfileItem
            icon={Languages}
            label={t("language")}
            value={i18n.language === "en" ? "English" : "Français"}
            onPress={toggleLanguage}
          />
          <ProfileItem
            icon={Bell}
            label={t("notifications")}
            isSwitch
            switchValue={true}
            onValueChange={() => { }}
          />
          <ProfileItem
            icon={HelpCircle}
            label={t("help_center")}
            onPress={() => router.push("/support")}
            isLast
          />
        </Section>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <LogOut size={20} color={Colors.error} />
          <Text style={styles.logoutText}>{t("logout")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    color: "black",
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  avatarContainer: {
    position: "relative",
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  editBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "black",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: "#1F2937",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statusText: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    borderRightWidth: 1,
    borderRightColor: "#F3F4F6",
  },
  statValue: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: "#1F2937",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    color: "#9CA3AF",
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
    color: "#6B7280",
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: "white",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  profileItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  itemLabel: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: "#1F2937",
  },
  itemValueText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
    marginTop: 1,
  },
  itemRight: {
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  logoutText: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.error,
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    marginTop: 24,
  },
  versionText: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "#9CA3AF",
  },
  copyrightText: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    color: "#D1D5DB",
    marginTop: 4,
  },
  badge: {
    position: "absolute",
    right: -6,
    top: -6,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  badgeText: {
    color: "white",
    fontSize: 9,
    fontFamily: "Poppins_700Bold",
  },
});
