import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Car, Check, Plus, Trash2 } from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { useRouter } from "expo-router";
import { useState } from "react";

export default function Vehicles() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();

  const [vehicles, setVehicles] = useState([
    {
      id: 1,
      make: "Toyota",
      model: "Corolla",
      year: "2020",
      plate: "B 1234 A",
      color: "White",
      image:
        "https://img.freepik.com/free-vector/white-sedan-car-isolated-white-vector_53876-64366.jpg",
      isActive: true,
    },
    {
      id: 2,
      make: "Honda",
      model: "Civic",
      year: "2019",
      plate: "B 5678 B",
      color: "Silver",
      image:
        "https://img.freepik.com/free-vector/silver-sedan-car-isolated-white-vector_53876-64367.jpg",
      isActive: false,
    },
  ]);

  const handleSelect = (id: number) => {
    setVehicles(
      vehicles.map((v) => ({
        ...v,
        isActive: v.id === id,
      })),
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("my_vehicles")}</Text>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={24} color={Colors.black} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>{t("select_vehicle_subtitle")}</Text>

        <View style={styles.list}>
          {vehicles.map((vehicle) => (
            <TouchableOpacity
              key={vehicle.id}
              style={[styles.card, vehicle.isActive && styles.activeCard]}
              onPress={() => handleSelect(vehicle.id)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleName}>
                    {vehicle.make} {vehicle.model}
                  </Text>
                  <Text style={styles.vehicleDetail}>
                    {vehicle.year} • {vehicle.color}
                  </Text>
                  <View style={styles.plateContainer}>
                    <Text style={styles.plateText}>{vehicle.plate}</Text>
                  </View>
                </View>
                {vehicle.isActive && (
                  <View style={styles.activeBadge}>
                    <Check size={14} color={Colors.white} />
                    <Text style={styles.activeText}>{t("active")}</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.statusText}>{t("verified")}</Text>
                {!vehicle.isActive && (
                  <TouchableOpacity style={styles.deleteBtn}>
                    <Trash2 size={18} color={Colors.gray[400]} />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))}
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
  addButton: {
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
  subtitle: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.gray[500],
    marginBottom: 24,
  },
  list: {
    gap: 16,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activeCard: {
    borderColor: Colors.primary,
    backgroundColor: "#fffbeb",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  vehicleInfo: {
    gap: 4,
  },
  vehicleName: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
  },
  vehicleDetail: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.gray[500],
  },
  plateContainer: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.gray[300],
  },
  plateText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100], // or darker if active
  },
  statusText: {
    color: Colors.success,
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
  },
  deleteBtn: {
    padding: 8,
  },
});
