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

const FoundDogFormConfirmation = ({
  onNavigateToHome,
  onNavigateToProfile,
  onNavigateToFoundDogForm,
  formData,
  onLogout,
  onNavigateToFoundDogPage,
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

  const [editBreed, setEditBreed] = useState(formData?.breed || "Unknown");
  const [editSize, setEditSize] = useState(formData?.size || "Medium");
  const [editDetails, setEditDetails] = useState(
    formData?.details || "No additional details provided."
  );
  const [editGender, setEditGender] = useState(formData?.gender || "Unknown");
  const [editLocation, setEditLocation] = useState(
    formData?.location || "Unknown"
  );
  const [image, setImage] = useState(formData?.image || null);
  const newChatsCount = useChatCount();

  const NEW_POSTS_API_URL = "http://192.168.1.24:5000/api/posts/new-posts-count";
  const FOUND_DOG_API_URL = "http://192.168.1.24:5000/api/founddog";

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
    setIsEditing(false);

    const capitalizeFirstLetter = (string) => {
      if (!string) return "";
      return string.charAt(0).toUpperCase() + string.slice(1);
    };

    console.log("Updated data:", {
      breed: capitalizeFirstLetter(editBreed),
      size: capitalizeFirstLetter(editSize),
      details: capitalizeFirstLetter(editDetails),
      gender: capitalizeFirstLetter(editGender),
      location: capitalizeFirstLetter(editLocation),
    });
  };

  const handleReportAsFoundClick = () => {
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
        throw new Error("No token found. Please log in.");
      }

      const updatedFormData = {
        breed: editBreed,
        size: editSize,
        details: editDetails || "",
        gender: editGender,
        location: editLocation,
        image,
      };

      const formDataToSend = new FormData();
      Object.entries(updatedFormData).forEach(([key, value]) => {
        if (value) {
          if (key === "image" && value?.uri) {
            let fileExtension = "jpg";
            let mimeType = value.mimeType || "image/jpeg";
            if (mimeType === "image/png") {
              fileExtension = "png";
            } else if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
              fileExtension = "jpg";
            }
            formDataToSend.append("dogImage", {
              uri: value.uri,
              type: mimeType,
              name: `dogImage-${Date.now()}.${fileExtension}`,
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

      const response = await axios.post(FOUND_DOG_API_URL, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 15000,
      });

      console.log("Server Response:", response.data);

      if (response.status === 201) {
        if (onNavigateToFoundDogPage && onNavigateToMatchedPage) {
          onNavigateToFoundDogPage();
          onNavigateToMatchedPage();
        } else {
          console.error("Navigation functions are not defined!");
        }
        Alert.alert("Success", "Found dog reported successfully! Thank you for helping and giving them a chance to reunite with their owners.");
        console.log("Success", "Found dog reported successfully.");
      }
    } catch (error) {
      console.error("Detailed error reporting found dog:", {
        message: error.message,
        code: error.code,
        config: error.config,
        response: error.response?.data,
      });

      let errorMessage = "Failed to report found dog.";
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
          onPress={() => onNavigateToFoundDogForm?.()}
        >
          <Image
            source={require("../assets/images/back-arrow.png")}
            style={styles.backArrow}
          />
          <Text style={styles.backText}>Back to Form</Text>
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
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    editGender === "Male" && styles.genderButtonSelected,
                  ]}
                  onPress={() => setEditGender("Male")}
                >
                  <Image
                    source={require("../assets/images/male-icon.png")}
                    style={styles.genderIcon}
                  />
                  <Text
                    style={[
                      styles.genderText,
                      editGender === "Male" && styles.genderTextSelected,
                    ]}
                  >
                    Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    editGender === "Female" && styles.genderButtonSelected,
                  ]}
                  onPress={() => setEditGender("Female")}
                >
                  <Image
                    source={require("../assets/images/female-icon.png")}
                    style={styles.genderIcon}
                  />
                  <Text
                    style={[
                      styles.genderText,
                      editGender === "Female" && styles.genderTextSelected,
                    ]}
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
                placeholder="Breed"
                placeholderTextColor="#999"
              />
            ) : (
              <Text style={styles.dogInfo}>Breed: {editBreed}</Text>
            )}
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editSize}
                onChangeText={setEditSize}
                placeholder="Size"
                placeholderTextColor="#999"
              />
            ) : (
              <Text style={styles.dogInfo}>Size: {editSize}</Text>
            )}
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editLocation}
                onChangeText={setEditLocation}
                placeholder="Location"
                placeholderTextColor="#999"
              />
            ) : (
              <View style={styles.locationContainer}>
                <Text style={styles.dogInfo}>Location: {editLocation}</Text>
              </View>
            )}
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.detailsInput]}
                value={editDetails}
                onChangeText={setEditDetails}
                placeholder="Additional details"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            ) : (
              <Text style={styles.dogDescription}>
                {editDetails || "No additional details provided."}
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
              onPress={handleReportAsFoundClick}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.reportButtonText}>REPORT AS FOUND</Text>
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
            <Text style={styles.modalText}>Do you want to report this as found?</Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.yesButton,
                  isSubmitting && styles.disabledButton,
                ]}
                onPress={handleConfirmReport}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
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
    // borderBottomLeftRadius: 10,
    // borderBottomRightRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
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
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
    backgroundColor: '#cccccc',
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
    paddingHorizontal: 5,
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
    fontWeight: 'bold',
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
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B4E31',
    fontFamily: 'Roboto',
    flex: 1,
    textAlign: 'center',
  },
  dogImage: {
    width: 200,
    height: 200,
    borderRadius: 15,
    marginBottom: 15,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  dogDetails: {
    marginBottom: 20,
  },
  dogInfo: {
    fontSize: 16,
    color: '#6B4E31',
    marginBottom: 8,
    textAlign: 'left',
    fontFamily: 'Roboto',
  },
  dogDescription: {
    fontSize: 16,
    color: '#6B4E31',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Roboto',
  },

  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Roboto',
  },
  detailsInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  genderContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: '#F9F9F9',
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
    backgroundColor: '#FFF',
  },
  genderIcon: {
    width: 20,
    height: 24,
    tintColor: '#6B4E31',
    marginRight: 6,
  },
  genderText: {
    fontSize: 16,
    color: '#6B4E31',
    fontFamily: 'Roboto',
  },
  genderTextSelected: {
    color: '#6B4E31',
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  editButtonText: {
    fontSize: 16,
    color: '#6B4E31',
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
  saveButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#6B4E31',
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
  reportButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  reportButtonText: {
    fontSize: 16,
    color: '#6B4E31',
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  yesButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  noButton: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginLeft: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
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
});

export default FoundDogFormConfirmation;