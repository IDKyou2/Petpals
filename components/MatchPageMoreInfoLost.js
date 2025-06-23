import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Modal,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define API URL constant
const BASE_URL = "http://192.168.1.6:5000";

const MatchPageMoreInfoLost = ({
  dog,
  onNavigateToHome,
  onNavigateToProfile,
  onNavigateToMatchPage,
  onLogout,
  onNavigateToChatForum,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          console.error("No token found in AsyncStorage");
          return;
        }

        const userId =
          dog.userId && dog.userId._id ? dog.userId._id : dog.userId;
        if (!userId) {
          console.error("Invalid userId:", dog.userId);
          return;
        }

        const response = await axios.get(
          `${BASE_URL}/api/auth/user/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data) {
          setUserData(response.data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [dog.userId]);

  const toggleMenu = () => {
    setMenuOpen((prevState) => !prevState);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    onLogout?.();
  };

  const handleTabClick = (tab) => {
    if (tab === "LostDogPage" && onNavigateToLostDogPage) {
      onNavigateToLostDogPage();
    }
  };

  return (
    <SafeAreaView style={styles.mainWrapper}>
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
              onPress={() => {
                onNavigateToHome?.();
                setMenuOpen(false);
              }}
            >
              <Text style={styles.menuText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onNavigateToProfile?.();
                setMenuOpen(false);
              }}
            >
              <Text style={styles.menuText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={logout}>
              <Text style={styles.menuText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView contentContainerStyle={styles.mainContent}>
        <TouchableOpacity
          style={styles.arrowBtn}
          onPress={() => onNavigateToMatchPage?.()}
        >
          <Image
            source={require("../assets/images/back-arrow.png")}
            style={styles.arrowIcon}
          />
          <Text style={styles.mainTitle}>View Info</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Image
            source={{ uri: `${BASE_URL}${dog.imagePath}` }}
            style={styles.missingDogImage}
            resizeMode="cover"
          />
          <View style={styles.info}>
            <View style={styles.containerRow}>
              <Text style={styles.petId}>Pet ID #: {dog.petId}</Text>
            </View>
            <View style={styles.containerRow}>
              <Image
                source={require("../assets/images/size.png")}
                style={styles.bullet}
              />
              <Text style={styles.label}>Name: {dog.name}</Text>
            </View>
            <View style={styles.containerRow}>
              <Image
                source={require("../assets/images/size.png")}
                style={styles.bullet}
              />
              <Text style={styles.label}>Category: {dog.category}</Text>
            </View>
            <View style={styles.containerRow}>
              <Image
                source={require("../assets/images/size.png")}
                style={styles.bullet}
              />
              <Text>
                <Text style={styles.label}>Breed: {dog.breed}
                </Text>
              </Text>
            </View>
            <View style={styles.containerRow}>
              <Image
                source={require("../assets/images/size.png")}
                style={styles.bullet}
              />
              <Text style={styles.label}>Gender: {dog.gender}</Text>
            </View>
            <View style={styles.containerRow}>
              <Image
                source={require("../assets/images/size.png")}
                style={styles.bullet}
              />
              <Text style={styles.label}>Size: {dog.size}</Text>
            </View>
            <View style={styles.containerRow}>
              <Image
                source={require("../assets/images/size.png")}
                style={styles.bullet}
              />
              <Text style={styles.label}>Last seen at: {dog.location}</Text>
            </View>

            <View style={styles.containerRow}>
              <Image
                source={require("../assets/images/details.png")}
                style={styles.bullet}
              />
              <Text style={styles.label}>Additional details: {dog.details}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.userDetailsContainer}>
              <Image
                source={require("../assets/images/size.png")}
                style={styles.bullet}
              />
              <Text style={styles.label}>
                {dog.userId && dog.userId.fullName ? (
                  <>
                    <Text style={styles.label}>Posted by: </Text>
                    {dog.userId.fullName}
                  </>
                ) : (
                  <Text style={styles.errorText}>
                    Error: User info unavailable.
                  </Text>
                )}
              </Text>
            </View>
            <View style={styles.userDetailsContainer}>
              <Image
                source={require("../assets/images/size.png")}
                style={styles.bullet}
              />
              {userData && userData.contact ? (
                <Text style={styles.contact}>
                  <Text style={styles.label}>Contact number: </Text>
                  {userData.contact}
                </Text>) : (
                <Text style={styles.errorText}>Contact number unavailable.</Text>
              )}
            </View>
            <View style={styles.userDetailsContainer}>
              <Image
                source={require("../assets/images/size.png")}
                style={styles.bullet}
              />
              {userData && userData.address ? (
                <Text style={styles.contact}>
                  <Text style={styles.label}>Address: </Text>
                  {userData.address}
                </Text>
              ) : (
                <Text style={styles.errorText}>Address unavailable.</Text>
              )}
            </View>
            {/* 
                    <View>
                      <Text>{JSON.stringify(userData)}</Text>
                    </View>
                    */}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  mainWrapper: {
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
  mainContent: {
    padding: 20,
    flexGrow: 1,
  },
  arrowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    borderRadius: 8,
  },
  arrowIcon: {
    width: 24,
    height: 24,
    tintColor: '#FFD700',
    marginRight: 10,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6B4E31',
    fontFamily: 'Roboto',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    padding: 20,
    //marginTop: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  missingDogImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    resizeMode: 'contain',
    borderWidth: 2,
    borderColor: '#FFD700',
    marginBottom: 10,
  },
  info: {
    marginTop: 10,
    width: '100%',
  },
  petIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  petId: {
    fontSize: 15,
    color: '#6B4E31',
    fontFamily: 'Roboto',
  },
  category: {
    fontSize: 15,
    color: '#6B4E31',
    fontFamily: 'Roboto',
  },
  breed: {
    color: '#6B4E31',
    fontFamily: 'Roboto',
    textTransform: 'capitalize',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: 10,
  },
  containerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  userDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contact: {
    fontSize: 15,
    color: '#6B4E31',
    fontFamily: 'Roboto',
  },
  /*
  postedByContainer: {
    padding: 8,
    borderRadius: 10,
    marginLeft: -8,
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: '#F9F9F9',
  },
  */
  bullet: {
    width: 10,
    height: 10,
    marginRight: 5,
    tintColor: '#6B4E31',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B4E31',
    fontFamily: 'Roboto',
  },
  errorText: {
    color: '#FF4D4D',
    fontSize: 15,
    fontFamily: 'Roboto',
  },
});
export default MatchPageMoreInfoLost;