import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  Platform,
  Vibration,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import MapboxMap, {
  type MapboxMapRef,
  type MapStyleType,
} from "../../components/Map/MapboxMap";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Power, Layers, LocateFixed } from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { useDriverStore, RideRequest } from "../../store/driverStore";
import { useAuthStore } from "../../store/authStore";
import { useAlertStore } from "../../store/alertStore";
import { useRouter } from "expo-router";
import RideRequestCard from "../../components/home/RideRequestCard";
import GoButton from "../../components/common/GoButton";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import * as Location from "expo-location";
import {
  subscribeToEvent,
  unsubscribeFromEvent,
  joinDriverRoom,
  joinRideRoom,
  updateLocation as socketUpdateLocation,
} from "../../services/socket";
import {
  updateStatus,
  acceptRide as apiAcceptRide,
  getActiveRide,
  getRideHistory,
  getEarnings,
  mapTripToActiveRide,
  mapTripToRideHistory,
  Trip,
} from "../../services/driver";

const { width, height } = Dimensions.get("window");

// Constants for animations
const PULSE_DURATION = 2000;

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
    currentLocation,
    setCurrentLocation,
    activeRide,
    setActiveRide,
    setRideHistory,
    updateStats,
  } = useDriverStore();

  const { driver } = useAuthStore();
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyleType>("streets");
  const [isOnlineLoading, setIsOnlineLoading] = useState(false);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(
    null,
  );
  const mapRef = useRef<MapboxMapRef>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(true);
  const locationStatusIntervalRef = useRef<any>(null);
  const hasZoomedToLocation = useRef(false);

  // Snap points
  const snapPoints = useMemo(() => {
    return rideRequest ? ["50%"] : ["25%"];
  }, [rideRequest]);

  // Expand or collapse based on state
  useEffect(() => {
    if (rideRequest) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.snapToIndex(0);
    }
  }, [rideRequest]);

  // Pulse animation for waiting state
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Setup Pulse Loop
  useEffect(() => {
    if (isOnline && !rideRequest) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: PULSE_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [isOnline, rideRequest]);

  // Fetch active ride, ride history, and earnings when driver is logged in
  useEffect(() => {
    if (!driver?._id) return;
    let cancelled = false;
    (async () => {
      try {
        const [active, historyRes, earnings] = await Promise.all([
          getActiveRide(),
          getRideHistory({ limit: 50 }),
          getEarnings(),
        ]);
        if (cancelled) return;
        if (active) {
          setActiveRide(mapTripToActiveRide(active));
          joinRideRoom(active._id);
          // Auto-navigate to active ride if we are on this screen
          router.replace("/(root)/active-ride");
        }
        if (historyRes?.rides?.length)
          setRideHistory(historyRes.rides.map(mapTripToRideHistory));
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
        if (active) router.replace("/(root)/active-ride");
      } catch (_) {
        // Ignore; user may be offline or API not ready
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [driver?._id]);

  // Strict Auto-Resume: Redirect to active ride if one exists
  useEffect(() => {
    if (activeRide && !rideRequest) {
      router.replace("/(root)/active-ride");
    }
  }, [activeRide?.id, rideRequest]);

  // Listen for ride requests via Socket.IO
  useEffect(() => {
    const handleNewRideRequest = (trip: Trip) => {
      console.log("New ride request received:", trip);

      // Convert backend Trip to RideRequest format
      const clientData =
        typeof trip.client_id === "object" ? trip.client_id : null;

      const request: RideRequest = {
        id: trip._id,
        customerId:
          clientData?._id ||
          (typeof trip.client_id === "string" ? trip.client_id : ""),
        customerName: clientData?.name || "Customer",
        customerRating: clientData?.rating || 4.5,
        customerPhone: clientData?.phone || "",
        pickupLocation: {
          address: trip.pickup.address,
          coordinates: {
            latitude: trip.pickup.lat,
            longitude: trip.pickup.lng,
          },
        },
        dropoffLocation: {
          address: trip.destination.address,
          coordinates: {
            latitude: trip.destination.lat,
            longitude: trip.destination.lng,
          },
        },
        estimatedFare: trip.price,
        distance: trip.distance / 1000, // Convert to km
        duration: Math.round(trip.distance / 500), // Estimate duration
        requestTime: trip.createdAt,
      };

      setCurrentTripId(trip._id);
      setRideRequest(request);
      // Aggressive repeating vibration for new request
      Vibration.vibrate(
        [0, 1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000],
        true,
      );
    };

    const handleRideCancelled = (data: { tripId: string }) => {
      console.log("Ride request cancelled:", data);
      if (currentTripId === data.tripId || rideRequest?.id === data.tripId) {
        setRideRequest(null);
        setCurrentTripId(null);
        useAlertStore.getState().showAlert({
          title: t("ride_cancelled") || "Ride Cancelled",
          message:
            t("ride_cancelled_by_client") ||
            "The client has cancelled the ride.",
          type: "warning",
        });
        // Very aggressive vibration for cancellation
        Vibration.vibrate([
          0, 200, 100, 200, 100, 200, 100, 200, 100, 500, 100, 500, 100, 500,
        ]);
      }
    };

    if (isOnline) {
      subscribeToEvent("new_ride_request", handleNewRideRequest);
      subscribeToEvent("ride_cancelled", handleRideCancelled);

      if (driver?._id) {
        joinDriverRoom(driver._id);
      }
    }

    return () => {
      unsubscribeFromEvent("new_ride_request", handleNewRideRequest);
      unsubscribeFromEvent("ride_cancelled", handleRideCancelled);
    };
  }, [isOnline, driver?._id, currentTripId, rideRequest?.id]);

  // Watch GPS location when driver is online (socket-based: no polling)
  useEffect(() => {
    if (!isOnline || !driver?._id) {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // Check permission first
        const { granted } = await Location.getForegroundPermissionsAsync();
        if (!granted) {
          // Request if not granted
          const { granted: requestGranted } =
            await Location.requestForegroundPermissionsAsync();
          if (!requestGranted) {
            setIsLocationEnabled(false);
            useAlertStore.getState().showAlert({
              title: t("error") || "Location Permission Required",
              message:
                "Please enable location access in settings to go online.",
              type: "error",
            });
            return;
          }
        }

        // Request full accuracy on iOS (Precise Location)
        if (Platform.OS === "ios") {
          try {
            await Location.enableNetworkProviderAsync();
            console.log("✅ iOS Network Provider Enabled");
          } catch (e) {
            console.log("⚠️ Network provider error:", e);
          }
        }

        // Check location permission details
        const permissionDetails =
          await Location.getForegroundPermissionsAsync();
        console.log(
          "🔐 Permission Details:",
          JSON.stringify(permissionDetails, null, 2),
        );

        // Check if services are enabled
        const enabled = await Location.hasServicesEnabledAsync();
        setIsLocationEnabled(enabled);

        // One-time initial position for map zoom
        console.log("🔍 Requesting location with Accuracy.Highest...");
        let { coords } = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });

        // Expected coordinates: 3°25'44.7"S 29°21'36.5"E = -3.4291, 29.3601
        const EXPECTED_LAT = -3.4291;
        const EXPECTED_LNG = 29.3601;

        // Debug: Print coordinates
        console.log("\n========== LOCATION DEBUG ==========");
        console.log("📍 Full Coords Object:", JSON.stringify(coords, null, 2));
        console.log("\n📊 Coordinate Breakdown:");
        console.log("  Latitude:", coords.latitude);
        console.log("  Longitude:", coords.longitude);
        console.log("  Accuracy (meters):", coords.accuracy);
        console.log("  Altitude:", coords.altitude);
        console.log("  Altitude Accuracy:", coords.altitudeAccuracy);
        console.log("  Heading:", coords.heading);
        console.log("  Speed:", coords.speed);
        console.log("\n🎯 Expected Location:");
        console.log("  Latitude:", EXPECTED_LAT, "(3°25'44.7\"S)");
        console.log("  Longitude:", EXPECTED_LNG, "(29°21'36.5\"E)");
        console.log("\n� Difference from Expected:");
        console.log(
          "  Lat Diff:",
          (coords.latitude - EXPECTED_LAT).toFixed(6),
          "degrees",
        );
        console.log(
          "  Lng Diff:",
          (coords.longitude - EXPECTED_LNG).toFixed(6),
          "degrees",
        );
        const latDiffMeters = Math.abs(coords.latitude - EXPECTED_LAT) * 111000;
        const lngDiffMeters =
          Math.abs(coords.longitude - EXPECTED_LNG) *
          111000 *
          Math.cos((coords.latitude * Math.PI) / 180);
        console.log("  Lat Diff (meters):", latDiffMeters.toFixed(2));
        console.log("  Lng Diff (meters):", lngDiffMeters.toFixed(2));
        console.log(
          "  Total Distance Error:",
          Math.sqrt(latDiffMeters ** 2 + lngDiffMeters ** 2).toFixed(2),
          "meters",
        );
        console.log("\n⚠️ GPS Status:");
        const accuracy = coords.accuracy ?? 100; // Default to 100 if null
        if (accuracy > 50) {
          console.log("  ❌ POOR ACCURACY - GPS signal is weak!");
        } else if (accuracy > 20) {
          console.log("  ⚠️ FAIR ACCURACY - GPS could be better");
        } else if (accuracy > 10) {
          console.log("  ✅ GOOD ACCURACY");
        } else {
          console.log("  ✅✅ EXCELLENT ACCURACY");
        }
        console.log("====================================\n");

        if (cancelled) return;
        const { latitude: lat0, longitude: lng0, heading: head0 } = coords;
        setCurrentLocation({
          latitude: lat0,
          longitude: lng0,
          heading: head0 ?? 0,
          accuracy: 0,
        });
        socketUpdateLocation(driver._id, lat0, lng0);
        if (!hasZoomedToLocation.current && mapRef.current) {
          hasZoomedToLocation.current = true;
          mapRef.current.animateToRegion(
            {
              latitude: lat0,
              longitude: lng0,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            1000,
          );
        }

        // Subscribe to location updates
        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            timeInterval: 2000, // updates every 2s for better precision
            distanceInterval: 2, // or when moved 2m
          },
          (loc) => {
            if (cancelled) return;
            const { latitude, longitude, heading, accuracy } = loc.coords;

            // Debug: Print location updates
            console.log("🔄 Location Update:", {
              latitude,
              longitude,
              heading,
              accuracy: accuracy ?? 0,
              timestamp: new Date().toISOString(),
            });

            setCurrentLocation({
              latitude,
              longitude,
              heading: heading ?? 0,
              accuracy: accuracy ?? 0,
            });
            socketUpdateLocation(driver._id, latitude, longitude);
            setIsLocationEnabled(true); // If we get an update, it's enabled
          },
        );
        locationSubscriptionRef.current = sub;

        // Start polling for location service status
        locationStatusIntervalRef.current = setInterval(async () => {
          const isEnabled = await Location.hasServicesEnabledAsync();
          if (cancelled) return;
          setIsLocationEnabled(isEnabled);
        }, 5000);
      } catch (error) {
        console.error("Error setting up location tracking:", error);
        setIsLocationEnabled(false);
        if (!currentLocation) {
          setCurrentLocation({
            latitude: -3.3822,
            longitude: 29.3644,
            heading: 0,
            accuracy: 0,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }
      if (locationStatusIntervalRef.current) {
        clearInterval(locationStatusIntervalRef.current);
        locationStatusIntervalRef.current = null;
      }
    };
  }, [isOnline, driver?._id]);

  // Zoom to current location when it becomes available
  useEffect(() => {
    if (currentLocation && mapRef.current && !hasZoomedToLocation.current) {
      hasZoomedToLocation.current = true;
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01, // Zoom level - smaller = more zoomed in
          longitudeDelta: 0.01,
        },
        1000,
      );
    }
  }, [currentLocation]);

  const handleAccept = async () => {
    Vibration.cancel();
    if (!currentTripId) return;
    try {
      const trip = await apiAcceptRide(currentTripId);
      setActiveRide(mapTripToActiveRide(trip));
      joinRideRoom(trip._id);
      setRideRequest(null);
      setCurrentTripId(null);
      router.push("/(root)/active-ride");
    } catch (error: any) {
      useAlertStore.getState().showAlert({
        title: t("error") || "Error",
        message: error.message || "Could not accept ride",
        type: "error",
      });
    }
  };
  const handleGoOnline = async () => {
    // Request location permission and get current location before going online
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        useAlertStore.getState().showAlert({
          title: t("error") || "Permission Required",
          message:
            "Location permission is required to go online. Please enable location access in settings.",
          type: "error",
        });
        return;
      }

      // Get current location
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude, heading, accuracy } = loc.coords;
      setCurrentLocation({
        latitude,
        longitude,
        heading: heading ?? 0,
        accuracy: accuracy ?? 10,
      });

      // Zoom to location immediately when going online
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: 0.01, // Zoom level - smaller = more zoomed in
            longitudeDelta: 0.01,
          },
          1000,
        );
        hasZoomedToLocation.current = true;
      }

      // Show confirmation alert
      useAlertStore.getState().showAlert({
        title: t("alert_go_online_title"),
        message: t("alert_go_online_msg"),
        type: "info",
        buttons: [
          { text: t("cancel"), style: "cancel" },
          {
            text: t("yes_go_online"),
            onPress: async () => {
              setIsOnlineLoading(true);
              try {
                // Call API to update status with current location
                await updateStatus({
                  is_online: true,
                  lat: latitude,
                  lng: longitude,
                });
                setOnlineStatus(true);
              } catch (error: any) {
                console.error("Failed to go online:", error);
                useAlertStore.getState().showAlert({
                  title: t("error") || "Error",
                  message: error.message || "Failed to go online",
                  type: "error",
                });
              } finally {
                setIsOnlineLoading(false);
              }
            },
          },
        ],
      });
    } catch (error: any) {
      console.error("Error getting location:", error);
      useAlertStore.getState().showAlert({
        title: t("error") || "Error",
        message: "Failed to get your location. Please check location settings.",
        type: "error",
      });
    }
  };

  const handleGoOffline = () => {
    useAlertStore.getState().showAlert({
      title: t("alert_go_offline_title"),
      message: t("alert_go_offline_msg"),
      type: "warning",
      buttons: [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("yes_go_offline"),
          style: "destructive",
          onPress: async () => {
            try {
              // Call API to update status
              await updateStatus({ is_online: false });
              setOnlineStatus(false);
            } catch (error: any) {
              console.error("Failed to go offline:", error);
              // Still set offline locally
              setOnlineStatus(false);
            }
          },
        },
      ],
    });
  };

  const renderBottomSheetContent = useCallback(() => {
    if (rideRequest) {
      return (
        <BottomSheetView style={styles.sheetContentRequest}>
          <RideRequestCard
            request={rideRequest}
            onAccept={handleAccept}
            onDecline={() => {
              Vibration.cancel();
              declineRide();
            }}
          />
        </BottomSheetView>
      );
    }

    return (
      <BottomSheetView style={styles.sheetContentRequest}>
        <View style={styles.dashboardCard}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsTitle}>{t("today_summary")}</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.todayRides}</Text>
              <Text style={styles.statLabel}>{t("rides")}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {stats.hoursOnline.toFixed(1)}h
              </Text>
              <Text style={styles.statLabel}>{t("online")}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>{t("rating")}</Text>
            </View>
          </View>
        </View>
      </BottomSheetView>
    );
  }, [rideRequest, stats, t]);

  return (
    <View style={styles.container}>
      {/* Map View Background (Mapbox) */}
      <MapboxMap
        ref={mapRef}
        mapStyle={mapStyle}
        style={styles.map}
        initialRegion={{
          latitude: currentLocation?.latitude ?? -3.3822,
          longitude: currentLocation?.longitude ?? 29.3644,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        userLocation={
          currentLocation
            ? {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                heading: currentLocation.heading,
              }
            : null
        }
      />

      {/* Online Status Overlay (Searching Pulse) */}
      {isOnline && !rideRequest && (
        <View style={styles.pulseContainer} pointerEvents="none">
          <Animated.View
            style={[
              styles.pulseOrbit,
              {
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 2],
                    }),
                  },
                ],
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 0],
                }),
              },
            ]}
          />
          <View style={styles.searchingPill}>
            <View style={styles.pulsingDot} />
            <Text style={styles.searchingText}>
              {t("searching_for_rides")}...
            </Text>
          </View>
        </View>
      )}

      {/* Location Disabled Warning */}
      {isOnline && !isLocationEnabled && (
        <View style={styles.overlayWarning}>
          <View style={styles.warningCard}>
            <View style={styles.warningIconContainer}>
              <LocateFixed size={32} color={Colors.white} />
            </View>
            <Text style={styles.warningTitle}>
              {t("location_disabled") || "Location Disabled"}
            </Text>
            <Text style={styles.warningMessage}>
              {t("location_disabled_msg") ||
                "Your location is turned off. Customers won't be able to find you. Please turn it on to receive ride requests."}
            </Text>
            <TouchableOpacity
              style={styles.warningButton}
              onPress={async () => {
                if (Platform.OS === "ios") {
                  // iOS usually requires manually going to settings
                } else {
                  // For Android some intent could be used, but for simplicity:
                  await Location.hasServicesEnabledAsync();
                }
              }}
            >
              <Text style={styles.warningButtonText}>
                {t("enable_location") || "Enable Location"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Top Header Area: Earnings */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          {/* Offline Text (Only visible when offline) */}
          {!isOnline ? (
            <View style={styles.offlineTag}>
              <Text style={styles.offlineTagText}>{t("you_are_offline")}</Text>
            </View>
          ) : (
            <View />
          )}

          {/* Daily Earnings Pill */}
          <View style={styles.earningsPill}>
            <Text style={styles.earningsLabel}>{t("today")}</Text>
            <Text style={styles.earningsValue}>
              {stats.todayEarnings.toLocaleString()} FBU
            </Text>
          </View>
        </View>
      </View>

      {/* Map controls: style + my location */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.mapControlButton}
          onPress={() => {
            const next: MapStyleType =
              mapStyle === "streets"
                ? "satellite"
                : mapStyle === "satellite"
                  ? "hybrid"
                  : "streets";
            setMapStyle(next);
            mapRef.current?.setMapStyle(next);
          }}
          activeOpacity={0.8}
        >
          <Layers size={22} color={Colors.gray[700]} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.mapControlButton}
          onPress={() => {
            if (currentLocation && mapRef.current) {
              mapRef.current.animateToRegion(
                {
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                },
                800,
              );
            }
          }}
          activeOpacity={0.8}
        >
          <LocateFixed size={22} color={Colors.gray[700]} />
        </TouchableOpacity>
      </View>

      {/* Offline GO Button */}
      {!isOnline && (
        <View style={styles.goButtonContainer}>
          <GoButton onPress={handleGoOnline} />
        </View>
      )}

      {/* Online Stop Button */}
      {isOnline && !rideRequest && (
        <TouchableOpacity
          style={styles.stopButton}
          onPress={handleGoOffline}
          activeOpacity={0.8}
        >
          <Power size={24} color={Colors.white} />
        </TouchableOpacity>
      )}

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        handleIndicatorStyle={{
          backgroundColor: Colors.gray[300],
          opacity: 0, // Always hide handle for floating look
        }}
        backgroundStyle={{
          backgroundColor: "transparent",
          shadowColor: "transparent",
          elevation: 0,
        }}
      >
        {renderBottomSheetContent()}
      </BottomSheet>

      {/* Loading Modal */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={isOnlineLoading}
        onRequestClose={() => setIsOnlineLoading(false)}
      >
        <View style={styles.loadingModalContainer}>
          <View style={styles.loadingModalContent}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingModalText}>
              {t("going_online") || "Going online..."}
            </Text>
          </View>
        </View>
      </Modal>
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
    zIndex: 0,
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  offlineTag: {
    backgroundColor: Colors.black,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  offlineTagText: {
    color: Colors.white,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },
  earningsPill: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  earningsLabel: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.gray[500],
  },
  earningsValue: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
  },
  sheetContent: {
    flex: 1,
    padding: 20,
  },
  sheetContentRequest: {
    flex: 1,
    padding: 0,
    backgroundColor: "transparent",
  },
  dashboardCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20, // Floating margin
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  statsHeader: {
    marginBottom: 16,
    alignItems: "center",
  },
  statsTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.gray[800],
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: Colors.black,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: Colors.gray[400],
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.gray[100],
  },
  overlayWarning: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
    padding: 20,
  },
  warningCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  warningIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.error,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: Colors.black,
    marginBottom: 8,
    textAlign: "center",
  },
  warningMessage: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.gray[600],
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  warningButton: {
    backgroundColor: Colors.black,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  warningButtonText: {
    color: Colors.white,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
  },
  pulseContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  pulseOrbit: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(254, 202, 5, 0.3)", // Primary color with opacity
    position: "absolute",
  },
  searchingPill: {
    backgroundColor: Colors.black,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 250,
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  searchingText: {
    color: Colors.white,
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
  },
  goButtonContainer: {
    position: "absolute",
    bottom: 120, // Sit above the bottom sheet
    alignSelf: "center",
    zIndex: 20,
  },
  stopButton: {
    position: "absolute",
    bottom: 120, // Sit above the bottom sheet
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.error,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 20,
  },
  mapControls: {
    position: "absolute",
    top: 100,
    right: 16,
    zIndex: 15,
    gap: 8,
  },
  mapControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  loadingModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingModalContent: {
    backgroundColor: Colors.white,
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    gap: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  loadingModalText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: Colors.gray[800],
  },
});
