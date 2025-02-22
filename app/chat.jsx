import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { io } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const socket = io("http://192.168.0.104:3000");

export default function ChatScreen() {
  const { contact, receiverName } = useLocalSearchParams();
  // const userPhoneNumber = "9391448996";
  console.log(contact, receiverName);
  const [userPhoneNumber, setUserPhoneNumber] = useState("");
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const flatListRef = useRef(null);

  async function fun() {
    const phone = await AsyncStorage.getItem("phoneNumber");
    setUserPhoneNumber(phone);
  }

  useFocusEffect(
    useCallback(() => {
      socket.emit("joinChat", { sender: userPhoneNumber, receiver: contact,receiverName });

      socket.on("receiveMessage", (msg) => {
        console.log("Received message:", msg);
        setMessages((prev) => [...prev, msg]);
      });

      socket.emit("loadMessages", {
        sender: userPhoneNumber,
        receiver: contact,
      });

      socket.on("chatHistory", (history) => {
        setMessages(history);
      });
      fun();

      return () => {
        socket.off("receiveMessage");
        socket.off("chatHistory");
      };
    }, [])
  );

  useEffect(() => {
    fun();
  }, []);
  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("sendMessage", {
        sender: userPhoneNumber,
        receiver: contact,
        receiverName,
        message: message.trim(),
      });
      setMessage("");
    }
  };

  const renderMessage = ({ item, index }) => {
    const isUser = item.sender === userPhoneNumber;
    const showAvatar =
      index === 0 || messages[index - 1]?.sender !== item.sender;

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.receiverMessage,
        ]}
      >
        {!isUser && showAvatar && (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {receiverName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.receiverBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.receiverMessageText,
            ]}
          >
            {item.message}
          </Text>
          <Text style={styles.messageTime}>
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <FontAwesome name="angle-left" size={24} color="#333" />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{receiverName}</Text>
              <Text style={styles.headerStatus}>Online</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.headerButton}>
            <FontAwesome name="ellipsis-v" size={20} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
      />

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <FontAwesome name="plus" size={20} color="#666" />
          </TouchableOpacity>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor="#666"
            style={styles.input}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !message.trim() && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!message.trim()}
          >
            <FontAwesome
              name="send"
              size={20}
              color={message.trim() ? "#FFF" : "#AAA"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerInfo: {
    justifyContent: "center",
  },
  headerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  headerStatus: {
    fontSize: 12,
    color: "#4CAF50",
  },
  headerButton: {
    padding: 8,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 12,
    maxWidth: "80%",
  },
  userMessage: {
    alignSelf: "flex-end",
  },
  receiverMessage: {
    alignSelf: "flex-start",
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4A90E2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    maxWidth: "100%",
  },
  userBubble: {
    backgroundColor: "#4A90E2",
    borderBottomRightRadius: 4,
  },
  receiverBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  receiverMessageText: {
    color: "#1a1a1a",
  },
  messageTime: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#F0F2F5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#4A90E2",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
});
