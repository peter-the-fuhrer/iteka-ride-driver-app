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
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Power } from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { useDriverStore, RideRequest } from "../../store/driverStore";
import { useAlertStore } from "../../store/alertStore";
import { useRouter } from "expo-router";
import RideRequestCard from "../../components/home/RideRequestCard";
import GoButton from "../../components/common/GoButton";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";

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
  } = useDriverStore();

  const bottomSheetRef = useRef<BottomSheet>(null);

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
      }, 5000); // 5 seconds delay
      return () => clearTimeout(timer);
    }
  }, [isOnline, rideRequest]);

  // Set initial location for demo
  useEffect(() => {
    if (!currentLocation) {
      setCurrentLocation({
        latitude: -3.3822,
        longitude: 29.3644,
      });
    }
  }, []);

  const handleAccept = () => {
    acceptRide();
    router.push("/(root)/active-ride");
  };

  const handleGoOnline = () => {
    useAlertStore.getState().showAlert({
      title: t("alert_go_online_title"),
      message: t("alert_go_online_msg"),
      type: "info",
      buttons: [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("yes_go_online"),
          onPress: () => setOnlineStatus(true),
        },
      ],
    });
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
          onPress: () => setOnlineStatus(false),
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
      {/* Map View Background */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: -3.3822,
          longitude: 29.3644,
          latitudeDelta: 0.0122,
          longitudeDelta: 0.0069,
        }}
        showsUserLocation={true}
        followsUserLocation={true}
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
    width: "100%",
    height: "100%",
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
});
