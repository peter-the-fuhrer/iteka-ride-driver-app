import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  Phone,
  MessageSquare,
  Navigation as NavIcon,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  User,
} from "lucide-react-native";
import MapboxMap, { type MapboxMapRef } from "../../components/Map/MapboxMap";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Colors } from "../../constants/Colors";
import { useDriverStore } from "../../store/driverStore";
import { useAuthStore } from "../../store/authStore";
import { useAlertStore } from "../../store/alertStore";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState, useEffect } from "react";
import * as Location from "expo-location";
import {
  updateRideState,
  getEarnings,
  getRideHistory,
  mapTripToRideHistory,
} from "../../services/driver";
import { updateLocation } from "../../services/socket";

const { width, height } = Dimensions.get("window");

// OpenRouteService Configuration
const ORS_BASE_URL = "https://api.openrouteservice.org/v2";
const ORS_API_KEY =
  "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImRjMzVkNTgzMmJjMTRlZmM5ZGNjYTBkMDhhMmUwZjNiIiwiaCI6Im11cm11cjY0In0="; // Applied user key

export default function ActiveRide() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const { driver } = useAuthStore();
  const {
    activeRide,
    updateRideStatus,
    setActiveRide,
    setRideHistory,
    updateStats,
  } = useDriverStore();

  // Driver location: real GPS when available, fallback to pickup offset
  const [driverLocation, setDriverLocation] = useState({
    latitude: -3.385,
    longitude: 29.362,
  });

  const [routeInfo, setRouteInfo] = useState({
    distance: "0 km",
    duration: "0 min",
  });
  const [routeCoordinates, setRouteCoordinates] = useState<
    Array<{ latitude: number; longitude: number }>
  >([]);
  const [carHeading, setCarHeading] = useState(0); // Car rotation angle

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["45%", "80%"], []);
  const mapRef = useRef<MapboxMapRef>(null);

  // Fetch route from OpenRouteService
  useEffect(() => {
    if (!activeRide) return;

    const destination =
      activeRide.status === "started"
        ? activeRide.dropoffLocation.coordinates
        : activeRide.pickupLocation.coordinates;

    const fetchRoute = async () => {
      try {
        const url = `${ORS_BASE_URL}/directions/driving-car?api_key=${ORS_API_KEY}&start=${driverLocation.longitude},${driverLocation.latitude}&end=${destination.longitude},${destination.latitude}`;

        const response = await fetch(url, {
          headers: {
            Accept:
              "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
          },
        });

        const data = await response.json();

        if (data.features && data.features[0]) {
          const route = data.features[0];
          const coords = route.geometry.coordinates.map((coord: number[]) => ({
            latitude: coord[1],
            longitude: coord[0],
          }));

          console.log("Route coordinates count:", coords.length);
          console.log("First coord:", coords[0]);
          console.log("Last coord:", coords[coords.length - 1]);

          setRouteCoordinates(coords);

          // Extract distance and duration
          const distanceKm = (
            route.properties.segments[0].distance / 1000
          ).toFixed(1);
          const durationMin = Math.ceil(
            route.properties.segments[0].duration / 60,
          );

          setRouteInfo({
            distance: `${distanceKm} km`,
            duration: `${durationMin} min`,
          });
        } else {
          console.log("No features in response");
        }
      } catch (error) {
        console.error("Route fetch error:", error);
        // Fallback to straight line
        const fallbackCoords = [driverLocation, destination];
        console.log("Using fallback coords:", fallbackCoords);
        setRouteCoordinates(fallbackCoords);
        setRouteInfo({ distance: "2.5 km", duration: "8 min" });
      }
    };

    fetchRoute();
  }, [activeRide?.status, driverLocation]);

  // Initialize driver location from ride when loaded (fallback until GPS available)
  useEffect(() => {
    if (activeRide && activeRide.status === "accepted") {
      setDriverLocation({
        latitude: activeRide.pickupLocation.coordinates.latitude - 0.005,
        longitude: activeRide.pickupLocation.coordinates.longitude - 0.005,
      });
    } else if (activeRide && activeRide.status === "started") {
      setDriverLocation(activeRide.pickupLocation.coordinates);
    }
  }, [activeRide?.id]);

  // Real GPS: send driver location to backend so rider sees driver on map
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!activeRide || !driver?._id) return;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const update = async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const { latitude, longitude } = loc.coords;
          setDriverLocation({ latitude, longitude });
          updateLocation(driver._id, latitude, longitude);
        } catch (e) {
          console.warn("Active ride location update failed:", e);
        }
      };

      await update();
      locationIntervalRef.current = setInterval(update, 5000);
    })();

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    };
  }, [activeRide?.id, driver?._id]);

  // Optional: animate car heading from route when we have route coords (for map rotation)
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  useEffect(() => {
    if (!activeRide || routeCoordinates.length < 2) return;
    if (activeRide.status !== "accepted" && activeRide.status !== "started")
      return;

    const interval = setInterval(() => {
      setCurrentRouteIndex((prev) => {
        if (prev >= routeCoordinates.length - 1) return prev;
        const next = prev + 1;
        const cur = routeCoordinates[prev];
        const nxt = routeCoordinates[next];
        if (cur && nxt) {
          const deltaLng = nxt.longitude - cur.longitude;
          const deltaLat = nxt.latitude - cur.latitude;
          setCarHeading(Math.atan2(deltaLng, deltaLat) * (180 / Math.PI));
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeRide?.status, routeCoordinates]);
  useEffect(() => {
    setCurrentRouteIndex(0);
  }, [routeCoordinates]);

  // Camera Follower (Mapbox flyTo)
  useEffect(() => {
    if (driverLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
    }
  }, [driverLocation]);

  if (!activeRide) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        <Text>{t("no_active_ride")}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ marginTop: 20, color: Colors.primary }}>
            {t("go_back")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleAction = async () => {
    const tripId = activeRide.id;
    setIsActionLoading(true);

    try {
      if (activeRide.status === "accepted") {
        await updateRideState(tripId, "driver_arrived");
        updateRideStatus("arrived");
      } else if (activeRide.status === "arrived") {
        await updateRideState(tripId, "ongoing");
        updateRideStatus("started");
      } else if (activeRide.status === "started") {
        setIsActionLoading(false);
        useAlertStore.getState().showAlert({
          title: t("alert_complete_trip_title"),
          message: t("alert_complete_trip_msg"),
          type: "success",
          buttons: [
            { text: t("cancel"), style: "cancel" },
            {
              text: t("yes_complete"),
              onPress: async () => {
                try {
                  await updateRideState(tripId, "completed");
                  setActiveRide(null);
                  try {
                    const [earnings, historyRes] = await Promise.all([
                      getEarnings(),
                      getRideHistory({ limit: 50 }),
                    ]);
                    if (earnings) {
                      updateStats({
                        todayEarnings: earnings.todayEarnings ?? 0,
                        todayRides: earnings.todayRides ?? 0,
                        weeklyEarnings: earnings.weeklyEarnings ?? 0,
                        monthlyEarnings: earnings.monthlyEarnings ?? 0,
                        totalDebt: earnings.totalDebt ?? 0,
                        totalEarnings: earnings.totalEarnings ?? 0,
                        netBalance: earnings.netBalance ?? 0,
                      });
                    }
                    if (historyRes?.rides?.length) {
                      setRideHistory(historyRes.rides.map(mapTripToRideHistory));
                    }
                  } catch (_) {}
                  router.replace("/(root)");
                } catch (error: any) {
                  useAlertStore.getState().showAlert({
                    title: t("error") || "Error",
                    message: error.message || "Could not complete trip",
                    type: "error",
                  });
                }
              },
            },
          ],
        });
        return;
      }
    } catch (error: any) {
      useAlertStore.getState().showAlert({
        title: t("error") || "Error",
        message: error.message || "Could not update ride status",
        type: "error",
      });
    } finally {
      setIsActionLoading(false);
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
          onPress: async () => {
            try {
              const tripId = activeRide.id;
              await updateRideState(tripId, "cancelled");
              setActiveRide(null);
              try {
                const historyRes = await getRideHistory({ limit: 50 });
                if (historyRes?.rides?.length) {
                  setRideHistory(historyRes.rides.map(mapTripToRideHistory));
                }
              } catch (_) {}
              router.replace("/(root)");
            } catch (error: any) {
              useAlertStore.getState().showAlert({
                title: t("error") || "Error",
                message: error.message || "Could not cancel trip",
                type: "error",
              });
            }
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

  // Determine Origin/Dest for Routing
  const destination =
    activeRide.status === "started"
      ? activeRide.dropoffLocation.coordinates
      : activeRide.pickupLocation.coordinates;

  return (
    <View style={styles.container}>
      {/* Map (Mapbox) */}
      <MapboxMap
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        userLocation={driverLocation}
        pickup={
          activeRide.status !== "started"
            ? activeRide.pickupLocation.coordinates
            : null
        }
        dropoff={activeRide.dropoffLocation.coordinates}
        routeCoordinates={routeCoordinates}
      />

      {/* Header */}
      <View style={[styles.header, { top: insets.top }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={Colors.black} />
        </TouchableOpacity>

        {/* Nav Info Pill */}
        <View style={styles.navPill}>
          <Text style={styles.navTime}>{routeInfo.duration}</Text>
          <Text style={styles.navDist}>{routeInfo.distance}</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusBadgeColor() + "20" },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusBadgeColor() }]}>
            {t(`status_${activeRide.status}`)}
          </Text>
        </View>
      </View>

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        handleIndicatorStyle={{ backgroundColor: Colors.gray[300] }}
        backgroundStyle={{ borderRadius: 24 }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          {/* Customer Row */}
          <View style={styles.customerSection}>
            <View style={styles.customerRow}>
              <View style={styles.avatar}>
                <User size={28} color={Colors.gray[500]} />
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>
                  {activeRide.customerName}
                </Text>
                <Text style={styles.customerRating}>
                  ⭐ {activeRide.customerRating}
                </Text>
              </View>
              <View style={styles.communicationButtons}>
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
          </View>

          <View style={styles.divider} />

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <XCircle size={24} color={Colors.error} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mainActionButton, isActionLoading && styles.mainActionButtonDisabled]}
              onPress={handleAction}
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <ActivityIndicator color={Colors.black} />
              ) : (
                <>
                  <Text style={styles.mainActionButtonText}>
                    {getActionButtonText()}
                  </Text>
                  <CheckCircle2 size={24} color={Colors.black} />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Details */}
          <View style={styles.detailsSection}>
            {/* Pickup */}
            <View style={styles.locationRow}>
              <View style={styles.iconColumn}>
                <View style={[styles.dot, { backgroundColor: Colors.info }]} />
                <View style={styles.line} />
              </View>
              <View style={styles.textColumn}>
                <Text style={styles.label}>{t("pickup")}</Text>
                <Text style={styles.address}>
                  {activeRide.pickupLocation.address}
                </Text>
              </View>
            </View>

            {/* Dropoff */}
            <View style={styles.locationRow}>
              <View style={styles.iconColumn}>
                <View style={[styles.dot, { backgroundColor: Colors.black }]} />
              </View>
              <View style={styles.textColumn}>
                <Text style={styles.label}>{t("dropoff")}</Text>
                <Text style={styles.address}>
                  {activeRide.dropoffLocation.address}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{t("estimated_fare")}</Text>
              <Text style={styles.statValue}>
                {activeRide.estimatedFare.toLocaleString()} FBU
              </Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{t("distance")}</Text>
              <Text style={styles.statValue}>{activeRide.distance} km</Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: "absolute",
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  navPill: {
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: Colors.black,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  navTime: {
    color: Colors.white,
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
  },
  navDist: {
    color: Colors.gray[400],
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    textTransform: "uppercase",
  },
  sheetContent: {
    padding: 24,
  },
  customerSection: {
    marginBottom: 10,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.black,
  },
  customerRating: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: Colors.gray[500],
    marginTop: 2,
  },
  communicationButtons: {
    flexDirection: "row",
    gap: 12,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray[100],
    marginVertical: 20,
  },
  actionSection: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
  },
  mainActionButton: {
    flex: 1,
    height: 60,
    backgroundColor: Colors.primary,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  mainActionButtonDisabled: {
    opacity: 0.7,
  },
  mainActionButtonText: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.black,
  },
  detailsSection: {
    marginBottom: 20,
  },
  locationRow: {
    flexDirection: "row",
    minHeight: 60,
  },
  iconColumn: {
    width: 24,
    alignItems: "center",
    paddingTop: 4,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.gray[200],
    marginVertical: 4,
  },
  textColumn: {
    flex: 1,
    marginLeft: 12,
  },
  label: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: Colors.gray[400],
    marginBottom: 2,
  },
  address: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: Colors.black,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: 16,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: Colors.gray[500],
  },
  statValue: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.black,
    marginTop: 4,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: Colors.gray[200],
  },
});
