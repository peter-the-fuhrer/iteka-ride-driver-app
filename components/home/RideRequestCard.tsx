import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useTranslation } from "react-i18next";
import { MapPin, Clock, DollarSign, User, X, Check } from "lucide-react-native";
import { RideRequest } from "../../store/driverStore";
import { Colors } from "../../constants/Colors";

interface Props {
  request: RideRequest;
  onAccept: () => void;
  onDecline: () => void;
}

export default function RideRequestCard({
  request,
  onAccept,
  onDecline,
}: Props) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(30);
  const progress = new Animated.Value(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    Animated.timing(progress, {
      toValue: 0,
      duration: 30000,
      useNativeDriver: false,
    }).start();

    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Timer Progress Bar */}
      <View style={styles.progressBarBg}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
              backgroundColor: timeLeft < 10 ? Colors.error : Colors.primary,
            },
          ]}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("new_ride_request")}</Text>
          <View style={styles.timerCircle}>
            <Text style={styles.timerText}>{timeLeft}</Text>
          </View>
        </View>

        <View style={styles.customerRow}>
          <View style={styles.avatar}>
            <User size={24} color={Colors.gray[400]} />
          </View>
          <View>
            <Text style={styles.customerName}>{request.customerName}</Text>
            <Text style={styles.customerRating}>
              ⭐ {request.customerRating}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.locationContainer}>
          <View style={styles.locationRow}>
            <MapPin size={18} color={Colors.info} />
            <Text style={styles.locationText} numberOfLines={1}>
              {request.pickupLocation.address}
            </Text>
          </View>
          <View style={styles.locationRow}>
            <MapPin size={18} color={Colors.black} />
            <Text style={styles.locationText} numberOfLines={1}>
              {request.dropoffLocation.address}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <DollarSign size={16} color={Colors.gray[500]} />
            <Text style={styles.statText}>
              {request.estimatedFare.toLocaleString()} FBU
            </Text>
          </View>
          <View style={styles.statItem}>
            <Clock size={16} color={Colors.gray[500]} />
            <Text style={styles.statText}>
              {request.distance} km • {request.duration} min
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
            <X size={20} color={Colors.error} />
            <Text style={styles.declineText}>{t("decline")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
            <Check size={20} color={Colors.black} />
            <Text style={styles.acceptText}>{t("accept_ride")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  progressBarBg: {
    height: 4,
    backgroundColor: Colors.gray[100],
    width: "100%",
  },
  progressBar: {
    height: "100%",
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: Colors.black,
  },
  timerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray[50],
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  timerText: {
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
    color: Colors.black,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
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
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
  },
  customerRating: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: Colors.gray[500],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray[100],
    marginBottom: 20,
  },
  locationContainer: {
    gap: 12,
    marginBottom: 20,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  locationText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: Colors.gray[800],
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 24,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: Colors.gray[500],
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  declineButton: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.1)",
  },
  declineText: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.error,
  },
  acceptButton: {
    flex: 2,
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  acceptText: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: Colors.black,
  },
});
