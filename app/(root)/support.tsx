import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ChevronRight,
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
} from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { getSettings } from "../../services/driver";

interface Settings {
  support_email: string;
  support_phone: string;
}

export default function Support() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.log("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (settings?.support_phone) {
      Linking.openURL(`tel:${settings.support_phone}`);
    }
  };

  const handleEmail = () => {
    if (settings?.support_email) {
      Linking.openURL(`mailto:${settings.support_email}`);
    }
  };

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const faqs = [
    {
      id: 1,
      question: t("faq_payment_q") || "How do I pay my commission debt?",
      answer:
        t("faq_payment_a") ||
        "You cannot pay directly in the app. Please visit our office or contact support to settle your commission debt via Lumicash or other approved methods.",
    },
    {
      id: 2,
      question: t("faq_suspended_q") || "Why is my account suspended?",
      answer:
        t("faq_suspended_a") ||
        "Your account may be suspended if your commission debt exceeds the allowed limit or if your documents have expired. Contact support to resolve this.",
    },
    {
      id: 3,
      question: t("faq_earnings_q") || "How are earnings calculated?",
      answer:
        t("faq_earnings_a") ||
        "You keep the cash you collect from clients. The platform commission is calculated per ride and added to your debt. Your Net Profit is (Cash Collected - Commission Debt).",
    },
    {
      id: 4,
      question: t("faq_docs_q") || "How do I update my documents?",
      answer:
        t("faq_docs_a") ||
        "To update your license or vehicle documents, please contact our support team. You cannot edit verified documents directly in the app for security reasons.",
    },
    {
      id: 5,
      question: t("faq_client_q") || "What if a client refuses to pay?",
      answer:
        t("faq_client_a") ||
        "Please remain calm and report the issue immediately to our support team using the 'Call Support' button. Do not engage in conflict.",
    },
  ];

  if (loading) {
    return (
      <View style={[styles.container, styles.centerObj]}>
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
        <Text style={styles.headerTitle}>{t("support")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Contact Options */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>{t("contact_us")}</Text>
          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.contactCard} onPress={handleCall}>
              <View style={[styles.iconBox, { backgroundColor: "#eff6ff" }]}>
                <Phone size={24} color={Colors.info} />
              </View>
              <Text style={styles.contactLabel}>{t("call_support")}</Text>
              <Text style={styles.contactValue}>
                {settings?.support_phone || "N/A"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactCard} onPress={handleEmail}>
              <View style={[styles.iconBox, { backgroundColor: "#dcfce7" }]}>
                <Mail size={24} color={Colors.success} />
              </View>
              <Text style={styles.contactLabel}>{t("email_support")}</Text>
              <Text style={styles.contactValue} numberOfLines={1}>
                {settings?.support_email || "N/A"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>
            {t("frequently_asked_questions")}
          </Text>
          {faqs.map((faq) => (
            <TouchableOpacity
              key={faq.id}
              style={styles.faqItem}
              onPress={() => toggleFaq(faq.id)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <View style={styles.faqLeft}>
                  <HelpCircle size={20} color={Colors.gray[400]} />
                  <Text style={styles.faqText}>{faq.question}</Text>
                </View>
                <ChevronRight
                  size={20}
                  color={Colors.gray[400]}
                  style={{
                    transform: [
                      { rotate: expandedFaq === faq.id ? "90deg" : "0deg" },
                    ],
                  }}
                />
              </View>
              {expandedFaq === faq.id && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{faq.answer}</Text>
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
  centerObj: {
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.gray[500],
    textAlign: "center",
  },
  faqSection: {
    marginBottom: 20,
  },
  faqItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  faqLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  faqText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: Colors.black,
    flex: 1,
  },
  faqAnswer: {
    marginTop: 12,
    paddingLeft: 32, // Align with text
  },
  faqAnswerText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.gray[600],
    lineHeight: 20,
  },
});
