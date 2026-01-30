import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Send, User, X } from "lucide-react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetFlatList,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { Colors } from "../../constants/Colors";
import { useDriverStore } from "../../store/driverStore";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface Message {
  id: string;
  text: string;
  sender: "driver" | "customer";
  timestamp: Date;
}

export const ChatBottomSheet = forwardRef<BottomSheetModal>((props, ref) => {
  const { t } = useTranslation();
  const { activeRide } = useDriverStore();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm waiting at the pickup point.",
      sender: "customer",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
    },
    {
      id: "2",
      text: "Coming in 2 minutes!",
      sender: "driver",
      timestamp: new Date(Date.now() - 1000 * 60 * 2),
    },
  ]);

  const snapPoints = useMemo(() => ["100%"], []);

  const sendMessage = () => {
    if (message.trim().length === 0) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: "driver",
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
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

  const handleClose = useCallback(() => {
    // @ts-ignore
    ref?.current?.dismiss();
  }, [ref]);

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      index={0}
      handleIndicatorStyle={{ backgroundColor: Colors.gray[300] }}
      backgroundStyle={{ borderRadius: 0 }} // Full height looks better without rounded corners at the top
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      enablePanDownToClose={true}
    >
      <BottomSheetView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <View style={styles.avatar}>
              <User size={20} color={Colors.gray[500]} />
            </View>
            <View>
              <Text style={styles.customerName}>
                {activeRide?.customerName || t("customer")}
              </Text>
              <Text style={styles.customerStatus}>{t("online")}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={Colors.gray[500]} />
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        <BottomSheetFlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item: Message) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          inverted={false}
        />

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.inputContainer}>
            <BottomSheetTextInput
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
              onPress={sendMessage}
              disabled={!message.trim()}
            >
              <Send
                size={20}
                color={message.trim() ? Colors.black : Colors.gray[400]}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

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
  closeButton: {
    padding: 4,
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
  keyboardAvoidingView: {
    width: "100%",
  },
  inputContainer: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 16,
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
