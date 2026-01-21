import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ChevronRight,
  HelpCircle,
  MessageCircle,
  Phone,
} from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { useRouter } from "expo-router";

export default function Support() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();

  const faqs = [
    { id: 1, question: t("faq_1") },
    { id: 2, question: t("faq_2") },
    { id: 3, question: t("faq_3") },
    { id: 4, question: t("faq_4") },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("support")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Contact Options */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>{t("contact_us")}</Text>
          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.contactCard}>
              <View style={[styles.iconBox, { backgroundColor: "#eff6ff" }]}>
                <Phone size={24} color={Colors.info} />
              </View>
              <Text style={styles.contactLabel}>{t("call_support")}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactCard}>
              <View style={[styles.iconBox, { backgroundColor: "#dcfce7" }]}>
                <MessageCircle size={24} color={Colors.success} />
              </View>
              <Text style={styles.contactLabel}>{t("chat_support")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>
            {t("frequently_asked_questions")}
          </Text>
          {faqs.map((faq) => (
            <TouchableOpacity key={faq.id} style={styles.faqItem}>
              <View style={styles.faqLeft}>
                <HelpCircle size={20} color={Colors.gray[400]} />
                <Text style={styles.faqText}>{faq.question}</Text>
              </View>
              <ChevronRight size={20} color={Colors.gray[400]} />
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
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
    marginBottom: 16,
  },
  contactSection: {
    marginBottom: 32,
  },
  contactRow: {
    flexDirection: "row",
    gap: 16,
  },
  contactCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  contactLabel: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: Colors.black,
  },
  faqSection: {
    marginBottom: 20,
  },
  faqItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  faqLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  faqText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.black,
    flex: 1,
  },
});
