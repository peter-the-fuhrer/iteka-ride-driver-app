import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Power, MapPin, DollarSign, Star, Clock } from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { useDriverStore, RideRequest } from "../../store/driverStore";
import { useAlertStore } from "../../store/alertStore";
import { useRouter } from "expo-router";
import RideRequestCard from "../../components/home/RideRequestCard";
import { useEffect } from "react";

export default function Home() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const {
    isOnline,
    stats,
    setOnlineStatus,
    rideRequest,
    setRideRequest,
    acceptRide,
    declineRide,
  } = useDriverStore();

  // Simulate ride request for demo purposes
  useEffect(() => {
    if (isOnline && !rideRequest) {
      const timer = setTimeout(() => {
        const mockRequest: RideRequest = {
          id: "123",
          customerId: "c1",
          customerName: "Alice Walker",
          customerRating: 4.8,
          customerPhone: "+257 71 234 567",
          pickupLocation: {
            address: "Boulevard de l'Uprona, Bujumbura",
            coordinates: { latitude: -3.38, longitude: 29.36 },
          },
          dropoffLocation: {
            address: "Avenue du Large, Bujumbura",
            coordinates: { latitude: -3.4, longitude: 29.35 },
          },
          estimatedFare: 12500,
          distance: 4.2,
          duration: 12,
          requestTime: new Date().toISOString(),
        };
        setRideRequest(mockRequest);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, rideRequest]);

  const handleAccept = () => {
    acceptRide();
    router.push("/(root)/active-ride");
  };

  const handleToggleOnline = () => {
    if (isOnline) {
      useAlertStore.getState().showAlert({
        title: t("alert_go_offline_title"),
        message: t("alert_go_offline_msg"),
        type: "warning",
        buttons: [
          { text: t("no_stay_online"), style: "cancel" },
          {
            text: t("yes_go_offline"),
            style: "destructive",
            onPress: () => setOnlineStatus(false),
          },
        ],
      });
    } else {
      useAlertStore.getState().showAlert({
        title: t("alert_go_online_title"),
        message: t("alert_go_online_msg"),
        type: "info",
        buttons: [
          { text: t("no_stay_offline"), style: "cancel" },
          {
            text: t("yes_go_online"),
            onPress: () => setOnlineStatus(true),
          },
        ],
      });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{t("welcome")}</Text>
          <Text style={styles.driverName}>Captain</Text>
        </View>
        <TouchableOpacity
          onPress={handleToggleOnline}
          style={[
            styles.statusButton,
            isOnline ? styles.statusButtonOnline : styles.statusButtonOffline,
          ]}
        >
          <Power size={18} color={isOnline ? "#22c55e" : "#6b7280"} />
          <Text
            style={[
              styles.statusText,
              isOnline ? styles.statusTextOnline : styles.statusTextOffline,
            ]}
          >
            {isOnline ? t("online") : t("offline")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Earnings Card */}
      <View style={styles.earningsCard}>
        <View style={styles.earningsHeader}>
          <Text style={styles.earningsLabel}>{t("earnings_today")}</Text>
          <DollarSign size={24} color={Colors.primary} />
        </View>
        <Text style={styles.earningsAmount}>
          {stats.todayEarnings.toLocaleString()} FBU
        </Text>
        <View style={styles.earningsStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.todayRides}</Text>
            <Text style={styles.statLabel}>{t("total_rides")}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {stats.hoursOnline.toFixed(1)}h
            </Text>
            <Text style={styles.statLabel}>{t("hours_online")}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.rating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>{t("rating")}</Text>
          </View>
        </View>
      </View>

      {/* Status Message */}
      <View style={styles.statusMessage}>
        {isOnline ? (
          <>
            <View style={styles.pulsingDot} />
            <Text style={styles.statusMessageText}>
              {t("you_are_online")} - Waiting for ride requests...
            </Text>
          </>
        ) : (
          <>
            <MapPin size={20} color="#9ca3af" />
            <Text style={styles.statusMessageTextOffline}>
              {t("you_are_offline")} - Go online to start earning
            </Text>
          </>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconWrapper}>
              <DollarSign size={20} color={Colors.primary} />
            </View>
            <Text style={styles.statCardValue}>
              {stats.weeklyEarnings.toLocaleString()}
            </Text>
            <Text style={styles.statCardLabel}>{t("this_week")}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconWrapper}>
              <DollarSign size={20} color={Colors.primary} />
            </View>
            <Text style={styles.statCardValue}>
              {stats.monthlyEarnings.toLocaleString()}
            </Text>
            <Text style={styles.statCardLabel}>{t("this_month")}</Text>
          </View>
        </View>
      </View>

      {/* Ride Request Card Overlay */}
      {rideRequest && (
        <View style={styles.requestOverlay}>
          <RideRequestCard
            request={rideRequest}
            onAccept={handleAccept}
            onDecline={declineRide}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  requestOverlay: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 20 : 10,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#6b7280",
  },
  driverName: {
    fontSize: 24,
    fontFamily: "Poppins_600SemiBold",
    color: "black",
  },
  statusButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusButtonOnline: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderColor: "#22c55e",
  },
  statusButtonOffline: {
    backgroundColor: "#f9fafb",
    borderColor: "#e5e7eb",
  },
  statusText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  statusTextOnline: {
    color: "#22c55e",
  },
  statusTextOffline: {
    color: "#6b7280",
  },
  earningsCard: {
    margin: 20,
    padding: 20,
    backgroundColor: "#f9fafb",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  earningsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  earningsLabel: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#6b7280",
  },
  earningsAmount: {
    fontSize: 36,
    fontFamily: "Poppins_700Bold",
    color: "black",
    marginBottom: 16,
  },
  earningsStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "black",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: "#9ca3af",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e5e7eb",
  },
  statusMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    marginBottom: 24,
  },
  pulsingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22c55e",
  },
  statusMessageText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#22c55e",
  },
  statusMessageTextOffline: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#6b7280",
  },
  quickActions: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "black",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    alignItems: "center",
  },
  statIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(254, 202, 5, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statCardValue: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    color: "black",
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#6b7280",
    textAlign: "center",
  },
});
