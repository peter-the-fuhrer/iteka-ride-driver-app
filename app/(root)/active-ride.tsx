import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  Phone,
  MessageSquare,
  Navigation as NavIcon,
  ArrowLeft,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Navigation,
} from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { useDriverStore } from "../../store/driverStore";
import { useAlertStore } from "../../store/alertStore";
import { useRouter } from "expo-router";

export default function ActiveRide() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const { activeRide, updateRideStatus, completeRide, cancelRide } =
    useDriverStore();

  if (!activeRide) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text>No active ride</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ marginTop: 20, color: Colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleAction = () => {
    if (activeRide.status === "accepted") {
      updateRideStatus("arrived");
    } else if (activeRide.status === "arrived") {
      updateRideStatus("started");
    } else if (activeRide.status === "started") {
      useAlertStore.getState().showAlert({
        title: t("alert_complete_trip_title"),
        message: t("alert_complete_trip_msg"),
        type: "success",
        buttons: [
          { text: t("cancel"), style: "cancel" },
          {
            text: t("yes_complete"),
            onPress: () => {
              completeRide(activeRide.estimatedFare);
              router.replace("/(root)");
            },
          },
        ],
      });
    }
  };

  const handleCancel = () => {
    useAlertStore.getState().showAlert({
      title: t("alert_cancel_trip_title"),
      message: t("alert_cancel_trip_msg"),
      type: "warning",
      buttons: [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("yes_cancel"),
          style: "destructive",
          onPress: () => {
            cancelRide();
            router.replace("/(root)");
          },
        },
      ],
    });
  };

  const getActionButtonText = () => {
    switch (activeRide.status) {
      case "accepted":
        return t("arrived_at_pickup");
      case "arrived":
        return t("start_trip");
      case "started":
        return t("complete_trip");
      default:
        return "";
    }
  };

  const getStatusBadgeColor = () => {
    switch (activeRide.status) {
      case "accepted":
        return Colors.info;
      case "arrived":
        return Colors.warning;
      case "started":
        return Colors.success;
      default:
        return Colors.gray[500];
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={Colors.black} />
        </TouchableOpacity>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusBadgeColor() + "20" },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusBadgeColor() },
            ]}
          />
          <Text style={[styles.statusText, { color: getStatusBadgeColor() }]}>
            {t(`status_${activeRide.status}`)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Map Placeholder */}
        <View style={styles.mapPlaceholder}>
          <Navigation size={40} color={Colors.gray[300]} />
          <Text style={styles.mapText}>Navigation Map View</Text>

          <TouchableOpacity style={styles.openNavButton}>
            <NavIcon size={18} color={Colors.black} />
            <Text style={styles.openNavText}>{t("navigate")}</Text>
          </TouchableOpacity>
        </View>

        {/* Customer Card */}
        <View style={styles.card}>
          <View style={styles.customerRow}>
            <View style={styles.avatar}>
              <User size={24} color={Colors.gray[400]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{activeRide.customerName}</Text>
              <Text style={styles.customerRating}>
                ⭐ {activeRide.customerRating}
              </Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.circleButton, { backgroundColor: "#f0fdf4" }]}
              >
                <MessageSquare size={20} color={Colors.success} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.circleButton, { backgroundColor: "#eff6ff" }]}
              >
                <Phone size={20} color={Colors.info} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Trip Details */}
          <View style={styles.locationContainer}>
            <View style={styles.locationRow}>
              <View style={[styles.dot, { backgroundColor: Colors.info }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.locationLabel}>{t("pickup_location")}</Text>
                <Text style={styles.locationText} numberOfLines={1}>
                  {activeRide.pickupLocation.address}
                </Text>
              </View>
            </View>
            <View style={styles.connector} />
            <View style={styles.locationRow}>
              <View style={[styles.dot, { backgroundColor: Colors.black }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.locationLabel}>
                  {t("dropoff_location")}
                </Text>
                <Text style={styles.locationText} numberOfLines={1}>
                  {activeRide.dropoffLocation.address}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.fareRow}>
            <View style={styles.fareItem}>
              <Text style={styles.fareLabel}>{t("estimated_fare")}</Text>
              <Text style={styles.fareValue}>
                {activeRide.estimatedFare.toLocaleString()} FBU
              </Text>
            </View>
            <View style={styles.fareDivider} />
            <View style={styles.fareItem}>
              <Text style={styles.fareLabel}>{t("distance")}</Text>
              <Text style={styles.fareValue}>{activeRide.distance} km</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}
      >
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <XCircle size={20} color={Colors.error} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mainActionButton}
          onPress={handleAction}
        >
          <Text style={styles.mainActionButtonText}>
            {getActionButtonText()}
          </Text>
          <CheckCircle2 size={24} color={Colors.black} />
        </TouchableOpacity>
      </View>
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
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gray[50],
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    textTransform: "uppercase",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  mapPlaceholder: {
    width: "100%",
    height: 300,
    backgroundColor: Colors.gray[50],
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  mapText: {
    marginTop: 12,
    color: Colors.gray[400],
    fontFamily: "Poppins_500Medium",
  },
  openNavButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: Colors.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  openNavText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
  },
  card: {
    margin: 20,
    padding: 20,
    backgroundColor: Colors.white,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray[50],
    justifyContent: "center",
    alignItems: "center",
  },
  customerName: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
  },
  customerRating: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: Colors.gray[500],
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray[100],
    marginVertical: 20,
  },
  locationContainer: {
    gap: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  locationLabel: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.gray[400],
    textTransform: "uppercase",
  },
  locationText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: Colors.gray[800],
  },
  connector: {
    width: 2,
    height: 20,
    backgroundColor: Colors.gray[100],
    marginLeft: 4,
    borderStyle: "dashed",
    borderRadius: 1,
  },
  fareRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  fareItem: {
    flex: 1,
  },
  fareLabel: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.gray[500],
    marginBottom: 4,
  },
  fareValue: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.black,
  },
  fareDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.gray[100],
    marginHorizontal: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: 20,
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  cancelButton: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.1)",
  },
  mainActionButton: {
    flex: 1,
    height: 60,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  mainActionButtonText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.black,
  },
});
