import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Clock, MapPin, Calendar, ChevronRight } from "lucide-react-native";
import { useDriverStore, RideHistory } from "../../store/driverStore";
import { Colors } from "../../constants/Colors";
import { getRideHistory, mapTripToRideHistory } from "../../services/driver";

export default function History() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { rideHistory, setRideHistory } = useDriverStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getRideHistory({ limit: 50 });
        if (!cancelled && res?.rides?.length) {
          setRideHistory(res.rides.map(mapTripToRideHistory));
        }
      } catch (_) {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const renderItem = ({ item }: { item: RideHistory }) => (
    <TouchableOpacity style={styles.rideItem} activeOpacity={0.7}>
      <View style={styles.rideHeader}>
        <View style={styles.dateContainer}>
          <Calendar size={14} color={Colors.gray[500]} />
          <Text style={styles.dateText}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
        <Text
          style={[
            styles.statusText,
            {
              color:
                item.status === "completed" ? Colors.success : Colors.error,
            },
          ]}
        >
          {t(item.status, { defaultValue: item.status })}
        </Text>
      </View>

      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <View style={[styles.dot, { backgroundColor: Colors.info }]} />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.pickup}
          </Text>
        </View>
        <View style={styles.connector} />
        <View style={styles.locationRow}>
          <View style={[styles.dot, { backgroundColor: Colors.black }]} />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.dropoff}
          </Text>
        </View>
      </View>

      <View style={styles.rideFooter}>
        <View>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <Text style={styles.rideStats}>
            {item.distance} km • {item.duration} min
          </Text>
        </View>
        <Text style={styles.fareText}>{item.fare.toLocaleString()} FBU</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("ride_history")}</Text>
      </View>

      {rideHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Clock size={48} color={Colors.gray[300]} />
          <Text style={styles.emptyText}>{t("no_rides_yet")}</Text>
        </View>
      ) : (
        <FlatList
          data={rideHistory}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
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
  listContent: {
    padding: 20,
  },
  rideItem: {
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  rideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: Colors.gray[500],
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    textTransform: "uppercase",
  },
  locationContainer: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  locationText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.gray[800],
    flex: 1,
  },
  connector: {
    width: 1,
    height: 12,
    backgroundColor: Colors.gray[300],
    marginLeft: 3.5,
    marginVertical: 2,
  },
  rideFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  customerName: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
  },
  rideStats: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.gray[500],
  },
  fareText: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.black,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: Colors.gray[400],
  },
});
