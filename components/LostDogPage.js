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
import axios from "axios";
import io from "socket.io-client";
import useChatCount from "./hooks/useChatCount";
import NotificationModal from "./NotificationModal";
import Footer from "./Footer";

const LostDogPage = ({
  onNavigateToHome,
  onNavigateToProfile,
  onLogout,
  onNavigateToMatchedPage,
  onNavigateToLostDogForm,
  onNavigateToFoundDogPage,
  onNavigateToChatForum,
  onNavigateToLostDogPageViewInfo,
  onNavigateToSuggestionsPage,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [lostDogs, setLostDogs] = useState([]);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const newChatsCount = useChatCount();

  // Define API URL constants
  const BASE_URL = "http://192.168.1.24:5000";
  const LOST_DOG_API_URL = `${BASE_URL}/api/lostdog`;
  const NEW_POSTS_API_URL = `${BASE_URL}/api/posts/new-posts-count`;
  const SOCKET_URL = BASE_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          console.error("No token found");
          return;
        }

        const lostDogsResponse = await axios.get(
          LOST_DOG_API_URL,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (lostDogsResponse.status === 200) {
          setLostDogs(
            lostDogsResponse.data.lostDogs.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            )
          );
        }

        const postsResponse = await axios.get(
          NEW_POSTS_API_URL
        );
        if (postsResponse.status === 200) {
          setNewPostsCount(postsResponse.data.newPostsCount);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();

    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socket.on("connect", () => console.log("Connected:", socket.id));
    socket.on("newLostDog", (newDog) =>
      setLostDogs((prev) => [newDog, ...prev])
    );
    socket.on("dogReunited", ({ petId }) =>
      setLostDogs((prev) =>
        prev.map((dog) =>
          dog.petId === petId ? { ...dog, reunited: true } : dog
        )
      )
    );
    socket.on("disconnect", () => console.log("Disconnected"));
    return () => socket.disconnect();
  }, []);

  const filteredDogs = lostDogs.filter((dog) => {
    const query = searchQuery.toLowerCase();
    const location = String(dog.location || "").toLowerCase();
    const breed = String(dog.breed || "").toLowerCase();
    const gender = String(dog.gender || "").toLowerCase();
    const name = String(dog.name || "").toLowerCase();
    return (
      location.includes(query) ||
      breed.includes(query) ||
      gender.includes(query) ||
      name.includes(query)
    );
  });

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
    if (tab === "HomePageFoundDog") onNavigateToFoundDogPage?.();
    else if (tab === "HomePageMatched") onNavigateToMatchedPage?.();
    else if (tab === "SuggestionsPage")
      onNavigateToSuggestionsPage?.();
  };

  const handleMessageClick = () => onNavigateToChatForum?.();
  const handleNotificationClick = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const handleMoreInfoClick = (dog) => onNavigateToLostDogPageViewInfo?.(dog);
  const handleAddClick = () => onNavigateToLostDogForm?.();

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
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMenuOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
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

      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => handleTabClick("HomePageLostDog")}
          >
            <Text style={styles.navTextActive}>Lost Dog</Text>
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Name, Location, Breed, or Gender"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#666"
        />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {filteredDogs.length > 0 ? (
          filteredDogs.map((dog, index) => (
            <View
              style={[
                styles.card,
                dog.category === "Found" && styles.foundCard,
                dog.reunited && styles.reunitedCard,
              ]}
              key={dog.petId || index}
            >
              <Image
                source={
                  dog.imagePath
                    ? { uri: `${BASE_URL}${dog.imagePath}` }
                    : require("../assets/images/dog-icon.png")
                }
                style={styles.cardImage}
                resizeMode="cover"
              />
              <View style={styles.cardContent}>
                <Text style={styles.petIdText}>Pet ID: {dog.petId}</Text>
                {dog.name && <Text style={styles.cardTitle}>{dog.name}</Text>}
                <Text style={styles.cardSubtitle}>
                  {dog.breed}, {dog.gender}
                </Text>
                <View style={styles.cardLocation}>
                  {/* <Image
                    source={require("../assets/images/location-icon.png")}
                    style={styles.locationIcon}
                  /> */}
                  <Text style={styles.cardLocationText}>
                    {dog.category === "Found" ? "Found at:" : "Last seen:"}{" "}
                    {dog.location}
                  </Text>
                </View>
                <Text style={styles.cardTimestamp}>
                  {dog.category === "Found" ? "Found on:" : "Lost on:"}{" "}
                  {new Date(dog.createdAt).toLocaleString()}
                </Text>
                <Text
                  style={[
                    styles.cardCategory,
                    dog.category === "Found" && styles.foundCategoryText,
                  ]}
                >
                  Category: {dog.category || "Lost"}
                </Text>
                {dog.reunited && (
                  <Text style={styles.reunitedText}>Status: Reunited</Text>
                )}
                <TouchableOpacity
                  style={styles.moreInfoButton}
                  onPress={() => handleMoreInfoClick(dog)}
                >
                  <Text style={styles.moreInfoText}>More Info</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>
            {searchQuery
              ? "No matching dogs found."
              : "No lost dogs reported yet."}
          </Text>
        )}
      </ScrollView>

      <Footer
        onNavigateToHome={handleHomeClick}
        onNavigateToChatForum={handleMessageClick}
        handleNotificationClick={handleNotificationClick}
        newChatsCount={newChatsCount}
        newPostsCount={newPostsCount}
      />


      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddClick}>
        <Image
          source={require("../assets/images/add-icon.png")}
          style={styles.addIcon}
        />
      </TouchableOpacity>

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
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFF',
  },
  searchInput: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    fontFamily: 'Roboto',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flexGrow: 1,
    padding: 15,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    marginBottom: 15,
    width: '100%',
    maxWidth: 400,
    flexDirection: 'column',
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  foundCard: {
    backgroundColor: '#e6ffe6',
  },
  reunitedCard: {
    backgroundColor: '#F0F0F0',
    opacity: 0.9,
  },
  cardImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  cardContent: {
    flex: 1,
  },
  petIdText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B4E31',
    //marginBottom: 5,
    backgroundColor: '#F9F9F9',
    padding: 5,
    borderRadius: 5,
    alignSelf: 'flex-start',
    fontFamily: 'Roboto',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6B4E31',
   // marginBottom: 5,
    textTransform: 'capitalize',
    fontFamily: 'Roboto',
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#6B4E31',
   // marginBottom: 5,
    textTransform: 'capitalize',
    fontFamily: 'Roboto',
  },
  cardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    //marginBottom: 5,
  },
  locationIcon: {
    width: 16,
    height: 16,
    marginRight: 5,
    tintColor: '#6B4E31',
  },
  cardLocationText: {
    fontSize: 14,
    color: '#6B4E31',
    flexShrink: 1,
    fontFamily: 'Roboto',
    textTransform: 'capitalize',
  },
  cardTimestamp: {
    fontSize: 12,
    color: '#6B4E31',
    //marginBottom: 5,
    fontFamily: 'woff',
  },
  cardCategory: {
    fontSize: 14,
    color: '#6B4E31',
    marginBottom: 10,
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  foundCategoryText: {
    color: '#006600',
  },
  reunitedText: {
    fontSize: 14,
    color: '#006600',
    fontWeight: 'bold',
    marginBottom: 10,
    // backgroundColor: '#FFD700',
    //padding: 5,
    borderRadius: 5,
    alignSelf: 'flex-start',
    fontFamily: 'Roboto',
  },
  moreInfoButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  moreInfoText: {
    color: '#6B4E31',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
  noDataText: {
    fontSize: 16,
    color: '#6B4E31',
    alignSelf: 'center',
    textAlign: 'center',
    fontFamily: 'Roboto',
    marginTop: 20,
  },

  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    backgroundColor: '#FFD700',
    borderRadius: 30,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  addIcon: {
    width: 24,
    height: 24,
    tintColor: '#6B4E31',
  },
});

export default LostDogPage;