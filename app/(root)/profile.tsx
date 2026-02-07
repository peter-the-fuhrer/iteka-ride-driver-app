import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  User,
  Car,
  FileText,
  Settings as SettingsIcon,
  LogOut,
  ChevronRight,
  Shield,
  Bell,
  Languages,
  Moon,
  Wallet,
  HelpCircle,
} from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { useRouter } from "expo-router";
import { useDriverStore } from "../../store/driverStore";
import { useAuthStore } from "../../store/authStore";
import { useEffect, useState } from "react";
import api from "../../services/api";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { stats } = useDriverStore();
  const { driver } = useAuthStore();
  const [driverProfile, setDriverProfile] = useState<any>(null);
  const [documentsStatus, setDocumentsStatus] = useState<string>("");

  // Fetch full driver profile with documents
  useEffect(() => {
    const fetchDriverProfile = async () => {
      if (!driver?._id) return;
      try {
        // Try to get full driver profile - if endpoint doesn't exist, use driver from auth store
        const response = await api.get(`/drivers/${driver._id}`);
        setDriverProfile(response.data);
        
        // Check document status
        const docs = response.data?.documents || {};
        const hasAllDocs = docs.id_card_front && docs.id_card_back && docs.license && docs.registration;
        const hasSomeDocs = docs.id_card_front || docs.id_card_back || docs.license || docs.registration;
        
        if (hasAllDocs) {
          setDocumentsStatus(t("verified") || "Verified");
        } else if (hasSomeDocs) {
          setDocumentsStatus(t("pending") || "Pending");
        } else {
          setDocumentsStatus(t("action_required") || "Action Required");
        }
      } catch (error) {
        // If endpoint doesn't exist or fails, use driver from auth store
        console.log("Could not fetch full profile, using auth store data");
        const docs = driver?.documents || {};
        const hasAllDocs = docs.id_card_front && docs.id_card_back && docs.license && docs.registration;
        const hasSomeDocs = docs.id_card_front || docs.id_card_back || docs.license || docs.registration;
        
        if (hasAllDocs) {
          setDocumentsStatus(t("verified") || "Verified");
        } else if (hasSomeDocs) {
          setDocumentsStatus(t("pending") || "Pending");
        } else {
          setDocumentsStatus(t("action_required") || "Action Required");
        }
      }
    };
    fetchDriverProfile();
  }, [driver?._id, t]);

  const ProfileItem = ({
    icon: Icon,
    label,
    value,
    onPress,
    isSwitch,
    switchValue,
    onValueChange,
  }: any) => (
    <TouchableOpacity
      style={styles.profileItem}
      onPress={onPress}
      disabled={isSwitch}
    >
      <View style={styles.itemLeft}>
        <View style={styles.iconWrapper}>
          <Icon size={20} color={Colors.gray[600]} />
        </View>
        <Text style={styles.itemLabel}>{label}</Text>
      </View>
      <View style={styles.itemRight}>
        {isSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onValueChange}
            trackColor={{ false: Colors.gray[200], true: Colors.primary }}
          />
        ) : (
          <>
            {value && <Text style={styles.itemValue}>{value}</Text>}
            <ChevronRight size={20} color={Colors.gray[400]} />
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  const toggleLanguage = () => {
    const nextLng = i18n.language === "en" ? "fr" : "en";
    i18n.changeLanguage(nextLng);
  };

  // Get vehicle display name
  const getVehicleDisplay = () => {
    if (driverProfile?.vehicle_plate) {
      return driverProfile.vehicle_plate;
    }
    if (driver?.vehicle_plate) {
      return driver.vehicle_plate;
    }
    if (driverProfile?.vehicle_type || driver?.vehicle_type) {
      return (driverProfile?.vehicle_type || driver?.vehicle_type)?.charAt(0).toUpperCase() + 
             (driverProfile?.vehicle_type || driver?.vehicle_type)?.slice(1);
    }
    return t("no_vehicle") || "No Vehicle";
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("profile")}</Text>
        <TouchableOpacity onPress={() => router.push("/notifications")}>
          <Bell size={24} color={Colors.black} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarPlaceholder}>
              <User size={40} color={Colors.gray[400]} />
            </View>
            <TouchableOpacity style={styles.editAvatar}>
              <Text style={styles.editAvatarText}>{t("edit")}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.driverName}>
            {driverProfile?.name || driver?.name || t("driver_name_default")}
          </Text>
          <Text style={styles.driverRating}>
            ⭐ {(driverProfile?.rating || driver?.rating || 0).toFixed(1)} • {driver?.status === "active" ? t("verified") : t("pending")}
          </Text>
        </View>

        {/* Info Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("account")}</Text>
          <ProfileItem
            icon={User}
            label={t("personal_info")}
            value={driverProfile?.name || driver?.name || ""}
          />
          <ProfileItem
            icon={Wallet}
            label={t("wallet")}
            value={`${stats.netBalance.toLocaleString()} FBU`}
            onPress={() => router.push("/wallet")}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("vehicle_and_docs")}</Text>
          <ProfileItem
            icon={Car}
            label={t("my_vehicles")}
            value={getVehicleDisplay()}
            onPress={() => router.push("/vehicles")}
          />
          <ProfileItem
            icon={FileText}
            label={t("documents")}
            value={documentsStatus}
            onPress={() => router.push("/documents")}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("settings")}</Text>
          <ProfileItem
            icon={HelpCircle}
            label={t("support")}
            onPress={() => router.push("/support")}
          />
          <ProfileItem
            icon={Languages}
            label={t("language")}
            value={i18n.language.toUpperCase()}
            onPress={toggleLanguage}
          />
          <ProfileItem
            icon={Moon}
            label={t("dark_mode")}
            isSwitch
            switchValue={false}
          />
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => router.replace("/auth/login")}
        >
          <LogOut size={20} color={Colors.error} />
          <Text style={styles.logoutText}>{t("logout")}</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>{t("version")} 1.0.0</Text>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.gray[50],
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  editAvatar: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  editAvatarText: {
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
  },
  driverName: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
  },
  driverRating: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: Colors.gray[500],
    marginTop: 4,
  },
  section: {
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.gray[400],
    textTransform: "uppercase",
    marginBottom: 12,
    marginLeft: 4,
  },
  profileItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.gray[50],
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  itemLabel: {
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
    color: Colors.black,
  },
  itemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemValue: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.gray[500],
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 40,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.1)",
  },
  logoutText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.error,
  },
  versionText: {
    textAlign: "center",
    marginTop: 24,
    color: Colors.gray[400],
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
  },
});
