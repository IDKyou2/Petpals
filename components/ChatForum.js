import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import io from "socket.io-client";
import axios from "axios";
import useChatCount from "./hooks/useChatCount";
import NotificationModal from "./NotificationModal";
import Footer from "./Footer";

const SERVER_URL =
  Platform.OS === "android" ? "http://192.168.1.24:5000" : "http://192.168.1.24:5000";

const ChatForum = ({
  onNavigateToHome,
  onNavigateToProfile,
  onNavigateToLostDogPage,
  onNavigateToFoundDogPage,
  onNavigateToMatchedPage,
  onLogout,
  onNavigateToPrivateChat,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userFullName, setUserFullName] = useState("");
  const [userProfilePic, setUserProfilePic] = useState("");
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const scrollViewRef = useRef(null);
  const socketRef = useRef(null);
  const newChatsCount = useChatCount();

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
          `${SERVER_URL}/api/chat/messages`
        );
        setMessages(
          messagesResponse.data.map((msg) => ({
            id: msg._id,
            text: msg.text,
            isSent: msg.from === userResponse.data.fullName,
            timestamp: new Date(msg.timestamp),
            from: msg.from,
            profilePic: msg.profilePic,
          }))
        );

        const postsResponse = await axios.get(
          `${SERVER_URL}/api/posts/new-posts-count`
        );
        if (postsResponse.status === 200) {
          setNewPostsCount(postsResponse.data.newPostsCount);
        }

        const usersResponse = await axios.get(`${SERVER_URL}/api/chat/users`);
        setUsers(
          usersResponse.data.filter(
            (user) => user.fullName !== userResponse.data.fullName
          )
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

        socketRef.current.on("receive_forum_message", ({ messages, count }) => {
          setMessages(
            messages.map((msg) => ({
              id: msg._id,
              text: msg.text,
              isSent: msg.from === userFullName,
              timestamp: new Date(msg.timestamp),
              from: msg.from,
              profilePic: msg.profilePic,
            }))
          );
        });

        socketRef.current.on("message_error", (error) => {
          console.error("Message error from server:", error);
        });
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
  }, [onLogout, userFullName]);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleHomeClick = () => {
    onNavigateToHome?.();
    setMenuOpen(false);
  };

  const handleProfileClick = () => {
    onNavigateToProfile?.();
    setMenuOpen(false);
  };

  const handleLogoutClick = async () => {
    try {
      await AsyncStorage.removeItem("token");
      onLogout?.();
    } catch (error) {
      console.error("Error during logout:", error);
    }
    setMenuOpen(false);
  };

  const handleTabClick = (tab) => {
    if (tab === "HomePageLostDog") onNavigateToLostDogPage?.();
    else if (tab === "HomePageFoundDog") onNavigateToFoundDogPage?.();
    else if (tab === "HomePageMatched") onNavigateToMatchedPage?.();
  };

  const handleMessageClick = () => { };
  const handleNotificationClick = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleSendMessage = () => {
    if (newMessage.trim() && socketRef.current && userFullName) {
      const messageData = {
        from: userFullName,
        text: newMessage,
        timestamp: new Date().toISOString(),
      };
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Date.now().toString(),
          text: newMessage,
          isSent: true,
          timestamp: new Date(),
          from: userFullName,
          profilePic: userProfilePic,
        },
      ]);
      socketRef.current.emit("send_forum_message", messageData);
      setNewMessage("");
    }
  };

  const handleUserClick = (user) => {
    onNavigateToPrivateChat?.(user);
  };

  const displayedUsers = showAllUsers ? users : users.slice(0, 4);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>PETPALS</Text>
        <TouchableOpacity onPress={toggleMenu} style={styles.hamburgerButton}>
          <View style={styles.hamburger}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        visible={menuOpen}
        transparent
        animationType="slide"
        onRequestClose={toggleMenu}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={toggleMenu}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.menuItem} onPress={handleHomeClick}>
              <Text style={styles.menuText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleProfileClick}
            >
              <Text style={styles.menuText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleLogoutClick}
            >
              <Text style={styles.menuText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.navBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => handleTabClick("HomePageLostDog")}
          >
            <Text style={styles.navText}>Lost Dog</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => handleTabClick("HomePageFoundDog")}
          >
            <Text style={styles.navText}>Found Dog</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => handleTabClick("HomePageMatched")}
          >
            <Text style={styles.navText}>Match</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => handleTabClick("HomePageChatForum")}
          >
            <Text style={styles.navTexts}>Chat Forum</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.mainContent}>
        <ScrollView
          contentContainerStyle={styles.chatContent}
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.noChatsContainer}>
              <Text style={styles.noChatsText}>No chats yet.</Text>
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
                    message.isSent ? styles.sentMessage : styles.receivedMessage,
                  ]}
                >
                  <Text style={styles.messageSender}>{message.from}</Text>
                  <Text
                    style={[
                      message.isSent ? styles.messageSenderText : styles.messageText,
                    ]}
                  >
                    {message.text}
                  </Text>
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

        <View style={styles.userList}>
          <ScrollView showsVerticalScrollIndicator={true}>
            {displayedUsers.map((user) => (
              <TouchableOpacity
                key={user.fullName}
                style={styles.userItem}
                onPress={() => handleUserClick(user)}
              >
                <Image
                  source={
                    user.profilePic
                      ? { uri: `${SERVER_URL}${user.profilePic}` }
                      : require("../assets/images/Global-images/default-user.png")
                  }
                  style={styles.userListAvatar}
                />
                <Text style={styles.userName}>{user.fullName}</Text>
              </TouchableOpacity>
            ))}
            {users.length > 4 && !showAllUsers && (
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => setShowAllUsers(true)}
              >
                <Text style={styles.moreText}>More</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
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

      <Footer
        onNavigateToHome={handleHomeClick}
        onNavigateToChatForum={handleMessageClick}
        handleNotificationClick={handleNotificationClick}
        newChatsCount={newChatsCount}
        newPostsCount={newPostsCount}
      />

      <NotificationModal isModalOpen={isModalOpen} closeModal={closeModal} />
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    fontFamily: 'Roboto',
  },
  hamburgerButton: {
    padding: 10,
  },
  hamburger: {
    width: 30,
    height: 20,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: 30,
    height: 3,
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-start',
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    width: '100%',
    maxHeight: '40%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    marginTop: "auto"
  },
  menuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    transition: 'backgroundColor 0.3s',
  },
  menuText: {
    fontSize: 18,
    color: '#6B4E31',
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  navBar: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  navButton: {
    backgroundColor: '#6B4E31',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  navText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  navTexts: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Roboto',
    textDecorationLine: 'underline',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
  },
  chatContent: {
    flexGrow: 1,
    padding: 20,
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
  userList: {
    width: 130,
    backgroundColor: '#FFF',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0, 0, 0, 0.1)',
    maxHeight: '100%',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F9F9F9',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userListAvatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  userName: {
    fontSize: 14,
    color: '#6B4E31',
    fontWeight: '500',
    fontFamily: 'Roboto',
    textTransform: 'capitalize',
    flexShrink: 1,
  },
  moreButton: {
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#FFD700',
    borderRadius: 10,
    margin: 5,
  },
  moreText: {
    color: '#6B4E31',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Roboto',
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
    backgroundColor: '#6B4E31',
  },
  receivedMessage: {
    backgroundColor: '#FFF',
  },
  messageSender: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 5,
    fontFamily: 'Roboto',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 22,
    fontFamily: 'Roboto',
  },
  messageSenderText: {
    fontSize: 16,
    color: '#FFF',
    lineHeight: 22,
    fontFamily: 'Roboto',
  },
  messageTimestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
    textAlign: 'right',
    fontFamily: 'Roboto',
  },
  userAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
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

export default ChatForum;