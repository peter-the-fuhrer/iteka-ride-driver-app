import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  TextInput,
  Vibration,
  Image,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Send, User, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Colors } from "../../../constants/Colors";
import { useDriverStore } from "../../../store/driverStore";
import {
  subscribeToEvent,
  unsubscribeFromEvent,
  sendMessage as sendSocketMessage,
  joinRideRoom,
} from "../../../services/socket";
import api, { API_BASE_URL } from "../../../services/api";
import { useAlertStore } from "../../../store/alertStore";
import { useRef } from "react";

interface Message {
  id: string;
  text: string;
  sender: "driver" | "customer";
  timestamp: Date;
}

export default function ChatScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeRide, chatMessages, setChatMessages, addChatMessage } =
    useDriverStore();
  const flatListRef = useRef<FlatList>(null);
  const [message, setMessage] = useState("");

  // Subscribe to new messages
  useEffect(() => {
    const handleNewMessage = (newMessage: any) => {
      // Convert backend message to UI message format
      const msg: Message = {
        id: newMessage._id,
        text: newMessage.text,
        sender: newMessage.sender === "driver" ? "driver" : "customer",
        timestamp: new Date(newMessage.createdAt),
      };
      addChatMessage(msg);
    };

    subscribeToEvent("new_message", handleNewMessage);

    const handleRideCancelled = (data: { tripId: string }) => {
      if (activeRide?.id === data.tripId) {
        useAlertStore.getState().showAlert({
          title: t("ride_cancelled") || "Ride Cancelled",
          message:
            t("ride_cancelled_by_client") ||
            "The client has cancelled this ride.",
          type: "warning",
        });
        Vibration.vibrate([
          0, 200, 100, 200, 100, 200, 100, 200, 100, 500, 100, 500, 100, 500,
        ]);
        router.replace("/(root)");
      }
    };
    subscribeToEvent("ride_cancelled", handleRideCancelled);

    // Initial fetch of messages for this trip
    if (activeRide?.id) {
      // Join the room just in case
      joinRideRoom(activeRide.id);

      // Fetch history
      api
        .get(`/chat/${activeRide.id}`)
        .then((res) => {
          if (res.data) {
            const loadedMessages = res.data.map((m: any) => ({
              id: m._id,
              text: m.text,
              sender: m.sender === "driver" ? "driver" : "customer",
              timestamp: new Date(m.createdAt),
            }));
            setChatMessages(loadedMessages);
          }
        })
        .catch((err) => console.error("Error fetching chat history:", err));
    }

    return () => {
      unsubscribeFromEvent("new_message", handleNewMessage);
      unsubscribeFromEvent("ride_cancelled", handleRideCancelled);
    };
  }, [activeRide?.id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (message.trim().length === 0 || !activeRide?.id) return;

    const text = message.trim();

    // Optimistic update
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      text: text,
      sender: "driver",
      timestamp: new Date(),
    };
    addChatMessage(optimisticMsg);

    // Send via socket
    sendSocketMessage(activeRide.id, "driver", text);
    setMessage("");
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isDriver = item.sender === "driver";
    return (
      <View
        style={[
          styles.messageWrapper,
          isDriver ? styles.driverWrapper : styles.customerWrapper,
        ]}
      >
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
          <Text
            style={[
              styles.timestamp,
              isDriver ? styles.driverTimestamp : styles.customerTimestamp,
            ]}
          >
            {item.timestamp.toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <TouchableOpacity
            onPress={() => {
              if (activeRide) {
                router.replace("/(root)/active-ride");
              } else {
                router.back();
              }
            }}
            style={styles.backButton}
          >
            <X size={24} color={Colors.black} />
          </TouchableOpacity>
          <View style={styles.avatar}>
            {activeRide?.customerImage ? (
              <Image
                source={{
                  uri: activeRide.customerImage.startsWith("http")
                    ? activeRide.customerImage
                    : `${API_BASE_URL.replace("/api", "")}${activeRide.customerImage}`,
                }}
                style={{ width: 40, height: 40, borderRadius: 20 }}
              />
            ) : (
              <User size={20} color={Colors.gray[500]} />
            )}
          </View>
          <View>
            <Text style={styles.customerName}>
              {activeRide?.customerName || t("customer")}
            </Text>
            <Text style={styles.customerStatus}>{t("online")}</Text>
          </View>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={chatMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      {/* Input Area */}
      <View
        style={[
          styles.inputContainer,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <TextInput
          style={styles.input}
          placeholder={t("type_message") || "Type a message..."}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={500}
          placeholderTextColor={Colors.gray[400]}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !message.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={!message.trim()}
        >
          <Send
            size={20}
            color={message.trim() ? Colors.black : Colors.gray[400]}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  customerName: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.black,
  },
  customerStatus: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.success,
  },
  messagesList: {
    padding: 20,
    paddingBottom: 40,
  },
  messageWrapper: {
    marginBottom: 16,
    flexDirection: "row",
  },
  driverWrapper: {
    justifyContent: "flex-end",
  },
  customerWrapper: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  driverBubble: {
    backgroundColor: Colors.primary,
    borderTopRightRadius: 4,
  },
  customerBubble: {
    backgroundColor: Colors.gray[100],
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    lineHeight: 22,
    color: Colors.black,
  },
  driverText: {
    color: Colors.black,
  },
  customerText: {
    color: Colors.black,
  },
  timestamp: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    marginTop: 4,
    alignSelf: "flex-end",
    color: "rgba(0,0,0,0.5)",
  },
  driverTimestamp: {
    color: "rgba(0,0,0,0.5)",
  },
  customerTimestamp: {
    color: Colors.gray[400],
  },
  inputContainer: {
    padding: 16,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.gray[50],
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    maxHeight: 100,
    color: Colors.black,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: Colors.gray[100],
  },
});
