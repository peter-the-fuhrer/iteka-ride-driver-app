import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Dimensions,
  Animated,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Send,
  User,
  Phone,
  Info,
  Clock,
  CheckCheck,
} from "lucide-react-native";
import { Colors } from "../../constants/Colors";
import { useDriverStore } from "../../store/driverStore";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface Message {
  id: string;
  text: string;
  sender: "driver" | "customer";
  timestamp: Date;
  status?: "sent" | "delivered" | "read";
}

const QUICK_REPLIES = [
  "chat_reply_on_my_way",
  "chat_reply_arrived",
  "chat_reply_stuck_traffic",
  "chat_reply_ok",
];

export default function ChatScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { activeRide } = useDriverStore();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm waiting at the pickup point. Please come to the south gate.",
      sender: "customer",
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      status: "read",
    },
    {
      id: "2",
      text: "I'm on my way! Will be there in about 5 minutes.",
      sender: "driver",
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      status: "read",
    },
    {
      id: "3",
      text: "Thanks! I'm wearing a red jacket.",
      sender: "customer",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      status: "read",
    },
  ]);

  const flatListRef = useRef<FlatList>(null);
  const scrollAnim = useRef(new Animated.Value(0)).current;

  const sendMessage = useCallback(
    (textOverride?: string) => {
      const finalText = textOverride || message;
      if (finalText.trim().length === 0) return;

      const newMessage: Message = {
        id: Date.now().toString(),
        text: finalText,
        sender: "driver",
        timestamp: new Date(),
        status: "sent",
      };

      setMessages((prev) => [...prev, newMessage]);
      setMessage("");
    },
    [message],
  );

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isDriver = item.sender === "driver";
    const showAvatar =
      !isDriver && (index === 0 || messages[index - 1].sender === "driver");

    return (
      <View
        style={[
          styles.messageRow,
          isDriver ? styles.driverRow : styles.customerRow,
        ]}
      >
        {!isDriver && (
          <View style={styles.avatarPlaceholder}>
            {showAvatar ? (
              <View style={styles.smallAvatar}>
                <User size={14} color={Colors.gray[500]} />
              </View>
            ) : null}
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isDriver ? styles.driverBubble : styles.customerBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isDriver ? styles.driverText : styles.customerText,
            ]}
          >
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.timestamp,
                isDriver ? styles.driverTimestamp : styles.customerTimestamp,
              ]}
            >
              {item.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            {isDriver && (
              <CheckCheck
                size={12}
                color="rgba(0,0,0,0.4)"
                style={styles.statusIcon}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={Colors.black} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <User size={22} color={Colors.gray[500]} />
              </View>
              <View style={styles.onlineIndicator} />
            </View>
            <View>
              <Text style={styles.customerName}>
                {activeRide?.customerName || t("customer")}
              </Text>
              <Text style={styles.customerStatus}>{t("online")}</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton}>
              <Phone size={20} color={Colors.black} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton}>
              <Info size={20} color={Colors.black} />
            </TouchableOpacity>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.content}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          {/* Trip Info Overlay */}
          <View style={styles.tripInfoBar}>
            <Clock size={14} color={Colors.gray[500]} />
            <Text style={styles.tripInfoText}>
              {t("trip_started_at")}{" "}
              {activeRide
                ? new Date(activeRide.requestTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "--:--"}
            </Text>
          </View>

          {/* Messages List */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />

          {/* Bottom Area */}
          <View style={styles.bottomSection}>
            {/* Quick Replies */}
            <View style={styles.quickReplyContainer}>
              <FlatList
                horizontal
                data={QUICK_REPLIES}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.quickReplyPill}
                    onPress={() => sendMessage(t(item))}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickReplyText}>{t(item)}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickReplyList}
              />
            </View>

            {/* Input Area */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t("type_a_message")}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    !message.trim() && styles.sendButtonDisabled,
                  ]}
                  onPress={() => sendMessage()}
                  disabled={!message.trim()}
                >
                  <Send
                    size={20}
                    color={message.trim() ? Colors.black : Colors.gray[400]}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F5",
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F3F5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#40C057",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  customerName: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#212529",
    lineHeight: 20,
  },
  customerStatus: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#40C057",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  tripInfoBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    gap: 6,
  },
  tripInfoText: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    color: Colors.gray[500],
  },
  messagesList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  driverRow: {
    justifyContent: "flex-end",
  },
  customerRow: {
    justifyContent: "flex-start",
  },
  avatarPlaceholder: {
    width: 24,
    marginRight: 8,
  },
  smallAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F1F3F5",
    justifyContent: "center",
    alignItems: "center",
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  driverBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  customerBubble: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    lineHeight: 21,
  },
  driverText: {
    color: "#212529",
  },
  customerText: {
    color: "#212529",
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 2,
    gap: 4,
  },
  timestamp: {
    fontSize: 9,
    fontFamily: "Poppins_400Regular",
  },
  driverTimestamp: {
    color: "rgba(0,0,0,0.4)",
  },
  customerTimestamp: {
    color: "#ADB5BD",
  },
  statusIcon: {
    marginTop: 1,
  },
  bottomSection: {
    backgroundColor: Colors.white,
    paddingBottom: Platform.OS === "ios" ? 10 : 16,
  },
  quickReplyContainer: {
    borderTopWidth: 1,
    borderTopColor: "#F1F3F5",
    paddingVertical: 12,
  },
  quickReplyList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickReplyPill: {
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  quickReplyText: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: "#495057",
  },
  inputWrapper: {
    paddingHorizontal: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F1F3F5",
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    color: "#212529",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sendButtonDisabled: {
    backgroundColor: "#E9ECEF",
    shadowOpacity: 0,
    elevation: 0,
  },
});
