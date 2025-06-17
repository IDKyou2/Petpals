import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Footer from "./Footer";

// Define API URL constant
const BASE_URL = "http://192.168.1.24:5000";

const SuggestionsForm = ({
  onBackClick,
  onNavigateToProfile,
  onNavigateToLostDogPage,
  onNavigateToMatchedPage,
  onNavigateToFoundDogPage,
  onNavigateToChatForum,
  onNavigateToSuggestionsPage,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [rating, setRating] = useState(0);
  const [submitStatus, setSubmitStatus] = useState(null);

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    onBackClick();
  };

  const profileAccount = () => {
    if (onNavigateToProfile) {
      onNavigateToProfile();
    }
    setMenuOpen(false);
  };

  const handleMessageClick = () => {
    if (onNavigateToChatForum) {
      onNavigateToChatForum();
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleTabClick = (tab) => {
    if (tab === "HomePageLostDog" && onNavigateToLostDogPage) {
      onNavigateToLostDogPage();
    } else if (tab === "HomePageMatched" && onNavigateToMatchedPage) {
      onNavigateToMatchedPage();
    } else if (tab === "HomePageFoundDog" && onNavigateToFoundDogPage) {
      onNavigateToFoundDogPage();
    } else if (
      tab === "SuggestionsPage" &&
      onNavigateToSuggestionsPage
    ) {
      onNavigateToSuggestionsPage();
    }
  };

  const handleSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const response = await fetch(`${BASE_URL}/api/suggestions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ suggestion, rating }),
      });
      if (response.ok) {
        setSubmitStatus("Suggestion submitted successfully!");
        setSuggestion("");
        setRating(0);
        setTimeout(() => setSubmitStatus(null), 3000);
        if (onNavigateToSuggestionsPage) {
          onNavigateToSuggestionsPage();
        }
      } else {
        throw new Error("Submission failed");
      }
    } catch (error) {
      setSubmitStatus(`Error: ${error.message}`);
      console.error(error);
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity
        key={star}
        onPress={() => setRating(star)}
        style={styles.starButton}
      >
        <Text style={rating >= star ? styles.filledStar : styles.emptyStar}>
          ★
        </Text>
      </TouchableOpacity>
    ));
  };

  return (
    <View style={styles.container}>
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
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMenuOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
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
      <View style={styles.navBar}>
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
      </View>
      <View style={styles.formWrapper}>
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Submit a Suggestion</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={6}
            placeholder="Enter your suggestion here (max 500 characters)"
            value={suggestion}
            onChangeText={setSuggestion}
            maxLength={500}
            placeholderTextColor="#6B4E31"
          />
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Rating:</Text>
            <View style={styles.starsContainer}>{renderStars()}</View>
          </View>
          <TouchableOpacity
            style={[
              styles.submitButton,
              !suggestion || !rating ? styles.disabledButton : null,
            ]}
            onPress={handleSubmit}
            disabled={!suggestion || !rating}
          >
            <Text style={styles.submitButtonText}>Submit Suggestion</Text>
          </TouchableOpacity>
          {submitStatus && (
            <Text style={styles.submitStatus}>{submitStatus}</Text>
          )}
        </View>
      </View>
      <Footer
        onNavigateToHome={() => console.log("Home clicked")}
        onNavigateToChatForum={handleMessageClick}
        handleNotificationClick={() => console.log("Notifications clicked")}
        newChatsCount={0}
        newPostsCount={0}
      />
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
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  },
  navText: {
    fontSize: 14,
    color: '#6B4E31',
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  formWrapper: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  formContainer: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
    width: '100%',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6B4E31',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
  textArea: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    color: '#333',
    width: '100%',
    fontFamily: 'Roboto',
    shadowColor: '#ddd',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    height: 120,
    textAlignVertical: 'top',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'center',
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B4E31',
    marginRight: 10,
    fontFamily: 'Roboto',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starButton: {
    padding: 5,
  },
  filledStar: {
    fontSize: 24,
    color: '#FFD700',
  },
  emptyStar: {
    fontSize: 24,
    color: 'rgba(0, 0, 0, 0.1)',
  },
  submitButton: {
    backgroundColor: '#FFD700',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#FFD700',
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    color: '#6B4E31',
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
  submitStatus: {
    marginTop: 10,
    fontSize: 14,
    color: '#FF4D4D',
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
});

export default SuggestionsForm;