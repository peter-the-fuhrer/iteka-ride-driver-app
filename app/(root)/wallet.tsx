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
import { getEarnings, getRideHistory, mapTripToRideHistory } from "../../services/driver";

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
      } catch (_) {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Filter only completed rides for wallet transactions
  const completedRides = rideHistory.filter(
    (ride) => ride.status === "completed",
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
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t("available_balance")}</Text>
          <Text style={styles.balanceAmount}>
            {stats.netBalance.toLocaleString()} FBU
          </Text>

          {/* Debt Info */}
          {stats.totalDebt > 0 && (
            <View style={styles.debtRow}>
              <Text style={styles.debtLabel}>{t("debt_owed")}: </Text>
              <Text style={styles.debtAmount}>
                {stats.totalDebt.toLocaleString()} FBU
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.cashoutButton}>
            <Text style={styles.cashoutText}>{t("cash_out")}</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("payment_methods")}</Text>
          <TouchableOpacity style={styles.paymentMethod}>
            <View style={styles.methodLeft}>
              <View style={styles.methodIcon}>
                <CreditCard size={20} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.methodName}>Lumicash</Text>
                <Text style={styles.methodDetail}>**** 4567</Text>
              </View>
            </View>
            <Text style={styles.editText}>{t("edit")}</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("recent_transactions")}</Text>
          {completedRides.length > 0 ? (
            completedRides.slice(0, 10).map((ride) => (
              <View key={`${ride.id}-group`}>
                {/* Earnings Transaction */}
                <View style={styles.transactionItem}>
                  <View style={styles.txLeft}>
                    <View
                      style={[styles.txIcon, { backgroundColor: "#dcfce7" }]}
                    >
                      <TrendingUp size={18} color={Colors.success} />
                    </View>
                    <View>
                      <Text style={styles.txType}>{t("trip_earning")}</Text>
                      <Text style={styles.txDate}>
                        {new Date(ride.date).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.txAmount, { color: Colors.success }]}>
                    +{ride.fare.toLocaleString()}
                  </Text>
                </View>

                {/* Commission Deduction */}
                <View style={styles.transactionItem}>
                  <View style={styles.txLeft}>
                    <View
                      style={[styles.txIcon, { backgroundColor: "#f3f4f6" }]}
                    >
                      <TrendingDown size={18} color={Colors.gray[600]} />
                    </View>
                    <View>
                      <Text style={styles.txType}>{t("commission")}</Text>
                      <Text style={styles.txDate}>
                        {new Date(ride.date).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.txAmount, { color: Colors.black }]}>
                    -{ride.commission.toLocaleString()}
                  </Text>
                </View>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
    marginBottom: 16,
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  methodLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fffbeb",
    justifyContent: "center",
    alignItems: "center",
  },
  methodName: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
  },
  methodDetail: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.gray[500],
  },
  editText: {
    color: Colors.primary,
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
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
