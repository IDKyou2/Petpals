import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import axios from "axios";
import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useChatCount from "./hooks/useChatCount";
import NotificationModal from "./NotificationModal";
import Footer from "./Footer";

const HomePage = ({
  onBackClick,
  onNavigateToProfile,
  onNavigateToLostDogForm,
  onNavigateToFoundDogForm,
  onNavigateToLostDogPage,
  onNavigateToMatchedPage,
  onNavigateToFoundDogPage,
  onNavigateToChatForum,
  onNavigateToSuggestionsPage,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const newChatsCount = useChatCount();

  // Define API URL constants
  const NEW_POSTS_API_URL = "http://192.168.1.6:5000/api/posts/new-posts-count";
  const profileApi = "http://192.168.1.6:5000/api/auth/user/profile";

  useEffect(() => {
    const fetchNewPostsCount = async () => {
      try {
        const response = await axios.get(NEW_POSTS_API_URL);
        if (response.status === 200) {
          setNewPostsCount(response.data.newPostsCount);
        }
      } catch (error) {
        console.error("Error fetching new posts count:", error);
      }
    };
    fetchNewPostsCount();
  }, []);

  useEffect(() => {
    const socketConnection = io(NEW_POSTS_API_URL);
    socketConnection.on("receive_forum_message", ({ count }) => { });
    return () => socketConnection.disconnect();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.error("No token found in AsyncStorage");
        return;
      }
      try {
        const response = await fetch(profileApi, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setUserData({
            fullName: data.fullName || "Juan Dela Cruz",
            profilePic: data.profilePic || "/default-avatar.png",
          });
        } else {
          console.error("Error from server:", data.message);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, []);

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    onBackClick();
  };

  const profileAccount = () => {
    onNavigateToProfile?.();
    setMenuOpen(false);
  };

  const viewNotifications = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const handleMessageClick = () => onNavigateToChatForum?.();

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleTabClick = (tab) => {
    if (tab === "HomePageLostDog") onNavigateToLostDogPage?.();
    else if (tab === "HomePageMatched") onNavigateToMatchedPage?.();
    else if (tab === "HomePageFoundDog") onNavigateToFoundDogPage?.();
    else if (tab === "SuggestionsPage")
      onNavigateToSuggestionsPage?.();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
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

      {/* Hamburger Menu Modal */}
      <Modal
        visible={menuOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMenuOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setMenuOpen(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setMenuOpen(false)}
            >
              <Text style={styles.menuText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={profileAccount}>
              <Text style={styles.menuText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={logout}>
              <Text style={styles.menuText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Navigation Tabs */}
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
            onPress={() => handleTabClick("SuggestionsPage")}
          >
            <Text style={styles.navText}>View Suggestions</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileContainer}>
          <Image
            source={
              userData?.profilePic
                ? {
                  uri: `${profileApi.replace("/api/auth/user/profile", "")}${userData.profilePic}`,
                }
                : require("../assets/images/Global-images/default-user-profile.png")
            }
            style={styles.profileImage}
          />
          <Text style={styles.nameText}>
            {userData?.fullName || "User"}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.lostButton}
            onPress={onNavigateToLostDogForm}
          >
            <Text style={styles.buttonTextLost}>I LOST A DOG</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.foundButton}
            onPress={onNavigateToFoundDogForm}
          >
            <Text style={styles.buttonTextFound}>I FOUND A DOG</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer */}
      <Footer
        onNavigateToHome={() => setMenuOpen(false)}
        onNavigateToChatForum={handleMessageClick}
        handleNotificationClick={viewNotifications}
        newChatsCount={newChatsCount}
        newPostsCount={newPostsCount}
      />

      {/* Notification Modal */}
      <NotificationModal isModalOpen={isModalOpen} closeModal={closeModal} />
    </View>
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
    // borderBottomLeftRadius: 20,
    // borderBottomRightRadius: 20,
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    // borderBottomLeftRadius: 20,
    // borderBottomRightRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '40%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    marginTop: 340,
    marginTop: "auto"
  },
  menuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  navButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  navText: {
    color: '#6B4E31',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FFD700',
    marginBottom: 10,
    backgroundColor: '#F9F9F9',
  },
  nameText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B4E31',
    textTransform: 'capitalize',
    fontFamily: 'Roboto',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  lostButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 15,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  buttonTextLost: {
    color: '#6B4E31',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
  foundButton: {
    backgroundColor: '#FFF',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 10,
    width: '85%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  buttonTextFound: {
    color: '#6B4E31',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
});

export default HomePage;