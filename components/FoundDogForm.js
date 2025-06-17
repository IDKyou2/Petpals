import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import useChatCount from "./hooks/useChatCount";
import NotificationModal from "./NotificationModal";
import Footer from "./Footer";

const FoundDogForm = ({
  onNavigateToHome,
  onNavigateToProfile,
  onNavigateToFoundDogFormConfirmation,
  onLogout,
  onNavigateToChatForum,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dogBreed, setDogBreed] = useState("");
  const [dogSize, setDogSize] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState("");
  const [genderError, setGenderError] = useState("");
  const newChatsCount = useChatCount();
  const [breedError, setBreedError] = useState("");
  const [sizeError, setSizeError] = useState("");
  const [locationError, setLocationError] = useState("");

  const locationiqKey = "pk.0ee70983b8d94b132991d9b76b73102e";
  const debounceTimeout = useRef(null);

  const NEW_POSTS_API_URL = "http://192.168.1.24:5000/api/posts/new-posts-count";

  useEffect(() => {
    const fetchNewPostsCount = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const response = await axios.get(NEW_POSTS_API_URL, {
          headers: { Authorization: `Bearer ${token}` },
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

  const fetchSuggestions = async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(
        "https://api.locationiq.com/v1/autocomplete",
        {
          params: {
            key: locationiqKey,
            q: query,
            format: "json",
            limit: 5,
          },
        }
      );
      const formattedSuggestions = response.data.map((item) => ({
        value: item.display_name,
        data: item,
      }));
      setSuggestions(formattedSuggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    }
  };

  const debounceFetchSuggestions = (text) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 1000);
  };

  const handleLocationChange = (text) => {
    setLocation(text);
    debounceFetchSuggestions(text);
  };

  const handleSuggestionSelect = (suggestion) => {
    setLocation(suggestion.value);
    setSuggestions([]);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
  };
  

  const handleSubmit = () => {

    const capitalizeFirstLetter = (string) => {
      if (!string) return "";
      return string.charAt(0).toUpperCase() + string.slice(1);
    };

    setBreedError("");
    setSizeError("");
    setGenderError("");
    setLocationError("");
    setImageError("");

    if (!selectedImage || !dogBreed || !dogSize || !gender || !location) {
      if (!selectedImage) {
        setImageError("Please upload a picture of your dog.");
      }
      if (!dogBreed) {
        setBreedError("Please enter dog's breed.");
      }
      if (!dogSize) {
        setSizeError("Please enter dog's size.");
      }
      if (!gender) {
        setGenderError("Please select dog's gender.");
      }
      if (!location) {
        setLocationError("Please enter where the dog was last found.");
      }
      return;
    }

    const formData = {
      breed: capitalizeFirstLetter(dogBreed),
      size: capitalizeFirstLetter(dogSize),
      details: capitalizeFirstLetter(additionalDetails) || "No additional details provided.",
      gender: capitalizeFirstLetter(gender),
      location: capitalizeFirstLetter(location),
      image: selectedImage,
    };
    console.log("Form Data:", formData);

    if (onNavigateToFoundDogFormConfirmation) {
      onNavigateToFoundDogFormConfirmation(formData);
    }
  };

  const handleMessageClick = () => {
    if (onNavigateToChatForum) onNavigateToChatForum();
  };

  const handleNotificationClick = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      if (onLogout) onLogout();
    } catch (error) {
      console.error("Error during logout:", error);
    }
    setMenuOpen(false);
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const handleHomeClick = () => {
    if (onNavigateToHome) onNavigateToHome();
    setMenuOpen(false);
  };
  const handleProfileClick = () => {
    if (onNavigateToProfile) onNavigateToProfile();
    setMenuOpen(false);
  };
  const handleLogoutClick = () => logout();
  const handleTabClick = (tab) => console.log(`Tab clicked: ${tab}`);

  const handleImageUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Please allow access to your photos to upload a dog picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
      setImageError("");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTexts}>PETPALS</Text>
        <TouchableOpacity onPress={toggleMenu} style={styles.headerButton}>
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
        ></TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleTabClick("HomePageFoundDog")}
        ></TouchableOpacity>
      </View>

      <View style={styles.formWrapper}>
        <ScrollView contentContainerStyle={styles.formContainer}>
          <View style={styles.imageUploadContainer}>
            <TouchableOpacity onPress={handleImageUpload}>
              <View style={styles.uploadContent}>
                {selectedImage ? (
                  <Text style={styles.menuTexts}>Selected image:</Text>
                ) : (
                  <Text style={styles.menuTexts}>Upload image of your dog</Text>
                )}
                <Image
                  source={
                    selectedImage
                      ? { uri: selectedImage.uri }
                      : require("../assets/images/default-image-upload.png")
                  }
                  style={
                    selectedImage ? styles.selectedImageIcon : styles.imageUploadIcon
                  }
                  resizeMode="cover"
                />
              </View>
            </TouchableOpacity>
            {imageError ? (
              <Text style={styles.errorText}>{imageError}</Text>
            ) : null}
          </View>
          <Text style={styles.label}>Breed: <Text style={styles.textHints}>(Common breeds: Aspin, Shi Tzu, etc.)</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Enter dog's breed"
            value={dogBreed}
            onChangeText={(text) => {
              setDogBreed(text);
              setBreedError("");
            }}
          />
          {breedError ? (
            <Text style={styles.errorText}>{breedError}</Text>
          ) : null}
          <Text style={styles.label}>Size: <Text style={styles.textHints}>(Small, Medium, Huge)</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Enter dog's size"
            value={dogSize}
            onChangeText={(text) => {
              setDogSize(text);
              setSizeError("");
            }}
          />
          {sizeError ? <Text style={styles.errorText}>{sizeError}</Text> : null}
          <Text style={styles.label}>Additional details:</Text>
          <TextInput
            style={styles.inputDetails}
            placeholder="Enter addtional details (this is optional)."
            value={additionalDetails}
            onChangeText={setAdditionalDetails}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Gender:</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                gender === "Male" && styles.genderButtonSelected,
              ]}
              onPress={() => {
                setGender("Male");
                setGenderError("");
              }}
            >
              <Image
                source={require("../assets/images/male-icon.png")}
                style={styles.genderIcon}
              />
              <Text
                style={styles.genderText}
              >
                Male
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                gender === "Female" && styles.genderButtonSelected,
              ]}
              onPress={() => {
                setGender("Female");
                setGenderError("");
              }}
            >
              <Image
                source={require("../assets/images/female-icon.png")}
                style={styles.genderIcon}
              />
              <Text
                style={styles.genderText}
              >
                Female
              </Text>
            </TouchableOpacity>
          </View>
          {genderError ? (
            <Text style={styles.errorText}>{genderError}</Text>
          ) : null}
          <Text style={styles.label}>Location:</Text>
          <View style={styles.locationInputContainer}>
            <TextInput
              style={[styles.input, styles.locationInput]}
              placeholder="Enter dog's last found location"
              value={location}
              onChangeText={handleLocationChange}
            />
            {location.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => handleLocationChange('')}
              >
                <Text style={styles.clearButtonTextIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          {locationError ? (
            <Text style={styles.errorText}>{locationError}</Text>
          ) : null}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>SUBMIT</Text>
          </TouchableOpacity>
          <View style={{ marginTop: 5 }} />
        </ScrollView>
        {location.length > 0 && suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionTextTitle}>Choose location:</Text>
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.data.osm_id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionSelect(item)}
                >
                  <Text style={styles.suggestionText}>{item.value}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

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
  headerTexts: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    fontFamily: 'Roboto',
  },
  headerButton: {
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
  menuTexts: {
    fontSize: 16,
    color: '#6B4E31',
    fontWeight: '500',
    fontFamily: 'Roboto',
    marginBottom: 10,
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
  formWrapper: {
    flex: 1,
    position: 'relative',
  },
  formContainer: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#F5F5F5',
  },
  imageUploadContainer: {
    marginBottom: 20,
    alignItems: 'center',
    // backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 5,
  },
  uploadContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageUploadIcon: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 10,
  },
  selectedImageIcon: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B4E31',
    marginBottom: 8,
    fontFamily: 'Roboto',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    fontFamily: 'Roboto',
    textTransform: 'capitalize',
  },
  inputDetails: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    fontFamily: 'Roboto',
  },
  locationInput: {
    flex: 1,
    paddingRight: 40,
    textTransform: 'capitalize',
  },
  clearButton: {
    position: 'absolute',
    right: 10,
    top: 8,
    padding: 5,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonTextIcon: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  textHints: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Roboto',
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
    width: 24,
    height: 24,
    tintColor: '#6B4E31',
    marginRight: 5,
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
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flex: 1,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 360,
    left: 20,
    right: 20,
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    maxHeight: 180,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionTextTitle: {
    fontSize: 15,
    textAlign: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    color: '#6B4E31',
    fontFamily: 'Roboto',
    fontWeight: '600',
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  suggestionText: {
    fontSize: 14,
    color: '#6B4E31',
    fontFamily: 'Roboto',
  },
  submitButton: {
    backgroundColor: '#FFD700',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 18,
    color: '#6B4E31',
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
  errorText: {
    color: '#FF4D4D',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
});

export default FoundDogForm;