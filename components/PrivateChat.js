import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import io from "socket.io-client";
import axios from "axios";

const SERVER_URL =
  Platform.OS === "android" ? "http://192.168.1.24:5000" : "http://192.168.1.24:5000";

const PrivateChat = ({
  user,
  onNavigateToChatForum,
  onNavigateToHome,
  onNavigateToProfile,
  onLogout,
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userFullName, setUserFullName] = useState("");
  const [userProfilePic, setUserProfilePic] = useState("");
  const scrollViewRef = useRef(null);
  const socketRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchUserDataAndMessages = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          console.error("No token found in AsyncStorage");
          onLogout?.();
          return;
        }

        const userResponse = await axios.get(
          `${SERVER_URL}/api/auth/user/profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUserFullName(userResponse.data.fullName || "Unknown User");
        setUserProfilePic(userResponse.data.profilePic || "");

        const messagesResponse = await axios.get(
          `${SERVER_URL}/api/chat/private-messages/${userResponse.data.fullName}`
        );
        const filteredMessages = messagesResponse.data.filter(
          (msg) =>
            (msg.from === userResponse.data.fullName &&
              msg.to === user.fullName) ||
            (msg.from === user.fullName &&
              msg.to === userResponse.data.fullName)
        );
        setMessages(
          filteredMessages.map((msg) => ({
            id: msg._id,
            text: msg.text,
            isSent: msg.from === userResponse.data.fullName,
            timestamp: new Date(msg.timestamp),
            from: msg.from,
            profilePic: msg.profilePic,
          }))
        );

        socketRef.current = io(SERVER_URL, {
          transports: ["websocket"],
          query: { token },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        socketRef.current.on("connect", () => {
          console.log("Connected to Socket.IO server:", socketRef.current.id);
        });

        socketRef.current.on("connect_error", (err) => {
          console.error("Socket.IO connection error:", err.message);
        });

        socketRef.current.on(
          `private_message_${userResponse.data.fullName}_${user.fullName}`,
          (msg) => {
            setMessages((prevMessages) => {
              const updatedMessages = [...prevMessages];
              const tempIndex = updatedMessages.findIndex(
                (m) =>
                  m.id.startsWith("temp-") &&
                  m.text === msg.text &&
                  m.from === msg.from
              );
              if (tempIndex !== -1) {
                updatedMessages[tempIndex] = {
                  id: msg._id,
                  text: msg.text,
                  isSent: msg.from === userFullName,
                  timestamp: new Date(msg.timestamp),
                  from: msg.from,
                  profilePic: msg.profilePic,
                };
              } else if (!updatedMessages.some((m) => m.id === msg._id)) {
                updatedMessages.push({
                  id: msg._id,
                  text: msg.text,
                  isSent: msg.from === userFullName,
                  timestamp: new Date(msg.timestamp),
                  from: msg.from,
                  profilePic: msg.profilePic,
                });
              }
              return updatedMessages;
            });
          }
        );

        socketRef.current.on(
          `private_message_${user.fullName}_${userResponse.data.fullName}`,
          (msg) => {
            setMessages((prevMessages) => {
              const updatedMessages = [...prevMessages];
              const tempIndex = updatedMessages.findIndex(
                (m) =>
                  m.id.startsWith("temp-") &&
                  m.text === msg.text &&
                  m.from === msg.from
              );
              if (tempIndex !== -1) {
                updatedMessages[tempIndex] = {
                  id: msg._id,
                  text: msg.text,
                  isSent: msg.from === userFullName,
                  timestamp: new Date(msg.timestamp),
                  from: msg.from,
                  profilePic: msg.profilePic,
                };
              } else if (!updatedMessages.some((m) => m.id === msg._id)) {
                updatedMessages.push({
                  id: msg._id,
                  text: msg.text,
                  isSent: msg.from === userFullName,
                  timestamp: new Date(msg.timestamp),
                  from: msg.from,
                  profilePic: msg.profilePic,
                });
              }
              return updatedMessages;
            });
          }
        );
      } catch (error) {
        console.error(
          "Error fetching data:",
          error.response?.data || error.message
        );
      }
    };

    fetchUserDataAndMessages();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log("Socket.IO disconnected");
      }
    };
  }, [onLogout, user]);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && socketRef.current && userFullName) {
      const tempId = `temp-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      const messageData = {
        from: userFullName,
        to: user.fullName,
        text: newMessage,
        timestamp: new Date().toISOString(),
        profilePic: userProfilePic,
      };

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: tempId,
          text: newMessage,
          isSent: true,
          timestamp: new Date(),
          from: userFullName,
          profilePic: userProfilePic,
        },
      ]);

      socketRef.current.emit("send_private_message", messageData);
      setNewMessage("");
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  const handleBackToForum = () => {
    Keyboard.dismiss();
    if (inputRef.current) {
      inputRef.current.blur();
    }
    setNewMessage("");
    setTimeout(() => {
      onNavigateToChatForum?.();
    }, 150);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      enabled={Platform.OS === "ios"}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToForum}>
          <Text style={styles.backText}>Back to Forum</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>{user.fullName}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.chatContent}
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.noChatsContainer}>
            <Text style={styles.noChatsText}>Start a conversation</Text>
          </View>
        ) : (
          messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.isSent
                  ? styles.sentMessageContainer
                  : styles.receivedMessageContainer,
              ]}
            >
              {!message.isSent && (
                <Image
                  source={
                    message.profilePic
                      ? { uri: `${SERVER_URL}${message.profilePic}` }
                      : require("../assets/images/Global-images/default-user.png")
                  }
                  style={styles.userAvatar}
                />
              )}
              <View
                style={[
                  styles.messageBubble,
                  message.isSent ? styles.sentMessage : styles.receivedMessage
                ]}
              >
                <Text style={styles.messageSender}>{message.from}</Text>
                <Text style={styles.messageText}>{message.text}</Text>
                <Text style={styles.messageTimestamp}>
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              {message.isSent && (
                <Image
                  source={
                    message.profilePic
                      ? { uri: `${SERVER_URL}${message.profilePic}` }
                      : require("../assets/images/Global-images/default-user.png")
                  }
                  style={styles.userAvatar}
                />
              )}
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.messageInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#888"
          multiline
          maxLength={500}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#6B4E31',
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    textTransform: 'capitalize',
    fontFamily: 'Roboto',
  },
  backText: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  chatContent: {
    flexGrow: 1,
    padding: 15,
    paddingBottom: 100,
  },
  noChatsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  noChatsText: {
    fontSize: 18,
    color: '#6B4E31',
    fontFamily: 'Roboto',
    fontWeight: '500',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 8,
  },
  sentMessageContainer: {
    justifyContent: 'flex-end',
  },
  receivedMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sentMessage: {
    backgroundColor: '#FFD700',
  },
  receivedMessage: {
    backgroundColor: '#FFF',
  },
  messageSender: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B4E31',
    marginBottom: 5,
    fontFamily: 'Roboto',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    fontFamily: 'Roboto',
  },
  messageTimestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'right',
    fontFamily: 'Roboto',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 10,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    maxHeight: 100,
    marginRight: 10,
    fontFamily: 'Roboto',
  },
  sendButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  sendButtonText: {
    color: '#6B4E31',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
});

export default PrivateChat;