import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import io from "socket.io-client";
import axios from "axios";
import useChatCount from "./hooks/useChatCount";
import NotificationModal from "./NotificationModal";
import Footer from "./Footer";

// Define API URL constants
const BASE_URL = "http://192.168.1.6:5000";
const NEW_POSTS_API_URL = `${BASE_URL}/api/posts/new-posts-count`;
const SUGGESTIONS_API_URL = `${BASE_URL}/api/suggestions`;

const SuggestionsPage = ({
  onNavigateToHome,
  onNavigateToProfile,
  onLogout,
  onNavigateToLostDogPage,
  onNavigateToFoundDogPage,
  onNavigateToChatForum,
  reloadTrigger,
  onNavigateToMatchedPage,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionText, setSuggestionText] = useState("");
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const newChatsCount = useChatCount();

  useEffect(() => {
    const fetchNewPostsCount = async () => {
      try {
        const response = await fetch(NEW_POSTS_API_URL);
        const data = await response.json();
        if (response.status === 200) setNewPostsCount(data.newPostsCount);
      } catch (error) {
        console.error("Error fetching new posts count:", error);
      }
    };

    const fetchSuggestions = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const response = await axios.get(SUGGESTIONS_API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuggestions(response.data);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    };

    fetchNewPostsCount();
    fetchSuggestions();

    const socket = io(BASE_URL, { transports: ["websocket"] });
    socket.on("connect", () => console.log("Connected:", socket.id));
    socket.on("disconnect", () => console.log("Disconnected"));
    socket.on("newSuggestion", (newSuggestion) => {
      setSuggestions((prev) =>
        [newSuggestion, ...prev].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )
      );
    });

    return () => socket.disconnect();
  }, [reloadTrigger]);

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

  const handleMessageClick = () => onNavigateToChatForum?.();
  const handleNotificationClick = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const handleSubmitSuggestion = async () => {
    if (!suggestionText.trim()) {
      setSuccessMessage("Please enter a suggestion.");
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }
    if (rating === 0) {
      setSuccessMessage("Please select a rating.");
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }
    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setSuccessMessage("You must be logged in to submit a suggestion!");
        setTimeout(() => setSuccessMessage(null), 3000);
        setIsSubmitting(false);
        return;
      }
      const response = await axios.post(
        SUGGESTIONS_API_URL,
        {
          suggestion: suggestionText,
          rating: rating,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.status === 200) {
        setSuggestionText("");
        setRating(0);
        setSuccessMessage("Suggestion submitted!");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      setSuccessMessage("Failed to submit suggestion. Please try again.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStarPress = (starIndex) => {
    setRating(starIndex);
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

      {/* Menu Modal */}
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

      {/* Navigation Bar */}
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
            onPress={() => handleTabClick("HomePageSuggestions")}
          >
            <Text style={styles.navTextActive}>View Suggestions</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main container */}
      <View style={styles.suggestionInputContainer}>
        {/* Second container */}
        <View style={styles.ratingInputContainer}>
          <Text style={styles.ratingLabel}>Rate our app: </Text>
          {[1, 2, 3, 4, 5].map((starIndex) => (
            <TouchableOpacity
              key={starIndex}
              onPress={() => handleStarPress(starIndex)}
            >
              <Text
                style={[
                  styles.star,
                  starIndex <= rating && styles.starSelected,
                ]}
              >
                ★
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.suggestionInputWrapper}>
          {successMessage && (
            <Text
              style={[
                styles.successMessage,
                successMessage.includes("Please") ||
                  successMessage.includes("Failed") ||
                  successMessage.includes("logged in")
                  ? styles.errorMessage
                  : null,
              ]}
            >
              {successMessage}
            </Text>
          )}
          <TextInput
            style={styles.suggestionInput}
            placeholder="Comment suggestions here."
            placeholderTextColor="#666"
            value={suggestionText}
            onChangeText={setSuggestionText}
            multiline
            maxLength={200}
          />
          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitSuggestion}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? "Processing..." : "Submit"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {suggestions.length === 0 ? (
          <Text style={styles.noDataText}>No posted suggestions yet.</Text>
        ) : (
          suggestions.map((suggestion, index) => {
            const createdAt = new Date(suggestion.createdAt);
            const formattedDate = createdAt.toLocaleDateString();
            const formattedTime = createdAt.toLocaleTimeString();

            return (
              <View key={index} style={styles.suggestionCard}>
                <Text style={styles.suggestionUser}>
                  Suggested by:{" "}
                  <Text style={styles.suggestionUserName}>
                    {suggestion.userId?.fullName || "Anonymous"}
                  </Text>
                </Text>
                <Text style={styles.suggestionText}>
                  {suggestion.suggestion}
                </Text>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((starIndex) => (
                    <Text
                      key={starIndex}
                      style={[
                        styles.star,
                        starIndex <= suggestion.rating && styles.starSelected,
                      ]}
                    >
                      ★
                    </Text>
                  ))}
                </View>
                <Text style={styles.suggestionDate}>
                  Posted on: {formattedDate} at {formattedTime}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Footer */}
      <Footer
        onNavigateToHome={handleHomeClick}
        onNavigateToChatForum={handleMessageClick}
        handleNotificationClick={handleNotificationClick}
        newChatsCount={newChatsCount}
        newPostsCount={newPostsCount}
      />

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
    justifyContent: 'flex-start',
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
  navTextActive: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Roboto',
    textDecorationLine: 'underline',
  },
  suggestionInputContainer: {
    padding: 15,
    backgroundColor: '#FFF',
    alignSelf: 'center',
    marginTop: 10,
    borderRadius: 15,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  suggestionInputWrapper: {
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 10,
  },
  suggestionInput: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 5,
    fontFamily: 'Roboto',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ratingInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingLabel: {
    fontSize: 16,
    color: '#6B4E31',
    marginRight: 10,
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  star: {
    fontSize: 24,
    color: '#ccc',
  },
  starSelected: {
    color: '#FFD700',
  },
  submitButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 5,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  submitButtonText: {
    color: '#6B4E31',
    fontSize: 16,
    fontWeight: 'bold',
    alignSelf: 'center',
    fontFamily: 'Roboto',
  },
  submitButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  successMessage: {
    fontSize: 14,
    color: '#006600',
    textAlign: 'center',
    marginTop: 0,
    marginBottom: 10,
    fontFamily: 'Roboto',
  },
  errorMessage: {
    color: '#FF0000',
  },
  content: {
    flexGrow: 1,
    padding: 15,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#6B4E31',
    alignSelf: 'center',
    textAlign: 'center',
    fontFamily: 'Roboto',
    marginTop: 20,
  },
  suggestionCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    marginBottom: 15,
    width: '100%',
    maxWidth: 400,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  suggestionUser: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#6B4E31',
    fontFamily: 'Roboto',
  },
  suggestionUserName: {
    color: '#0066cc',
  },
  suggestionText: {
    fontSize: 16,
    color: '#6B4E31',
    marginBottom: 10,
    fontFamily: 'Roboto',
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  suggestionDate: {
    fontSize: 12,
    color: '#6B4E31',
    fontFamily: 'Roboto',
  },
});

export default SuggestionsPage;