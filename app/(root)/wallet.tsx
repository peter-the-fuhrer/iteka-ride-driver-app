import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  CreditCard,
  History,
  TrendingDown,
  TrendingUp,
  Wallet as WalletIcon,
} from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { useRouter } from "expo-router";
import { useDriverStore } from "../../store/driverStore";
import {
  getEarnings,
  getRideHistory,
  mapTripToRideHistory,
} from "../../services/driver";

const { width } = Dimensions.get("window");

export default function Wallet() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const { stats, rideHistory, updateStats, setRideHistory } = useDriverStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [earnings, historyRes] = await Promise.all([
          getEarnings(),
          getRideHistory({ limit: 50 }),
        ]);
        if (!cancelled) {
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
        }
      } catch (_) { }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter only completed rides for wallet transactions
  const completedRides = rideHistory.filter(
    (ride) => ride.status === "completed",
  );

  if (loading) {
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
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("wallet")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Commission/Debt Card */}
        <View
          style={[
            styles.balanceCard,
            stats.totalDebt > 0 ? styles.debtCard : null,
          ]}
        >
          <Text
            style={[
              styles.balanceLabel,
              stats.totalDebt > 0 && { color: Colors.gray[600] },
            ]}
          >
            {t("commission_owed")}
          </Text>
          <Text
            style={[
              styles.balanceAmount,
              stats.totalDebt > 0 && { color: Colors.error },
            ]}
          >
            {stats.totalDebt.toLocaleString()} FBU
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t("total_earnings")}</Text>
              <Text style={styles.statValue}>
                {(stats.totalEarnings + stats.totalDebt).toLocaleString()} FBU
              </Text>
            </View>
            <View style={styles.verticalLine} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t("net_profit")}</Text>
              <Text style={styles.statValue}>
                {stats.totalEarnings.toLocaleString()} FBU
              </Text>
            </View>
          </View>
        </View>

        {/* Transaction History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("recent_transactions")}</Text>
          {completedRides.length > 0 ? (
            completedRides.slice(0, 10).map((ride) => (
              <View key={`${ride.id}-group`} style={styles.historyGroup}>
                {/* Trip Income */}
                <View style={styles.transactionItem}>
                  <View style={styles.txLeft}>
                    <View
                      style={[styles.txIcon, { backgroundColor: "#dcfce7" }]}
                    >
                      <TrendingUp size={18} color={Colors.success} />
                    </View>
                    <View>
                      <Text style={styles.txType}>{t("cash_collected")}</Text>
                      <Text style={styles.txDate}>
                        {new Date(ride.date).toLocaleDateString()} •{" "}
                        {ride.distance.toFixed(2)} km
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.txAmount, { color: Colors.success }]}>
                    +{ride.fare.toLocaleString()} FBU
                  </Text>
                </View>

                {/* Commission Deduction (if any) */}
                {ride.commission > 0 && (
                  <View style={styles.transactionItem}>
                    <View style={styles.txLeft}>
                      <View
                        style={[styles.txIcon, { backgroundColor: "#fee2e2" }]}
                      >
                        <TrendingDown size={18} color={Colors.error} />
                      </View>
                      <View>
                        <Text style={styles.txType}>{t("commission")}</Text>
                        <Text style={styles.txDate}>{t("platform_fee")}</Text>
                      </View>
                    </View>
                    <Text style={[styles.txAmount, { color: Colors.error }]}>
                      -{ride.commission.toLocaleString()} FBU
                    </Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t("no_rides_yet")}</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  backButton: {
    padding: 10,
    backgroundColor: Colors.gray[100],
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
  },
  scrollContent: {
    padding: 20,
  },
  balanceCard: {
    backgroundColor: Colors.black,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  balanceLabel: {
    color: Colors.gray[400],
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  balanceAmount: {
    color: Colors.white,
    fontFamily: "Poppins_700Bold",
    fontSize: 32,
    marginTop: 8,
    marginBottom: 16,
  },
  debtRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  debtLabel: {
    color: Colors.gray[400],
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
  },
  debtAmount: {
    color: Colors.error,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  cashoutButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
  },
  cashoutText: {
    color: Colors.black,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
  },
  debtCard: {
    backgroundColor: "#fff1f2", // Light red background for debt
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 12,
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  verticalLine: {
    width: 1,
    height: 24,
    backgroundColor: Colors.gray[300],
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.gray[500],
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
  },
  historyGroup: {
    marginBottom: 10,
    backgroundColor: Colors.gray[50], // Group transactions visually
    borderRadius: 16,
    padding: 12,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  txLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  txType: {
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
    color: Colors.black,
  },
  txDate: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.gray[500],
  },
  txAmount: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
    marginBottom: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: Colors.gray[400],
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
});
