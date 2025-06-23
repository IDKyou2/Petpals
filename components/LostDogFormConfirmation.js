import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import useChatCount from "./hooks/useChatCount";
import NotificationModal from "./NotificationModal";
import Footer from "./Footer";

const LostDogFormConfirmation = ({
  onNavigateToHome,
  onNavigateToProfile,
  onNavigateToLostDogForm,
  formData,
  onLogout,
  onNavigateToLostDogPage,
  onNavigateToMatchedPage,
  onNavigateToChatForum,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionIdRef = useRef(null);
  const [editName, setEditName] = useState(formData?.name || "");
  const [editBreed, setEditBreed] = useState(formData?.breed || "");
  const [editSize, setEditSize] = useState(formData?.size || "");
  const [editDetails, setEditDetails] = useState(
    formData?.details || ""
  );
  const [editGender, setEditGender] = useState(formData?.gender || "");
  const [editLocation, setEditLocation] = useState(
    formData?.location || ""
  );
  const [image, setImage] = useState(formData?.image || null);
  const newChatsCount = useChatCount();
  const NEW_POSTS_API_URL = "http://192.168.1.6:5000/api/posts/new-posts-count";
  const LOST_DOG_API_URL = "http://192.168.1.6:5000/api/lostdog";

  useEffect(() => {
    const fetchNewPostsCount = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          console.error("No token found in AsyncStorage");
          return;
        }
        const response = await axios.get(NEW_POSTS_API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200) {
          setNewPostsCount(response.data.newPostsCount);
        }
      } catch (error) {
        console.error("Error fetching new posts count:", error);
      }
    };
    fetchNewPostsCount();
  }, []);
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const handleMessageClick = () => {
    console.log("Message clicked");
    if (onNavigateToChatForum) {
      onNavigateToChatForum();
    }
  };
  const handleNotificationClick = () => {
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
  };
  const handleHomeClick = () => {
    onNavigateToHome?.();
    setMenuOpen(false);
  };
  const handleProfileClick = () => {
    onNavigateToProfile?.();
    setMenuOpen(false);
  };
  const handleLogoutClick = () => {
    onLogout?.();
    setMenuOpen(false);
  };
  const handleTabClick = (tab) => {
    console.log(`Tab clicked: ${tab}`);
  };

  const handleEditClick = () => setIsEditing(true);
  const handleSaveChanges = () => {
    const capitalizeFirstLetter = (string) => {
      if (!string) return "";
      return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const fields = [editName, editBreed, editSize, editGender, editLocation];

    if (fields.every(field => field)) {
      setIsEditing(false);
      console.log("Updated data:", {
        name: capitalizeFirstLetter(editName),
        breed: capitalizeFirstLetter(editBreed),
        size: capitalizeFirstLetter(editSize),
        details: editDetails || "No additional details provided.",
        gender: capitalizeFirstLetter(editGender),
        location: capitalizeFirstLetter(editLocation),
      });
    } else {
      Alert.alert("An error occurred while saving.", "There was an error saving your changes. Please ensure that all fields are filled out correctly.");
      console.warn("Error: There was an error saving your details. Please ensure that all fields are filled out correctly.");
    }
  };

  const handleReportAsLostClick = () => {
    if (!isSubmitting) {
      setModalVisible(true);
    }
  };

  const handleConfirmReport = async () => {
    if (isSubmitting) return;

    const submissionId = Date.now().toString();
    if (submissionIdRef.current === submissionId) return;
    submissionIdRef.current = submissionId;

    setIsSubmitting(true);
    setModalVisible(false);

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "You must be logged in to report a lost dog.");
        throw new Error("No token");
      }

      const updatedFormData = {
        name: editName,
        breed: editBreed,
        size: editSize,
        details: editDetails || "No additional details provided.",
        gender: editGender,
        location: editLocation,
        image,
      };

      const formDataToSend = new FormData();
      Object.entries(updatedFormData).forEach(([key, value]) => {
        if (value) {
          if (key === "image" && value?.uri) {
            formDataToSend.append("dogImage", {
              uri: value.uri,
              type: "image/jpeg",
              name: "dogImage.jpg",
            });
          } else {
            formDataToSend.append(key, value);
          }
        }
      });

      console.log("Sending request to backend with data:", {
        headers: { Authorization: `Bearer ${token}` },
        formData: [...formDataToSend],
      });

      const response = await axios.post(LOST_DOG_API_URL, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 15000,
      });

      console.log("Server Response:", response.data);

      if (response.status === 201) {
        if (onNavigateToLostDogPage && onNavigateToMatchedPage) {
          onNavigateToLostDogPage();
          onNavigateToMatchedPage();
        } else {
          console.error("Navigation functions are not defined!");
        }
        Alert.alert("Success", "Lost dog reported successfully! Please wait for a moment as we'll check if we have a match for your missing dog.");
        console.log("Success", "Lost dog reported successfully!");
      }
    } catch (error) {
      console.error("Detailed error reporting lost dog:", {
        message: error.message,
        code: error.code,
        config: error.config,
        response: error.response?.data,
      });

      let errorMessage = "Failed to report lost dog.";
      if (error.code === "ECONNABORTED") {
        errorMessage = "Request timed out. Check your network or server.";
      } else if (error.message.includes("Network Error")) {
        errorMessage =
          "Network error. Ensure server is running and accessible. Check if the image upload failed.";
      } else if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setIsSubmitting(false);
      submissionIdRef.current = null;
    }
  };

  const handleCancelReport = () => {
    setModalVisible(false);
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
        transparent
        animationType="slide"
        onRequestClose={toggleMenu}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={toggleMenu}
        >
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
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleTabClick("HomePageLostDog")}
        />
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleTabClick("HomePageFoundDog")}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => onNavigateToLostDogForm?.()}
        >
          <Image
            source={require("../assets/images/back-arrow.png")}
            style={styles.backArrow}
          />
          <Text style={styles.backText}>Go back to form</Text>
        </TouchableOpacity>

        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Text style={styles.profileTitle}>Details</Text>
          </View>


          <Image
            source={
              image
                ? { uri: image.uri }
                : require("../assets/images/dog-icon.png")
            }
            style={styles.dogImage}
            resizeMode="contain"
          />

          <View style={styles.dogDetails}>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Dog Name"
                placeholderTextColor="#A9A9A9"
              />
            ) : (
              <Text style={styles.dogInfo}>Name:{" "}{editName}</Text>
            )}
            {isEditing ? (
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[styles.genderButton, editGender === "Male" && styles.genderButtonSelected]}
                  onPress={() => setEditGender("Male")}
                >
                  <Image
                    source={require("../assets/images/male-icon.png")}
                    style={styles.genderIcon}
                  />
                  <Text
                    style={[styles.genderText, editGender === "Male" && styles.genderTextSelected]}
                  >
                    Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderButton, editGender === "Female" && styles.genderButtonSelected]}
                  onPress={() => setEditGender("Female")}
                >
                  <Image
                    source={require("../assets/images/female-icon.png")}
                    style={styles.genderIcon}
                  />
                  <Text
                    style={[styles.genderText, editGender === "Female" && styles.genderTextSelected]}
                  >
                    Female
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.dogInfo}>Gender: {editGender}</Text>
            )}
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editBreed}
                onChangeText={setEditBreed}
                placeholder="Breed (Common breeds: Aspin, Shi Tzu, etc.)"
                placeholderTextColor="#A9A9A9"
              />
            ) : (
              <Text style={styles.dogInfo}>Breed: {editBreed}</Text>
            )}
            {isEditing ? (
              <TextInput
                style={styles.sizeInput}
                value={editSize}
                onChangeText={setEditSize}
                placeholder="Size (Small, Medium, Huge)"
                placeholderTextColor="#A9A9A9"
              />
            ) : (
              <Text style={styles.dogInfo}>Size: {editSize}</Text>
            )}
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editLocation}
                onChangeText={setEditLocation}
                placeholder="Dog's last seen location"
                placeholderTextColor="#A9A9A9"
              />
            ) : (
              <View style={styles.locationContainer}>
                <Text style={styles.dogInfo}>Last seen at: {editLocation}</Text>
              </View>
            )}
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.detailsInput]}
                value={editDetails}
                onChangeText={setEditDetails}
                placeholder="Additional details (optional)"
                placeholderTextColor="#A9A9A9"
                multiline
                numberOfLines={3}
              />
            ) : (
              <Text style={styles.dogInfo}>
                Additional details:{"\n"}
                {editDetails.trim() ? (
                  editDetails
                ) : (
                  <Text style={styles.placeholderText}>No additional details provided.</Text>
                )}
              </Text>
            )}
          </View>

          {isEditing && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveChanges}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          )}

          {!isEditing && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditClick}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}

          {!isEditing && (
            <TouchableOpacity
              style={[styles.reportButton, isSubmitting && styles.disabledButton]}
              onPress={handleReportAsLostClick}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.reportButtonText}>REPORT AS LOST</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !isSubmitting && setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <Text style={styles.modalText}>Do you want to report this as lost?</Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.yesButton, isSubmitting && styles.disabledButton]}
                onPress={handleConfirmReport}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.buttonTextYes}>YES</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.noButton}
                onPress={handleCancelReport}
                disabled={isSubmitting}
              >
                <Text style={styles.buttonText}>NO</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    marginTop: "auto"
  },
  confirmationModal: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  modalText: {
    fontSize: 18,
    color: '#6B4E31',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Roboto',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
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
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  navButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  content: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 15,
    padding: 10,
    borderRadius: 8,
  },
  backArrow: {
    width: 24,
    height: 24,
    tintColor: '#FFD700',
    marginRight: 10,
  },
  backText: {
    fontSize: 16,
    color: '#6B4E31',
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
  },
  profileTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6B4E31',
    flex: 1,
    fontFamily: 'Roboto',
    textAlign: 'center',
  },
  dogImage: {
    width: 180,
    height: 180,
    borderRadius: 12,
    marginBottom: 15,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  dogDetails: {
    marginBottom: 15,
    flexDirection: 'column',
    width: '100%',
  },
  dogInfo: {
    fontSize: 16,
    color: '#6B4E31',
    marginBottom: 5,
    textAlign: 'left',
    fontFamily: 'Roboto',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    color: '#333',
    width: '100%',
    fontFamily: 'Roboto',
    shadowColor: '#ddd',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    textTransform: 'capitalize',
  },
  sizeInput: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    color: '#333',
    width: '100%',
    fontFamily: 'Roboto',
    shadowColor: '#ddd',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    textTransform: 'capitalize',
  },
  detailsInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  genderContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FFF',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  genderButtonSelected: {
    borderColor: '#FFD700',
    backgroundColor: '#FFF9F9',
  },
  genderIcon: {
    width: 20,
    height: 20,
    tintColor: '#6B4E31',
    marginRight: 8,
  },
  genderText: {
    fontSize: 16,
    color: '#6B4E31',
    fontFamily: 'Roboto',
  },
  genderTextSelected: {
    fontWeight: 'bold',
    color: '#6B4E31',
  },
  saveButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#6B4E31',
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
  editButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  editButtonText: {
    fontSize: 16,
    color: '#6B4E31',
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginTop: 10,
  },
  yesButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  noButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: '#6B4E31',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
  buttonTextYes: {
    color: '#6B4E31',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
  reportButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  reportButtonText: {
    fontSize: 16,
    color: '#6B4E31',
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
  placeholderText: {
    color: "#888", // Lighter color to show it's a placeholder
    fontStyle: "italic",
  }
});
export default LostDogFormConfirmation;