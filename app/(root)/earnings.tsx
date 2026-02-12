import React, { useMemo, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { DollarSign, TrendingUp, Clock, Calendar } from "lucide-react-native";
import { Svg, Rect, Text as SvgText, G } from "react-native-svg";
import { Colors } from "../../constants/Colors";
import { useDriverStore } from "../../store/driverStore";
import {
  getEarnings,
  getRideHistory,
  mapTripToRideHistory,
} from "../../services/driver";

const { width } = Dimensions.get("window");

const CHART_HEIGHT = 180;
const CHART_WIDTH = width - 40;

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Earnings() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const { stats, rideHistory, updateStats, setRideHistory } = useDriverStore();
  const [loading, setLoading] = useState(false);

  // Refresh earnings and history when screen mounts
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [earnings, historyRes] = await Promise.all([
          getEarnings(),
          getRideHistory({ limit: 50 }),
        ]);
        if (cancelled) return;
        if (earnings)
          updateStats({
            todayEarnings: earnings.todayEarnings ?? 0,
            todayRides: earnings.todayRides ?? 0,
            weeklyEarnings: earnings.weeklyEarnings ?? 0,
            monthlyEarnings: earnings.monthlyEarnings ?? 0,
            totalDebt: earnings.totalDebt ?? 0,
            totalEarnings: earnings.totalEarnings ?? 0,
            netBalance: earnings.netBalance ?? 0,
            hoursOnline: earnings.hoursOnline ?? 0,
            weeklyData: earnings.weeklyData ?? [],
          });
        if (historyRes?.rides?.length)
          setRideHistory(historyRes.rides.map(mapTripToRideHistory));
      } catch (_) {}
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Weekly chart: use data from backend
  const weeklyData = useMemo(() => {
    if (stats.weeklyData && stats.weeklyData.length > 0) {
      return stats.weeklyData;
    }
    return DAY_LABELS.map((day) => ({
      day,
      amount:
        stats.weeklyEarnings > 0 ? Math.round(stats.weeklyEarnings / 7) : 0,
    }));
  }, [stats.weeklyData, stats.weeklyEarnings]);

  const maxAmount = Math.max(1, ...weeklyData.map((d) => d.amount));

  const Chart = () => {
    const barWidth = (CHART_WIDTH - 40) / weeklyData.length;
    const spacing = 10;
    const actualBarWidth = barWidth - spacing;

    return (
      <View style={styles.chartContainer}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {weeklyData.map((item, index) => {
            const barHeight = (item.amount / maxAmount) * (CHART_HEIGHT - 30);
            return (
              <G key={index}>
                <Rect
                  x={index * barWidth + 20}
                  y={CHART_HEIGHT - barHeight - 20}
                  width={actualBarWidth}
                  height={barHeight}
                  rx={4}
                  fill={item.amount > 0 ? Colors.primary : Colors.gray[200]}
                />
                <SvgText
                  x={index * barWidth + 20 + actualBarWidth / 2}
                  y={CHART_HEIGHT - 5}
                  fontSize="12"
                  fill={Colors.gray[500]}
                  textAnchor="middle"
                  fontFamily="Poppins_400Regular"
                >
                  {item.day}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    );
  };

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("earnings")}</Text>
        <TouchableOpacity style={styles.dateSelector}>
          <Calendar size={16} color={Colors.black} />
          <Text style={styles.dateText}>{t("this_week")}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Total Earnings Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t("total_earnings")}</Text>
          <Text style={styles.summaryAmount}>
            {stats.weeklyEarnings.toLocaleString()} FBU
          </Text>
          {stats.weeklyEarnings > 0 && (
            <View style={styles.trendRow}>
              <TrendingUp size={16} color={Colors.success} />
              <Text style={styles.trendText}>{t("this_week")}</Text>
            </View>
          )}
        </View>

        {/* Chart */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("weekly_overview")}</Text>
        </View>
        <Chart />

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <View style={[styles.iconBg, { backgroundColor: "#e0f2fe" }]}>
              <Clock size={20} color={Colors.info} />
            </View>
            <Text style={styles.statValue}>
              {stats.hoursOnline.toFixed(1)}h
            </Text>
            <Text style={styles.statLabel}>{t("time_online")}</Text>
          </View>
          <View style={styles.statBox}>
            <View style={[styles.iconBg, { backgroundColor: "#fef3c7" }]}>
              <DollarSign size={20} color={Colors.warning} />
            </View>
            <Text style={styles.statValue}>{stats.todayRides}</Text>
            <Text style={styles.statLabel}>{t("completed_trips")}</Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("recent_trips")}</Text>
          <TouchableOpacity onPress={() => router.push("/history")}>
            <Text style={styles.seeAllText}>{t("see_all")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historyList}>
          {rideHistory.length > 0 ? (
            rideHistory.slice(0, 5).map((ride) => (
              <View key={ride.id} style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyDate}>
                    {new Date(ride.date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  <Text style={styles.historyCustomer}>
                    {ride.customerName}
                  </Text>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyAmount}>
                    +{ride.fare.toLocaleString()} FBU
                  </Text>
                  <Text
                    style={[
                      styles.historyStatus,
                      {
                        color:
                          ride.status === "completed"
                            ? Colors.success
                            : Colors.error,
                      },
                    ]}
                  >
                    {ride.status}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t("no_recent_trips")}</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dateText: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: Colors.black,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  summaryCard: {
    margin: 20,
    padding: 20,
    backgroundColor: Colors.black,
    borderRadius: 24,
    alignItems: "center",
  },
  summaryLabel: {
    color: Colors.gray[400],
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  summaryAmount: {
    color: Colors.primary,
    fontSize: 36,
    fontFamily: "Poppins_700Bold",
    marginVertical: 4,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    color: Colors.success,
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
  },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: Colors.primary,
  },
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[100],
    padding: 12,
    borderRadius: 16,
    alignItems: "center",
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.gray[500],
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
  historyList: {
    paddingHorizontal: 20,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[50],
  },
  historyLeft: {
    gap: 2,
  },
  historyDate: {
    fontSize: 12,
    color: Colors.gray[400],
    fontFamily: "Poppins_400Regular",
  },
  historyCustomer: {
    fontSize: 16,
    color: Colors.black,
    fontFamily: "Poppins_500Medium",
  },
  historyRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  historyAmount: {
    fontSize: 16,
    color: Colors.black,
    fontFamily: "Poppins_600SemiBold",
  },
  historyStatus: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    textTransform: "capitalize",
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: Colors.gray[400],
    fontFamily: "Poppins_400Regular",
  },
});
