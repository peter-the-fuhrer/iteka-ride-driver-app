import React, { forwardRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";
import { Phone, MapPin, Clock, Calendar, Star, X } from "lucide-react-native";
import { RideHistory } from "../../store/driverStore";
import { Colors } from "../../constants/Colors";
import * as Linking from "expo-linking";

interface Props {
  ride: RideHistory | null;
  onClose: () => void;
}

export const RideDetailsModal = forwardRef<BottomSheetModal, Props>(
  ({ ride, onClose }, ref) => {
    const { t } = useTranslation();
    const snapPoints = useMemo(() => ["50%", "70%"], []);

    if (!ride) return null;

    const handleCall = () => {
      if (ride.customerPhone) {
        Linking.openURL(`tel:${ride.customerPhone.replace(/\s+/g, "")}`);
      }
    };

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        handleIndicatorStyle={{ backgroundColor: Colors.gray[300] }}
        backgroundStyle={{ borderRadius: 24 }}
      >
        <BottomSheetView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{t("trip_details")}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.gray[500]} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Customer Info */}
            <View style={styles.customerRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {ride.customerName.charAt(0)}
                </Text>
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{ride.customerName}</Text>
                {ride.customerPhone && (
                  <Text style={styles.customerPhone}>{ride.customerPhone}</Text>
                )}
              </View>
              {ride.customerPhone && (
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={handleCall}
                >
                  <Phone size={20} color={Colors.white} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.divider} />

            {/* Trip Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Calendar size={16} color={Colors.gray[400]} />
                <Text style={styles.statText}>
                  {new Date(ride.date).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Clock size={16} color={Colors.gray[400]} />
                <Text style={styles.statText}>
                  {new Date(ride.date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Star size={16} color={Colors.warning} fill={Colors.warning} />
                <Text style={styles.statText}>{ride.rating || "N/A"}</Text>
              </View>
            </View>

            {/* Locations */}
            <View style={styles.locationContainer}>
              <View style={styles.locationRow}>
                <View style={[styles.dot, { backgroundColor: Colors.info }]} />
                <View style={styles.addressContainer}>
                  <Text style={styles.addressLabel}>{t("pickup")}</Text>
                  <Text style={styles.addressText}>{ride.pickup}</Text>
                </View>
              </View>
              <View style={styles.line} />
              <View style={styles.locationRow}>
                <View style={[styles.dot, { backgroundColor: Colors.black }]} />
                <View style={styles.addressContainer}>
                  <Text style={styles.addressLabel}>{t("dropoff")}</Text>
                  <Text style={styles.addressText}>{ride.dropoff}</Text>
                </View>
              </View>
            </View>

            {/* Fare Details */}
            <View style={styles.fareCard}>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>{t("fare")}</Text>
                <Text style={styles.fareValue}>
                  {ride.fare.toLocaleString()} FBU
                </Text>
              </View>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>{t("commission")}</Text>
                <Text style={[styles.fareValue, { color: Colors.error }]}>
                  -{ride.commission.toLocaleString()} FBU
                </Text>
              </View>
              <View style={styles.dividerLight} />
              <View style={styles.fareRow}>
                <Text style={styles.netLabel}>
                  {t("net_earnings") || "Net"}
                </Text>
                <Text style={styles.netValue}>
                  {(ride.fare - ride.commission).toLocaleString()} FBU
                </Text>
              </View>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: Colors.black,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    gap: 20,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 24,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.gray[500],
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
  },
  customerPhone: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.gray[500],
    marginTop: 2,
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.success,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray[100],
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: Colors.gray[50],
    padding: 12,
    borderRadius: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: Colors.gray[600],
  },
  locationContainer: {
    paddingLeft: 4,
  },
  locationRow: {
    flexDirection: "row",
    gap: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  addressContainer: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: Colors.gray[400],
    marginBottom: 2,
  },
  addressText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.black,
    lineHeight: 20,
  },
  line: {
    width: 1,
    height: 20,
    backgroundColor: Colors.gray[200],
    marginLeft: 4.5,
    marginVertical: 4,
  },
  fareCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  fareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fareLabel: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.gray[500],
  },
  fareValue: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
  },
  dividerLight: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: 4,
  },
  netLabel: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.black,
  },
  netValue: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.primary,
  },
});
