import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  TextInput,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import io from "socket.io-client";
import useChatCount from "./hooks/useChatCount";
import NotificationModal from "./NotificationModal";
import Footer from "./Footer";

// Define API URL constants
const BASE_URL =
  Platform.OS === "android" ? "http://192.168.1.24:5000" : "http://192.168.1.24:5000";
const USER_PROFILE_API_URL = `${BASE_URL}/api/auth/user/profile`;
const NEW_POSTS_API_URL = `${BASE_URL}/api/posts/new-posts-count`;

const UserProfile = ({ onNavigateToHome, onLogout, onNavigateToChatForum }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newContact, setNewContact] = useState("");
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const newChatsCount = useChatCount();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchUserDataAndPostsCount = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.error("No token found in AsyncStorage");
        onLogout?.();
        return;
      }

      try {
        const userResponse = await axios.get(USER_PROFILE_API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (userResponse.status === 200) {
          setUserData({
            fullName: userResponse.data.fullName || "",
            contact: userResponse.data.contact || "",
            email: userResponse.data.email || "",
            profilePic: userResponse.data.profilePic,
          });
          setNewContact(userResponse.data.contact || "");

          const messagesResponse = await axios.get(
            `${BASE_URL}/api/chat/private-messages/${userResponse.data.fullName}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setMessages(
            messagesResponse.data.map((msg) => ({
              id: msg._id,
              text: msg.text,
              from: msg.from,
              to: msg.to,
              timestamp: new Date(msg.timestamp),
              profilePic: msg.profilePic,
              read: msg.read,
            }))
          );
        }

        const postsResponse = await axios.get(NEW_POSTS_API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (postsResponse.status === 200) {
          setNewPostsCount(postsResponse.data.newPostsCount);
        }
      } catch (error) {
        console.error("Error fetching data:", error.response?.data || error);
      }
    };

    fetchUserDataAndPostsCount();
  }, [onLogout]);

  useEffect(() => {
    let socket;

    const socketSetup = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token || !userData) return;

      socket = io(BASE_URL, {
        query: { token },
        transports: ["websocket"],
      });

      socket.on("connect", () => {
        console.log("Connected to Socket.IO server");
      });

      socket.on("disconnect", () => {
        console.log("Disconnected from Socket.IO server");
      });

      socket.on(`private_message_${userData.fullName}_*`, (newMessages) => {
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages, ...newMessages];
          const uniqueMessages = Array.from(
            new Map(updatedMessages.map((msg) => [msg._id, msg])).values()
          );
          return uniqueMessages.sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
          );
        });
      });

      return () => {
        if (socket) socket.disconnect();
      };
    };

    socketSetup();

    return () => {
      if (socket) socket.disconnect();
    };
  }, [userData, onLogout]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const handleHomeClick = () => {
    onNavigateToHome?.();
    setMenuOpen(false);
  };
  const handleProfileClick = () => setMenuOpen(false);
  const logout = async () => {
    await AsyncStorage.removeItem("token");
    onLogout?.();
    setMenuOpen(false);
  };
  const handleLogoutClick = () => logout();
  const handleMessageClick = () => onNavigateToChatForum?.();
  const handleNotificationClick = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const handleEditAccount = () => setIsEditing(true);
  const handleSaveChanges = () => {
    if (!newContact.trim()) return;
    setConfirmationModalVisible(true);
  };
  const handleConfirmChange = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;

    try {
      const response = await axios.put(
        USER_PROFILE_API_URL,
        {
          fullName: userData.fullName,
          contact: newContact,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status === 200) {
        // Contact number validation
        const isValidPHNumber = (number) => {
          const regex = /^09\d{9}$/;
          return regex.test(number);
        };

        if (!isValidPHNumber(newContact)) {
          setError("Please enter a valid contact number.");
          setConfirmationModalVisible(false);
          return;
          //Alert.alert("Error", "Please enter a valid contact number\n(eg. 09XXXXXXXXX).");
          //setIsEditing(false);
          //
        } else {
          setUserData({ ...userData, contact: newContact });
          setIsEditing(false);
          setConfirmationModalVisible(false);
          setSuccess("Changes saved successfully!");
          setTimeout(() => {
            setSuccess(null);
          }, 5000); // 5 seconds

        }
        setError(null);
      }
    } catch (error) {
      console.error("Error updating user profile:", error);
    }
  };
  const handleCancelChange = () => {
    setConfirmationModalVisible(false);
    setIsEditing(false);
    setNewContact(userData?.contact || "Error fetching contact");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.petText}>PETPALS</Text>
        <TouchableOpacity onPress={toggleMenu} style={styles.hamburgerButton}>
          <View style={styles.hamburger}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Hamburger Menu Modal */}
      <Modal visible={menuOpen} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={toggleMenu}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.menuItem} onPress={handleHomeClick}>
              <Text style={styles.menuText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleProfileClick}>
              <Text style={styles.menuText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogoutClick}>
              <Text style={styles.menuText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* User Profile Section */}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileContainer}>
          <Image
            source={
              userData?.profilePic
                ? { uri: `${BASE_URL}${userData.profilePic}` }
                : require("../assets/images/Global-images/default-user-profile.png")
            }
            style={styles.profileImage}
            onError={() => console.log("Image failed to load.")}
          />
          <Text style={styles.profileNameText}>
            {userData?.fullName || ""}
          </Text>
          {isEditing ? (
            <View style={styles.editContainer}>
              {/*<Text>Display name: </Text>*/}
              {/*<Text style={styles.nameText}>
                {userData?.fullName || ""}
              </Text>*/}
              {error && <Text style={styles.errorMessage}>{error}</Text>}
              <TextInput
                style={styles.contactInput}
                value={newContact}
                onChangeText={(text) => {
                  const numericText = text.replace(/[^0-9]/g, "");
                  if (numericText.length <= 11) {
                    setNewContact(numericText);
                  }
                }}
                placeholder="Enter new contact number"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                maxLength={11}
                autoFocus
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveChanges}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelChange}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.profileCard}>
              {success && (
                <View style={styles.successContainer}>
                  <Text style={styles.successMessage}>{success}</Text>
                </View>
              )}

              <Text style={styles.emailText}>
                Full name: {userData?.fullName || "..."}
              </Text>
              {/*
              <Text style={styles.emailText}>
                Email: {userData?.email || "..."}
              </Text>
              */}
              <Text style={styles.contactText}>
                Contact #: {userData?.contact || "..."}
              </Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditAccount}
              >
                <Text style={styles.editButtonText}>Edit Info</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Inbox Section */}
        <View style={styles.inboxContainer}>
          <Text style={styles.inboxTitle}>Inbox</Text>
          <ScrollView style={styles.messagesContainer}>
            {messages.length > 0 ? (
              messages.map((message) => (
                <View key={message.id} style={styles.messageItem}>
                  <Image
                    source={
                      message.profilePic
                        ? { uri: `${BASE_URL}${message.profilePic}` }
                        : require("../assets/images/Global-images/default-user.png")
                    }
                    style={styles.messageAvatar}
                  />
                  <View style={styles.messageContent}>
                    <Text style={styles.messageSender}>
                      {message.from === userData?.fullName
                        ? "You"
                        : message.from}
                    </Text>
                    <Text style={styles.messageText}>{message.text}</Text>
                    <Text style={styles.messageTimestamp}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    {!message.read && message.to === userData?.fullName && (
                      <Text style={styles.unreadText}>Unread</Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noMessages}>No messages yet.</Text>
            )}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Footer */}
      <Footer
        onNavigateToHome={handleHomeClick}
        onNavigateToChatForum={handleMessageClick}
        handleNotificationClick={handleNotificationClick}
        newChatsCount={newChatsCount}
        newPostsCount={newPostsCount}
      />

      {/* Confirmation Modal */}
      <Modal
        visible={confirmationModalVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.confirmationModalOverlay}>
          <View style={styles.confirmationModalContent}>
            <Text style={styles.confirmationModalText}>
              Are you sure you want to change your contact number?
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmChange}
              >
                <Text style={styles.confirmButtonText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelChange}
              >
                <Text style={styles.cancelButtonText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notification Modal */}
      <NotificationModal isModalOpen={isModalOpen} closeModal={closeModal} />
    </View>
  );
};

const styles = StyleSheet.create({
  errorMessage: {
    color: "red",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
  },
  successContainer: {
    alignSelf: 'center',
  },
  successMessage: {
    color: "green",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#6B4E31",
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  petText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFD700",
    fontFamily: "Roboto",
  },
  hamburgerButton: {
    padding: 10,
  },
  hamburger: {
    width: 30,
    height: 20,
    justifyContent: "space-between",
  },
  hamburgerLine: {
    width: 30,
    height: 3,
    backgroundColor: "#FFD700",
    borderRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-start",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    // borderBottomLeftRadius: 20,
    // borderBottomRightRadius: 20,
    padding: 20,
    width: "100%",
    maxHeight: "40%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    marginTop: "auto"
  },
  menuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  menuText: {
    fontSize: 18,
    color: "#6B4E31",
    fontWeight: "600",
    fontFamily: "Roboto",
  },
  content: {
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 80,
    alignItems: "center",
  },
  profileContainer: {
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#FFD700",
    marginBottom: 10,
    backgroundColor: "#F9F9F9",
  },
  profileNameText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6B4E31",
    marginBottom: 15,
    textAlign: "center",
    textTransform: "capitalize",
    fontFamily: "Roboto",
  },
  profileCard: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 20,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    width: "100%",
  },
  editContainer: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    width: "100%",
  },
  emailText: {
    fontSize: 16,
    color: "#6B4E31",
    marginBottom: 0,
    fontWeight: "600",
    fontFamily: "Roboto",
  },
  nameText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6B4E31",
    marginBottom: 10,
    textAlign: "center",
    textTransform: "capitalize",
    fontFamily: "Roboto",
  },
  contactText: {
    fontSize: 16,
    color: "#6B4E31",
    marginBottom: 15,
    fontWeight: "600",
    fontFamily: "Roboto",
  },
  editButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  editButtonText: {
    color: "#6B4E31",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Roboto",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    maxWidth: 280,
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  saveButtonText: {
    color: "#6B4E31",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Roboto",
  },
  cancelButton: {
    marginLeft: 10,
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FFD700",
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  cancelButtonText: {
    color: "#6B4E31",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Roboto",
  },
  contactInput: {
    backgroundColor: "#F9F9F9",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    width: "100%",
    maxWidth: 280,
    marginBottom: 15,
    fontFamily: "Roboto",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inboxContainer: {
    width: "100%",
    maxWidth: 400,
    padding: 15,
    backgroundColor: "#FFF",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  inboxTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6B4E31",
    marginBottom: 10,
    fontFamily: "Roboto",
  },
  messagesContainer: {
    maxHeight: 200,
  },
  messageItem: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  messageAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  messageContent: {
    flex: 1,
  },
  messageSender: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6B4E31",
    fontFamily: "Roboto",
  },
  messageText: {
    fontSize: 14,
    color: "#6B4E31",
    fontFamily: "Roboto",
  },
  messageTimestamp: {
    fontSize: 12,
    color: "#6B4E31",
    fontFamily: "Roboto",
  },
  unreadText: {
    fontSize: 12,
    color: "#FF4D4D",
    fontWeight: "bold",
    fontFamily: "Roboto",
  },
  noMessages: {
    fontSize: 16,
    color: "#6B4E31",
    textAlign: "center",
    fontFamily: "Roboto",
  },
  confirmationModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  confirmationModalContent: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 20,
    width: "90%",
    maxWidth: 320,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  confirmationModalText: {
    fontSize: 18,
    color: "#6B4E31",
    marginBottom: 20,
    textAlign: "center",
    fontFamily: "Roboto",
  },
  confirmationButtons: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
  },
  confirmButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  confirmButtonText: {
    color: "#6B4E31",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Roboto",
  },
});

export default UserProfile;