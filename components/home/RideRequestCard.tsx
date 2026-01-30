import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { useTranslation } from "react-i18next";
import { X, Navigation, Star } from "lucide-react-native";
import { RideRequest } from "../../store/driverStore";
import { Colors } from "../../constants/Colors";

interface Props {
  request: RideRequest;
  onAccept: () => void;
  onDecline: () => void;
}

const { width } = Dimensions.get("window");

export default function RideRequestCard({
  request,
  onAccept,
  onDecline,
}: Props) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (timeLeft === 0) {
      onDecline();
    }
  }, [timeLeft, onDecline]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header with Decline Button */}
      <View style={styles.header}>
        <View style={styles.tagContainer}>
          <Text style={styles.tagText}>{t("exclusive")}</Text>
        </View>
        <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
          <X size={24} color={Colors.black} />
        </TouchableOpacity>
      </View>

      {/* Main Fare Display */}
      <View style={styles.fareContainer}>
        <Text style={styles.currency}>FBU</Text>
        <Text style={styles.fareAmount}>
          {request.estimatedFare.toLocaleString()}
        </Text>
      </View>

      {/* Trip Summary */}
      <View style={styles.tripSummary}>
        <Text style={styles.summaryText}>
          {t("min_total", { count: request.duration })} •{" "}
          {t("km_total", { count: request.distance })}
        </Text>
      </View>

      {/* Location Timeline */}
      <View style={styles.locationContainer}>
        {/* Pickup */}
        <View style={styles.locationRow}>
          <View style={styles.iconColumn}>
            <View style={styles.pickupDot} />
            <View style={styles.line} />
          </View>
          <View style={styles.addressColumn}>
            <Text style={styles.addressLabel}>{t("pickup")}</Text>
            <Text style={styles.addressText} numberOfLines={2}>
              {request.pickupLocation.address}
            </Text>
          </View>
        </View>

        {/* Dropoff */}
        <View style={styles.locationRow}>
          <View style={styles.iconColumn}>
            <View style={styles.dropoffSquare} />
          </View>
          <View style={styles.addressColumn}>
            <Text style={styles.addressLabel}>{t("dropoff")}</Text>
            <Text style={styles.addressText} numberOfLines={2}>
              {request.dropoffLocation.address}
            </Text>
          </View>
        </View>
      </View>

      {/* Customer Info (Optional/Subtle) */}
      <View style={styles.customerInfo}>
        <Text style={styles.ratingText}>
          {request.customerRating}{" "}
          <Star size={12} color={Colors.black} fill={Colors.black} />
        </Text>
        <Text style={styles.customerName}>
          {request.customerName} ({t("rider")})
        </Text>
      </View>

      {/* Accept Button */}
      <TouchableOpacity
        style={styles.acceptButton}
        onPress={onAccept}
        activeOpacity={0.8}
      >
        <Text style={styles.acceptText}>{t("accept_ride")}</Text>
        <Text style={styles.timerSubtext}>{timeLeft}s</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    // Shadow for elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  tagContainer: {
    backgroundColor: Colors.black,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  declineButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  fareContainer: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 4,
  },
  currency: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
    marginTop: 8,
    marginRight: 4,
  },
  fareAmount: {
    fontSize: 48,
    fontFamily: "Poppins_700Bold",
    color: Colors.black,
  },
  tripSummary: {
    alignItems: "center",
    marginBottom: 24,
  },
  summaryText: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: Colors.gray[500],
  },
  locationContainer: {
    marginBottom: 24,
  },
  locationRow: {
    flexDirection: "row",
    minHeight: 50,
  },
  iconColumn: {
    width: 30,
    alignItems: "center",
    paddingTop: 6,
  },
  addressColumn: {
    flex: 1,
    paddingBottom: 16,
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success, // Green for pickup
  },
  dropoffSquare: {
    width: 12,
    height: 12,
    backgroundColor: Colors.black, // Black for dropoff
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: 4,
  },
  addressLabel: {
    fontSize: 12,
    color: Colors.gray[400],
    fontFamily: "Poppins_500Medium",
    marginBottom: 2,
  },
  addressText: {
    fontSize: 16,
    color: Colors.black,
    fontFamily: "Poppins_500Medium",
    lineHeight: 22,
  },
  customerInfo: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  customerName: {
    fontSize: 14,
    color: Colors.gray[600],
    fontFamily: "Poppins_500Medium",
  },
  acceptButton: {
    backgroundColor: Colors.primary,
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  acceptText: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    color: Colors.black,
  },
  timerSubtext: {
    position: "absolute",
    right: 20,
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "rgba(0,0,0,0.5)",
  },
});
