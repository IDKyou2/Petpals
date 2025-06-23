import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
  TextInput,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import io from "socket.io-client";
import useChatCount from "./hooks/useChatCount";
import NotificationModal from "./NotificationModal";
import Footer from "./Footer";


// Define API URL constants
const BASE_URL = "http://192.168.1.6:5000";
const LOST_DOG_API_URL = `${BASE_URL}/api/lostdog`;
const FOUND_DOG_API_URL = `${BASE_URL}/api/founddog`;
const NEW_POSTS_API_URL = `${BASE_URL}/api/posts/new-posts-count`;
const LOST_FOUND_API_URL = `${BASE_URL}/api/lostfound`;
const MATCH_DOGS_API_URL = `${LOST_FOUND_API_URL}/match-dogs`;
const BASE_API_URL = BASE_URL;
const SOCKET_URL = BASE_URL;

const decodeJWT = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
};

const MatchPage = ({
  onNavigateToHome,
  onNavigateToProfile,
  onLogout,
  onNavigateToLostDogPage,
  onNavigateToFoundDogPage,
  onNavigateToChatForum,
  onNavigateToMatchPageMoreInfoLost,
  onNavigateToMatchPageMoreInfoFound,
  onNavigateToSuggestionsForm,
  onNavigateToSuggestionsPage,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dogs, setDogs] = useState([]);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [matches, setMatches] = useState([]);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [selectedMatches, setSelectedMatches] = useState([]);
  const [isNewMatchModalOpen, setIsNewMatchModalOpen] = useState(false);
  const [selectedNewMatch, setSelectedNewMatch] = useState(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const newChatsCount = useChatCount();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showFullName1, setShowFullName1] = useState(false);
  const [showFullName2, setShowFullName2] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const fetchCurrentUserId = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          const decoded = decodeJWT(token);
          if (decoded && decoded.userId) {
            setCurrentUserId(decoded.userId);
            console.log("Current User ID set:", decoded.userId);
          } else {
            console.log("No userId in decoded token:", decoded);
          }
        } else {
          console.log("No token found in AsyncStorage");
        }
      } catch (error) {
        console.error("Error fetching current user ID:", error);
      }
    };
    fetchCurrentUserId();
  }, []);

  const getFirstName = (fullName) => {
    if (!fullName) return "Unknown";
    return fullName.split(" ")[0];
  };

  const fetchDataAndMatches = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.log("No token found, aborting fetch");
        return;
      }

      const [lostResponse, foundResponse, postsResponse, matchesResponse] =
        await Promise.all([
          axios.get(LOST_DOG_API_URL, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(FOUND_DOG_API_URL, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(NEW_POSTS_API_URL),
          axios.get(MATCH_DOGS_API_URL, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      const allDogs = [
        ...(lostResponse.status === 200 ? lostResponse.data.lostDogs : []),
        ...(foundResponse.status === 200 ? foundResponse.data.foundDogs : []),
      ]
        .filter((dog) => !dog.reunited)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      console.log(
        "All dogs fetched:",
        allDogs.map((dog) => ({
          petId: dog.petId,
          imagePath: dog.imagePath,
          userId: dog.userId?._id,
          category: dog.category,
        }))
      );

      setDogs(allDogs);
      if (postsResponse.status === 200) {
        setNewPostsCount(postsResponse.data.newPostsCount);
      }
      if (matchesResponse.status === 200) {
        setMatches(matchesResponse.data.matches);
        console.log("Matches fetched from server:", matchesResponse.data.matches);
      }
    } catch (error) {
      console.error("Error fetching data or matches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDataAndMatches();

    const socket = io(SOCKET_URL, { transports: ["websocket"] });

    socket.on("connect", () =>
      console.log("Connected to Socket.IO server:", socket.id)
    );

    socket.on("newLostDog", (newDog) => {
      if (!newDog.reunited) {
        setDogs((prevDogs) => {
          const updatedDogs = [newDog, ...prevDogs].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          return updatedDogs;
        });
        fetchDataAndMatches();
      }
    });

    socket.on("newFoundDog", (newDog) => {
      if (!newDog.reunited) {
        setDogs((prevDogs) => {
          const updatedDogs = [newDog, ...prevDogs].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          return updatedDogs;
        });
        fetchDataAndMatches();
      }
    });

    socket.on("dogReunited", ({ petId }) => {
      setDogs((prevDogs) => {
        const updatedDogs = prevDogs.filter((dog) => dog.petId !== petId);
        return updatedDogs;
      });
      setMatches((prevMatches) =>
        prevMatches.filter(
          (match) => match.petId1 !== petId && match.petId2 !== petId
        )
      );
    });

    socket.on("updatedLostDog", (updatedDog) => {
      setDogs((prevDogs) => {
        const updatedDogs = prevDogs.map((dog) =>
          dog.petId === updatedDog.petId ? updatedDog : dog
        );
        fetchDataAndMatches();
        return updatedDogs;
      });
    });

    socket.on("updatedFoundDog", (updatedDog) => {
      setDogs((prevDogs) => {
        const updatedDogs = prevDogs.map((dog) =>
          dog.petId === updatedDog.petId ? updatedDog : dog
        );
        fetchDataAndMatches();
        return updatedDogs;
      });
    });

    socket.on("disconnect", () =>
      console.log("Disconnected from Socket.IO server")
    );

    return () => socket.disconnect();
  }, []);

  const filteredDogs = dogs.filter((dog) => {
    const query = searchQuery.toLowerCase();
    const location = dog.location ? String(dog.location).toLowerCase() : "";
    const breed = dog.breed ? String(dog.breed).toLowerCase() : "";
    const gender = dog.gender ? String(dog.gender).toLowerCase() : "";
    const name = dog.name ? String(dog.name).toLowerCase() : "";

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
    if (tab === "HomePageLostDog") onNavigateToLostDogPage?.();
    else if (tab === "HomePageFoundDog") onNavigateToFoundDogPage?.();
    else if (tab === "HomePageSuggestions") onNavigateToSuggestionsForm?.();
    else if (tab === "SuggestionsPage") onNavigateToSuggestionsPage?.();
  };

  const handleMessageClick = () => onNavigateToChatForum?.();

  const handleNotificationClick = () => setIsModalOpen(true);

  const closeModal = () => setIsModalOpen(false);

  const handleMoreInfoClick = (dog) => {
    if (dog.category === "Found") {
      onNavigateToMatchPageMoreInfoFound?.(dog);
    }
    if (dog.category === "Lost") {
      onNavigateToMatchPageMoreInfoLost?.(dog);
    }
  };

  const getMatchMessage = (dog) => {
    console.log(
      `Checking matches for dog ${dog.petId}, currentUserId: ${currentUserId}`
    );
    if (dog.userId?._id !== currentUserId) return null;

    const dogMatches = matches.filter(
      (match) => match.petId1 === dog.petId || match.petId2 === dog.petId
    );
    console.log(`Dog ${dog.petId} matches:`, dogMatches);
    if (dogMatches.length === 0) return null;

    const matchedPetIds = dogMatches.map((match) =>
      match.petId1 === dog.petId ? match.petId2 : match.petId1
    );

    if (matchedPetIds.length <= 2) {
      return `Pet ID #${dog.petId} is matched with Pet ID #${matchedPetIds.join(
        " and #"
      )}`;
    } else {
      const shortList = matchedPetIds.slice(0, 2);
      return {
        shortMessage: `Pet ID #${dog.petId} is matched with Pet ID #${shortList.join(
          " and #"
        )} and more...`,
        fullList: matchedPetIds,
      };
    }
  };

  const openMatchModal = (matchIds) => {
    const matchedDogs = matchIds
      .map((id) => dogs.find((dog) => dog.petId === id))
      .filter(Boolean);
    setSelectedMatches(matchedDogs);
    setIsMatchModalOpen(true);
  };

  const closeMatchModal = () => {
    setIsMatchModalOpen(false);
    setSelectedMatches([]);
  };

  const openNewMatchModal = (match) => {
    const dog1 = dogs.find((d) => d.petId === match.petId1);
    const dog2 = dogs.find((d) => d.petId === match.petId2);

    const isDog1CurrentUser = dog1?.userId?._id === currentUserId;
    const isDog2CurrentUser = dog2?.userId?._id === currentUserId;
    const isDog1Lost = dog1?.category === "Lost";
    const isDog2Lost = dog2?.category === "Lost";
    const isExactMatch = match.similarityPercentage === 100;
    const isHighSimilarity = match.similarityPercentage >= 80;

    console.log("Attempting to open modal for match:", {
      match,
      currentUserId,
      dog1: {
        petId: dog1?.petId,
        userId: dog1?.userId?._id,
        category: dog1?.category,
      },
      dog2: {
        petId: dog2?.petId,
        userId: dog2?.userId?._id,
        category: dog2?.category,
      },
      isExactMatch,
      isHighSimilarity,
    });

    if (
      isHighSimilarity &&
      ((isDog1CurrentUser &&
        isDog1Lost &&
        dog2?.userId?._id !== currentUserId) ||
        (isDog2CurrentUser &&
          isDog2Lost &&
          dog1?.userId?._id !== currentUserId))
    ) {
      setSelectedNewMatch({ ...match, dog1, dog2 });
      setIsNewMatchModalOpen(true);
      console.log("Opening modal for match:", { ...match, dog1, dog2 });
    } else {
      console.log("Modal not opened: Conditions not met", {
        currentUserId,
        dog1UserId: dog1?.userId?._id,
        dog1Category: dog1?.category,
        dog2UserId: dog2?.userId?._id,
        dog2Category: dog2?.category,
        isExactMatch,
        isHighSimilarity,
      });
    }
  };

  const closeNewMatchModal = () => {
    setIsNewMatchModalOpen(false);
    setSelectedNewMatch(null);
    if (selectedNewMatch) {
      setTimeout(() => {
        setSelectedNewMatch(selectedNewMatch);
        setIsNewMatchModalOpen(true);
      }, 4000);                     // -------------------------------------------------- Modal popup timer -------------------------------------------------
    }
  };

  const handleReunite = () => {
    setIsConfirmationModalOpen(true);
  };

  const confirmReunion = async (confirmed) => {
    setIsConfirmationModalOpen(false);

    if (confirmed) {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token || !selectedNewMatch) return;

        const [response1, response2] = await Promise.all([
          axios.put(
            `${LOST_FOUND_API_URL}/mark-reunited/${selectedNewMatch.petId1}`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          axios.put(
            `${LOST_FOUND_API_URL}/mark-reunited/${selectedNewMatch.petId2}`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          ),
        ]);

        if (response1.status === 200 && response2.status === 200) {
          setDogs((prevDogs) => {
            const updatedDogs = prevDogs.filter(
              (dog) =>
                dog.petId !== selectedNewMatch.petId1 &&
                dog.petId !== selectedNewMatch.petId2
            );
            return updatedDogs;
          });
          setMatches((prevMatches) =>
            prevMatches.filter(
              (match) =>
                match.petId1 !== selectedNewMatch.petId1 &&
                match.petId2 !== selectedNewMatch.petId2
            )
          );
          setTimeout(() => closeNewMatchModal(), 3000);
          setSuccessMessage("Dog reunited successfully! Kindly wait for the page to reload.");
          setTimeout(() => {
            setSuccessMessage(null);
            onNavigateToSuggestionsForm?.();
          }, 8000);
        }
      } catch (error) {
        console.error("Error marking as reunited:", error);
        alert("Failed to reunite dogs.");
      }
    } else {
      setIsNewMatchModalOpen(true);
    }
  };

  useEffect(() => {
    console.log("Matches updated:", matches, "Current User ID:", currentUserId);
    if (matches.length > 0 && currentUserId) {
      const userMatches = matches.filter((match) => {
        const dog1 = dogs.find((d) => d.petId === match.petId1);
        const dog2 = dogs.find((d) => d.petId === match.petId2);
        const isUserMatch =
          dog1?.userId?._id === currentUserId ||
          dog2?.userId?._id === currentUserId;
        console.log(`Filtering match ${match.petId1} vs ${match.petId2}:`, {
          isUserMatch,
          dog1: { userId: dog1?.userId?._id, category: dog1?.category },
          dog2: { userId: dog2?.userId?._id, category: dog2?.category },
        });
        return isUserMatch;
      });

      console.log("User matches found:", userMatches);

      if (userMatches.length > 0 && !isNewMatchModalOpen) {
        const latestMatch = userMatches[0];
        openNewMatchModal(latestMatch);
      } else {
        console.log("No user matches or modal already open");
      }
    }
  }, [matches, currentUserId]);

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      )}
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
            <Text style={styles.navTextActive}>Match</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => handleTabClick("SuggestionsPage")}
          >
            <Text style={styles.navText}>View Suggestions</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Name, Location, Breed, or Gender"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#666"
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filteredDogs.length > 0 ? (
          filteredDogs.map((dog, index) => {
            const matchMessage = getMatchMessage(dog);
            return (
              <View
                style={styles.card}
                key={`${dog.category}-${dog.petId || index}`}
              >
                <Image
                  source={
                    dog.imagePath
                      ? { uri: `${BASE_API_URL}${dog.imagePath}` }
                      : require("../assets/images/dog-icon.png")
                  }
                  style={styles.cardImage}
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
                  <Text style={styles.cardCategory}>
                    Category: {dog.category || "Lost"}
                  </Text>
                  {matchMessage && (
                    <View style={styles.matchMessageContainer}>
                      {typeof matchMessage === "string" ? (
                        <Text style={styles.matchMessage}>{matchMessage}</Text>
                      ) : (
                        <Text style={styles.matchMessage}>
                          {matchMessage.shortMessage.replace("and more...", "")}
                          <TouchableOpacity
                            onPress={() => openMatchModal(matchMessage.fullList)}
                          >
                            <Text style={styles.moreLink}>and more...</Text>
                          </TouchableOpacity>
                        </Text>
                      )}
                    </View>
                  )}
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={styles.moreInfoButton}
                      onPress={() => handleMoreInfoClick(dog)}
                    >
                      <Text style={styles.moreInfoText}>More Info</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.noDataText}>
            {searchQuery
              ? "No matching dogs found."
              : "No matched dogs reported yet."}
          </Text>
        )}
      </ScrollView>

      <Modal
        visible={isMatchModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeMatchModal}
      >
        <View style={styles.matchModalOverlay}>
          <View style={styles.matchModalContent}>
            <Text style={styles.matchModalTitle}>Matched Pet IDs</Text>
            <ScrollView style={styles.matchModalList}>
              {selectedMatches.map((match, index) => (
                <View key={index} style={styles.matchModalItemContainer}>
                  <Text style={styles.matchModalItem}>
                    Pet ID #{match.petId}
                  </Text>
                  <Image
                    source={
                      match.imagePath
                        ? { uri: `${BASE_API_URL}${match.imagePath}` }
                        : require("../assets/images/dog-icon.png")
                    }
                    style={styles.matchModalImage}
                  />
                  <Text style={styles.matchModalDate}>
                    Posted on: {new Date(match.createdAt).toLocaleString()}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.matchModalCloseButton}
              onPress={closeMatchModal}
            >
              <Text style={styles.matchModalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isNewMatchModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeNewMatchModal}
      >
        <View style={styles.newMatchModalOverlay}>
          <View style={styles.newMatchModalContent}>
            <Text style={styles.newMatchModalTitle}>Match Found!</Text>
            {selectedNewMatch && (
              <ScrollView style={styles.newMatchModalDetails}>
                <Text style={styles.newMatchModalText}>
                  Match Pet ID #{selectedNewMatch.petId1} with #
                  {selectedNewMatch.petId2}
                </Text>
                <Text style={styles.newMatchModalText}>
                  Similarity: {selectedNewMatch.similarityPercentage}%
                </Text>
                <Text style={styles.newMatchModalText}>
                  Color Match: {selectedNewMatch.colorSimilarity}%
                </Text>
                {/* ---------------------------------------------------------------------- IMAGE -----------------------------------------------------*/}
                <View style={styles.newMatchModalImages}>
                  <View style={styles.newMatchModalImageContainer}>
                    <Text style={styles.newMatchModalItem}>
                      Pet ID #{selectedNewMatch.petId1}
                    </Text>
                    <Image
                      source={
                        selectedNewMatch.dog1?.imagePath
                          ? {
                            uri: `${BASE_API_URL}${selectedNewMatch.dog1.imagePath}`,
                          }
                          : require("../assets/images/dog-icon.png")
                      }
                      style={styles.newMatchModalImage}
                    />
                    <Text style={styles.newMatchModalText}>Posted by:</Text>
                    <View style={styles.nameContainer}>
                      <Text style={styles.newMatchModalTexts}>
                        {showFullName1
                          ? selectedNewMatch.dog1?.userId?.fullName || "Unknown"
                          : getFirstName(selectedNewMatch.dog1?.userId?.fullName)}
                      </Text>
                      {!showFullName1 && (
                        <TouchableOpacity onPress={() => setShowFullName1(true)}>
                          <Text style={styles.moreLink}>more</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.newMatchModalText}>
                      Category: {selectedNewMatch.dog1?.category || "Unknown"}
                    </Text>
                  </View>
                  <View style={styles.space} />
                  {/* ---------------------------------------------------------------------- SECOND IMAGE -----------------------------------------------------*/}
                  <View style={styles.newMatchModalImageContainer}>
                    <Text style={styles.newMatchModalItem}>
                      Pet ID #{selectedNewMatch.petId2}
                    </Text>
                    <Image
                      source={
                        selectedNewMatch.dog2?.imagePath
                          ? {
                            uri: `${BASE_API_URL}${selectedNewMatch.dog2.imagePath}`,
                          }
                          : require("../assets/images/dog-icon.png")
                      }
                      style={styles.newMatchModalImage}
                    />
                    <Text style={styles.newMatchModalText}>Posted by:</Text>
                    <View style={styles.nameContainer}>
                      <Text style={styles.newMatchModalTexts}>
                        {showFullName2
                          ? selectedNewMatch.dog2?.userId?.fullName || "Unknown"
                          : getFirstName(selectedNewMatch.dog2?.userId?.fullName)}
                      </Text>
                      {!showFullName2 && (
                        <TouchableOpacity onPress={() => setShowFullName2(true)}>
                          <Text style={styles.moreLink}>more</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.newMatchModalText}>
                      Category: {selectedNewMatch.dog2?.category || "Unknown"}
                    </Text>
                    {selectedNewMatch.dog2?.category === "Found" && (
                      <Text style={styles.newMatchModalText}>
                        Contact:{" "}
                        {selectedNewMatch.dog2?.userId?.contact || "Not available"}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={styles.isThisYourDogText}>Do you recognize this dog?</Text>
                <View style={styles.newMatchModalButtons}>
                  <TouchableOpacity
                    style={styles.newMatchModalButton}
                    onPress={handleReunite}
                  >
                    <Text style={styles.newMatchModalButtonText}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.newMatchModalButtonClose}
                    onPress={closeNewMatchModal}
                  >
                    <Text style={styles.newMatchModalButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={isConfirmationModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsConfirmationModalOpen(false)}
      >
        <View style={styles.confirmationModalOverlay}>
          <View style={styles.confirmationModalContent}>
            <Text style={styles.confirmationModalTitle}>
              Have you already reunited with your dog?
            </Text>
            <View style={styles.confirmationModalButtons}>
              <TouchableOpacity
                style={styles.confirmationModalButton}
                onPress={() => confirmReunion(true)}
              >
                <Text style={styles.confirmationModalButtonText}>Yes, we did</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmationModalButtonClose}
                onPress={() => confirmReunion(false)}
              >
                <Text style={styles.confirmationModalButtonText}>No, not yet</Text>
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

      {successMessage && (
        <View style={styles.successMessageContainer}>
          <Text style={styles.successMessageText}>{successMessage}</Text>
        </View>
      )}
      <NotificationModal isModalOpen={isModalOpen} closeModal={closeModal} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#6B4E31",
    paddingVertical: 20,
    paddingHorizontal: 20,
    // borderBottomLeftRadius: 20,
    // borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  headerText: {
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
  navBar: {
    backgroundColor: "#FFF",
    paddingVertical: 10,
    shadowColor: "#000",
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
    color: "#6B4E31",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Roboto",
  },
  navTextActive: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Roboto",
    textDecorationLine: "underline",
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#FFF",
  },
  searchInput: {
    backgroundColor: "#F9F9F9",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    fontFamily: "Roboto",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flexGrow: 1,
    padding: 15,
    alignItems: "center",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    marginBottom: 15,
    width: "100%",
    maxWidth: 400,
    flexDirection: "column",
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardImage: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  cardContent: {
    flex: 1,
  },
  petIdText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6B4E31",
    //marginBottom: 5,
    backgroundColor: "#F9F9F9",
    padding: 5,
    borderRadius: 5,
    alignSelf: "flex-start",
    fontFamily: "Roboto",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6B4E31",
    marginBottom: 5,
    textTransform: "capitalize",
    fontFamily: "Roboto",
  },
  cardSubtitle: {
    fontSize: 16,
    color: "#6B4E31",
    //marginBottom: 5,
    textTransform: "capitalize",
    fontFamily: "Roboto",
  },
  cardLocation: {
    flexDirection: "row",
    alignItems: "center",
    //marginBottom: 5,
  },
  locationIcon: {
    width: 16,
    height: 16,
    marginRight: 5,
    tintColor: "#6B4E31",
  },
  cardLocationText: {
    fontSize: 14,
    color: "#6B4E31",
    flexShrink: 1,
    fontFamily: "Roboto",
    //textTransform: "capitalize",
  },
  cardTimestamp: {
    fontSize: 12,
    color: "#6B4E31",
    //marginBottom: 5,
    fontFamily: "Roboto",
  },
  cardCategory: {
    fontSize: 14,
    color: "#6B4E31",
    //marginBottom: 10,
    //fontWeight: "600",
    fontFamily: "Roboto",
  },
  matchMessageContainer: {
    marginBottom: 10,
  },
  matchMessage: {
    fontSize: 14,
    color: "#006600",
    fontWeight: "bold",
    fontFamily: "Roboto",
  },
  moreLink: {
    fontSize: 14,
    color: "#0066cc",
    textDecorationLine: "underline",
    fontFamily: "Roboto",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 10,
    width: "100%",
  },
  moreInfoButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  moreInfoText: {
    color: "#6B4E31",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Roboto",
  },
  noDataText: {
    fontSize: 16,
    color: "#6B4E31",
    alignSelf: "center",
    textAlign: "center",
    fontFamily: "Roboto",
    marginTop: 20,
  },
  matchModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  matchModalContent: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 20,
    width: "90%",
    maxHeight: "70%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  matchModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6B4E31",
    marginBottom: 15,
    fontFamily: "Roboto",
  },
  matchModalList: {
    width: "100%",
    maxHeight: 250,
  },
  matchModalItemContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
    alignItems: "center",
  },
  matchModalItem: {
    fontSize: 16,
    color: "#6B4E31",
    fontWeight: "bold",
    marginBottom: 5,
    fontFamily: "Roboto",
  },
  matchModalImage: {
    width: 120,
    height: 120,
    borderRadius: 5,
    marginVertical: 5,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  matchModalDate: {
    fontSize: 12,
    color: "#6B4E31",
    fontFamily: "Roboto",
  },
  matchModalCloseButton: {
    marginTop: 15,
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
  matchModalCloseText: {
    color: "#6B4E31",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Roboto",
  },
  newMatchModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  newMatchModalContent: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  newMatchModalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#006600",
    marginBottom: 15,
    textAlign: "center",
    fontFamily: "Roboto",
  },
  newMatchModalDetails: {
    width: "100%",
  },
  newMatchModalText: {
    fontSize: 14,
    color: "#6B4E31",
    //marginBottom: 10,
    fontWeight: "700",
    fontFamily: "Roboto",
  },
  newMatchModalTexts: {
    fontSize: 14,
    color: "#6B4E31",
    fontWeight: "500",
    textTransform: "capitalize",
    fontFamily: "Roboto",
  },
  newMatchModalImages: {
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    marginBottom: 15,
    marginTop: 10,
  },
  newMatchModalImageContainer: {
    alignItems: "center",
    //marginVertical: 10,
  },
  newMatchModalItem: {
    fontSize: 16,
    color: "#6B4E31",
    fontWeight: "bold",
    marginBottom: 5,
    fontFamily: "Roboto",
  },
  newMatchModalImage: {
    width: 140,
    height: 140,
    borderRadius: 5,
    marginVertical: 5,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  moreLink: {
    fontSize: 14,
    color: "#0066cc",
    marginLeft: 5,
    textDecorationLine: "underline",
    fontFamily: "Roboto",
  },
  newMatchModalButtons: {
    flexDirection: "row",
    //justifyContent: "space-around",
    justifyContent: "center",
    width: "100%",
    marginTop: 10,
  },
  newMatchModalButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    margin: 5,
  },
  newMatchModalButtonClose: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FFD700",
    margin: 5,
  },
  confirmationModalButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    margin: 5,
  },
  confirmationModalButtonClose: {
    //backgroundColor: "#FFD700",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    //shadowColor: "#000",
    //shadowOffset: { width: 0, height: 2 },
    //shadowOpacity: 0.2,
    //shadowRadius: 3,
    //elevation: 3,
    margin: 5,
    borderColor: "#FFD700",
    borderWidth: 2,
  },
  confirmationModalButtonText: {
    color: "#6B4E31",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Roboto",
  },

  newMatchModalButtonText: {
    color: "#6B4E31",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Roboto",
  },

  isThisYourDogText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6B4E31",
    //marginVertical: 15,
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
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  confirmationModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6B4E31",
    marginBottom: 15,
    textAlign: "center",
    fontFamily: "Roboto",
  },
  confirmationModalButtons: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
  },

  successMessageContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -150 }, { translateY: -20 }],
    backgroundColor: "rgba(0, 128, 0, 0.9)",
    padding: 15,
    borderRadius: 10,
    width: 300,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  successMessageText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "Roboto",
  },
  space: {
    margin: 10,
  }
});

export default MatchPage;