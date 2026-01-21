import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  Upload,
} from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { useRouter } from "expo-router";

export default function Documents() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();

  const documents = [
    {
      id: 1,
      title: t("drivers_license"),
      status: "approved",
      expiry: "2025-10-12",
    },
    {
      id: 2,
      title: t("vehicle_insurance"),
      status: "approved",
      expiry: "2024-12-01",
    },
    {
      id: 3,
      title: t("vehicle_registration"),
      status: "pending",
      expiry: null,
    },
    { id: 4, title: t("background_check"), status: "rejected", expiry: null },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return Colors.success;
      case "pending":
        return Colors.warning;
      case "rejected":
        return Colors.error;
      default:
        return Colors.gray[400];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle size={20} color={Colors.success} />;
      case "pending":
        return <Clock size={20} color={Colors.warning} />;
      case "rejected":
        return <AlertCircle size={20} color={Colors.error} />;
      default:
        return <AlertCircle size={20} color={Colors.gray[400]} />;
    }
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
        <Text style={styles.headerTitle}>{t("documents")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>{t("manage_documents_subtitle")}</Text>

        <View style={styles.list}>
          {documents.map((doc) => (
            <TouchableOpacity key={doc.id} style={styles.docCard}>
              <View style={styles.docHeader}>
                <Text style={styles.docTitle}>{doc.title}</Text>
                {getStatusIcon(doc.status)}
              </View>

              <View style={styles.docFooter}>
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(doc.status) },
                  ]}
                >
                  {doc.status.toUpperCase()}
                </Text>
                {doc.expiry && (
                  <Text style={styles.expiryText}>
                    {t("exp")}: {doc.expiry}
                  </Text>
                )}
              </View>

              {doc.status === "rejected" && (
                <View style={styles.actionRow}>
                  <Text style={styles.errorText}>
                    {t("document_rejected_msg")}
                  </Text>
                  <TouchableOpacity style={styles.uploadButton}>
                    <Upload size={14} color={Colors.black} />
                    <Text style={styles.uploadText}>{t("upload")}</Text>
                  </TouchableOpacity>
                </View>
              )}
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
  docCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  docHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  docTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
  },
  docFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  expiryText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.gray[400],
  },
  actionRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    fontSize: 11,
    color: Colors.error,
    fontFamily: "Poppins_500Medium",
    flex: 1,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  uploadText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
  },
});
