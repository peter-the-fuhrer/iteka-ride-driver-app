import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import MapboxMap, { type MapboxMapRef, type MapStyleType } from "../../components/Map/MapboxMap";
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
    setActiveRide,
    setRideHistory,
    updateStats,
  } = useDriverStore();

  const { driver } = useAuthStore();
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyleType>("streets");

  const bottomSheetRef = useRef<BottomSheet>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const mapRef = useRef<MapboxMapRef>(null);
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
        if (active) setActiveRide(mapTripToActiveRide(active));
        if (historyRes?.rides?.length) setRideHistory(historyRes.rides.map(mapTripToRideHistory));
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
    return () => { cancelled = true; };
  }, [driver?._id]);

  // Listen for ride requests via Socket.IO
  useEffect(() => {
    const handleNewRideRequest = (trip: Trip) => {
      console.log("New ride request received:", trip);

      // Convert backend Trip to RideRequest format
      const clientData = typeof trip.client_id === 'object' ? trip.client_id : null;

      const request: RideRequest = {
        id: trip._id,
        customerId: clientData?._id || (typeof trip.client_id === 'string' ? trip.client_id : ''),
        customerName: clientData?.name || "Customer",
        customerRating: clientData?.rating || 4.5,
        customerPhone: clientData?.phone || "",
        pickupLocation: {
          address: trip.pickup.address,
          coordinates: { latitude: trip.pickup.lat, longitude: trip.pickup.lng },
        },
        dropoffLocation: {
          address: trip.destination.address,
          coordinates: { latitude: trip.destination.lat, longitude: trip.destination.lng },
        },
        estimatedFare: trip.price,
        distance: trip.distance / 1000, // Convert to km
        duration: Math.round(trip.distance / 500), // Estimate duration
        requestTime: trip.createdAt,
      };

      setCurrentTripId(trip._id);
      setRideRequest(request);
    };

    if (isOnline) {
      // Join driver room to receive ride requests
      if (driver?._id) {
        joinDriverRoom(driver._id);
      }
      subscribeToEvent("new_ride_request", handleNewRideRequest);
    }

    return () => {
      unsubscribeFromEvent("new_ride_request", handleNewRideRequest);
    };
  }, [isOnline, driver?._id]);

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
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          useAlertStore.getState().showAlert({
            title: t("error") || "Location Permission Required",
            message: "Please enable location access in settings to go online.",
            type: "error",
          });
          return;
        }

        // One-time initial position for map zoom
        const initial = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        const { latitude: lat0, longitude: lng0 } = initial.coords;
        setCurrentLocation({ latitude: lat0, longitude: lng0 });
        socketUpdateLocation(driver._id, lat0, lng0);
        if (!hasZoomedToLocation.current && mapRef.current) {
          hasZoomedToLocation.current = true;
          mapRef.current.animateToRegion({
            latitude: lat0,
            longitude: lng0,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000);
        }

        // Subscribe to location updates (OS-driven: updates on move or at most every 10s)
        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000,   // at most every 10s when stationary
            distanceInterval: 15,  // or when moved ~15m (reduces updates when parked)
          },
          (loc) => {
            if (cancelled) return;
            const { latitude, longitude } = loc.coords;
            setCurrentLocation({ latitude, longitude });
            socketUpdateLocation(driver._id, latitude, longitude);
          }
        );
        locationSubscriptionRef.current = sub;
      } catch (error) {
        console.error("Error setting up location tracking:", error);
        if (!currentLocation) {
          setCurrentLocation({
            latitude: -3.3822,
            longitude: 29.3644,
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
    };
  }, [isOnline, driver?._id]);

  // Zoom to current location when it becomes available
  useEffect(() => {
    if (currentLocation && mapRef.current && !hasZoomedToLocation.current) {
      hasZoomedToLocation.current = true;
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01, // Zoom level - smaller = more zoomed in
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [currentLocation]);

  const handleAccept = async () => {
    if (!currentTripId) return;
    try {
      const trip = await apiAcceptRide(currentTripId);
      setActiveRide(mapTripToActiveRide(trip));
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
          message: "Location permission is required to go online. Please enable location access in settings.",
          type: "error",
        });
        return;
      }

      // Get current location
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = loc.coords;
      setCurrentLocation({ latitude, longitude });
      
      // Zoom to location immediately when going online
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01, // Zoom level - smaller = more zoomed in
          longitudeDelta: 0.01,
        }, 1000);
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
              try {
                // Call API to update status with current location
                await updateStatus({
                  is_online: true,
                  lat: latitude,
                  lng: longitude,
                });
                setOnlineStatus(true);

                // Join driver room for ride requests
                if (driver?._id) {
                  joinDriverRoom(driver._id);
                }
              } catch (error: any) {
                console.error("Failed to go online:", error);
                useAlertStore.getState().showAlert({
                  title: t("error") || "Error",
                  message: error.message || "Failed to go online",
                  type: "error",
                });
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
            onDecline={declineRide}
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
            ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude }
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
            const next: MapStyleType = mapStyle === "streets" ? "satellite" : mapStyle === "satellite" ? "hybrid" : "streets";
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
                800
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
});
