import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Modal,
  ScrollView,
} from "react-native";
import axios from "axios";

const { width } = Dimensions.get("window");
const API_BASE_URL = "http://192.168.1.6:5000/api/"; // For API endpoints
const STATIC_BASE_URL = "http://192.168.1.6:5000/"; // For static files (images)

const iconMap = {
  "default-user.png": require("../../assets/images/default-user.png"),
  "lost-dogs.png": require("../../assets/images/lost-dogs.png"),
  "found-dogs.png": require("../../assets/images/found-dogs.png"),
  "heart.png": require("../../assets/images/heart.png"),
  "close.png": require("../../assets/images/close.png"),
  "notification-icon.png": require("../../assets/images/notification-icon.png"),
};

const AdminDashBoard = ({
  onNavigateToAdminDashBoard,
  onNavigateToUserLogin,
  onNavigateToManageUsersScreen,
  onNavigateToMissingDogsScreen,
  onNavigateToFoundDogsScreen,
  onNavigateToViewUnclaimedDogsScreen,
  onNavigateToViewReunitedDogsScreen,
  onLogout,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    users: 0,
    missingDogs: 0,
    foundDogs: 0,
    reunited: 0,
    unclaimed: 0,
  });
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      let newDashboardData = {
        users: 0,
        missingDogs: 0,
        foundDogs: 0,
        reunited: 0,
        unclaimed: 0,
      };

      try {
        const [
          usersResponse,
          lostDogsResponse,
          foundDogsResponse,
          reunitedResponse,
          unclaimedResponse,
        ] = await Promise.all([
          axios.get(`${API_BASE_URL}auth/total-users`).catch((err) => ({
            error: err,
          })),
          axios.get(`${API_BASE_URL}total-lostdogs`).catch((err) => ({
            error: err,
          })),
          axios.get(`${API_BASE_URL}total-founddogs`).catch((err) => ({
            error: err,
          })),
          axios.get(`${API_BASE_URL}reunited-count`).catch((err) => ({
            error: err,
          })),
          axios.get(`${API_BASE_URL}total-non-reunited-dogs`).catch((err) => ({
            error: err,
          })),
        ]);

        if (!usersResponse.error) {
          newDashboardData.users = usersResponse.data.totalUsers || 0;
        } else {
          console.error("Error fetching users:", usersResponse.error.response?.data);
        }
        if (!lostDogsResponse.error) {
          newDashboardData.missingDogs = lostDogsResponse.data.totalLostDogs || 0;
        } else {
          console.error("Error fetching lost dogs:", lostDogsResponse.error.response?.data);
        }

        if (!foundDogsResponse.error) {
          newDashboardData.foundDogs = foundDogsResponse.data.totalFoundDogs || 0;
        } else {
          console.error("Error fetching found dogs:", foundDogsResponse.error.response?.data);
        }

        if (!reunitedResponse.error) {
          newDashboardData.reunited = reunitedResponse.data.reunitedCount || 0;
        } else {
          console.error("Error fetching reunited count:", reunitedResponse.error.response?.data);
        }

        if (!unclaimedResponse.error) {
          newDashboardData.unclaimed = unclaimedResponse.data.totalNonReunitedDogs || 0;
        } else {
          console.error("Error fetching unclaimed dogs:", unclaimedResponse.error.response?.data);
        }

        setDashboardData(newDashboardData);
      } catch (error) {
        console.error("Unexpected error fetching dashboard data:", error);
        setDashboardData(newDashboardData);
      }
    };

    const fetchNotifications = async () => {
      try {
        const [lostDogsResponse, foundDogsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}lostdog`),
          axios.get(`${API_BASE_URL}founddog`),
        ]);

        const lostDogs = lostDogsResponse.data.lostDogs.map(dog => {
          console.log(`Lost Dog ${dog.petId} imagePath:`, dog.imagePath);
          return { ...dog, postType: 'lost' };
        });
        const foundDogs = foundDogsResponse.data.foundDogs.map(dog => {
          console.log(`Found Dog ${dog.petId} imagePath:`, dog.imagePath);
          return { ...dog, postType: 'found' };
        });

        const allDogs = [...lostDogs, ...foundDogs].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setNotifications(allDogs);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchDashboardData();
    fetchNotifications();
  }, []);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const toggleNotificationModal = () => setNotificationModalOpen((prev) => !prev);

  const navigateTo = (path) => {
    const routeMap = {
      "/admin-dash-board": onNavigateToAdminDashBoard,
      "/login": onNavigateToUserLogin,
      "/logout": onLogout,
      "/manage-users": onNavigateToManageUsersScreen,
      "/missing-dogs": onNavigateToMissingDogsScreen,
      "/found-dogs": onNavigateToFoundDogsScreen,
      "/unclaimed-dogs": onNavigateToViewUnclaimedDogsScreen,
      "/reunited-dogs": onNavigateToViewReunitedDogsScreen,
    };
    const handler = routeMap[path];
    if (handler) {
      handler();
    }
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/images/Logo-removebg.png")}
              style={styles.logo}
              resizeMode="contain"
            />

          </View>
          <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
            <View style={styles.menuIcon}>
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.notificationContainer}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <TouchableOpacity onPress={toggleNotificationModal}>
            <Image
              source={iconMap["notification-icon.png"]}
              style={styles.notificationIcon}
              resizeMode="contain"
            />
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
            onPress={toggleMenu}
            activeOpacity={1}
          >
            <View style={styles.modalContent}>
              {[
                { label: "Home", path: "/admin-dash-board" },
                { label: "Logout", path: "/logout" },
              ].map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={() => {
                    navigateTo(item.path);
                    toggleMenu();
                  }}
                >
                  <Text style={styles.menuText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={notificationModalOpen}
          transparent
          animationType="fade"
          onRequestClose={toggleNotificationModal}
        >
          <View style={styles.notificationModalOverlay}>
            <View style={styles.notificationModalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={toggleNotificationModal}
              >
                <Image
                  source={iconMap["close.png"]}
                  style={styles.closeIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <Text style={styles.notificationModalTitle}>Notifications</Text>
              <ScrollView style={styles.notificationList}>
                {notifications.length > 0 ? (
                  notifications.map((dog, index) => (
                    <View key={dog.petId || index} style={styles.notificationItem}>
                      <View style={styles.notificationImageContainer}>
                        {dog.imagePath ? (
                          <Image
                            source={{ uri: `${STATIC_BASE_URL}${dog.imagePath.replace(/^\//, '')}` }}
                            style={styles.notificationImage}
                            onError={(error) =>
                              console.error(`Failed to load image for dog ${dog.petId}:`, error.nativeEvent)
                            }
                            onLoadStart={() => console.log(`Loading image for dog ${dog.petId}`)}
                            onLoadEnd={() => console.log(`Loaded image for dog ${dog.petId}`)}
                          />
                        ) : (
                          <Image
                            source={require("../../assets/images/dog-icon.png")}
                            style={styles.notificationImage}
                          />
                        )}
                      </View>
                      <View style={styles.notificationContent}>
                        <Text style={styles.notificationText}>
                          {dog.postType === 'lost' ? 'Lost Dog Reported' : 'Found Dog Reported'}
                        </Text>
                        <Text style={styles.notificationDetails}>
                          Breed: {dog.breed} | {dog.gender} | {dog.location}
                        </Text>
                        <Text style={styles.notificationTimestamp}>
                          Posted on: {new Date(dog.createdAt).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noNotificationsText}>No new notifications</Text>
                )}
              </ScrollView>

            </View>

          </View>
        </Modal>

        <View style={styles.mainContent}>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {[
              { title: "Users", count: dashboardData.users, icon: "default-user.png", path: "/manage-users" },
              { title: "Missing Dogs", count: dashboardData.missingDogs, icon: "lost-dogs.png", path: "/missing-dogs" },
              { title: "Found Dogs", count: dashboardData.foundDogs, icon: "found-dogs.png", path: "/found-dogs" },
              { title: "Reunited with owner", count: dashboardData.reunited, icon: "heart.png", path: "/reunited-dogs" },
              { title: "Unclaimed", count: dashboardData.unclaimed, icon: "close.png", path: "/unclaimed-dogs" },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.card}
                onPress={() => item.path && navigateTo(item.path)}
              >
                <Image
                  source={iconMap[item.icon]}
                  style={styles.cardIcon}
                  resizeMode="contain"
                />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardCount}>{item.count || "0"}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  logoContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6B4E31',
    fontFamily: 'Roboto',
    marginLeft: 20,
    marginTop: 10,
  },
  menuButton: {
    padding: 10,
  },
  menuIcon: {
    width: 30,
    height: 20,
    justifyContent: 'space-between',
  },
  menuLine: {
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
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '40%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    marginTop: 'auto',
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
    flex: 1,
    padding: 15,
    marginTop: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 20,
    flexGrow: 1,
    minHeight: Dimensions.get('window').height - 150,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    width: '90%',
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  cardIcon: {
    width: 30,
    height: 30,
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    color: '#6B4E31',
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  cardCount: {
    fontSize: 24,
    color: '#6B4E31',
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
  notificationContainer: {
    flexDirection: "row",      // Horizontal layout
    alignItems: "center",      // Vertically center the items
    justifyContent: "space-between", // Space them out or use "flex-start" for tight layout
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  notificationIcon: {
    width: 30,
    height: 30,
    marginTop: 15,
    marginRight: 15,
  },
  notificationModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  notificationModalContent: {
    backgroundColor: '#FFF',
    padding: 20,
    width: '80%',
    maxWidth: 400,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  notificationModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6B4E31',
    marginBottom: 20,
    fontFamily: 'Roboto',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  closeIcon: {
    width: 24,
    height: 24,
  },
  notificationList: {
    width: '100%',
    maxHeight: Dimensions.get('window').height * 0.6,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
    marginBottom: 5,
    borderRadius: 8,
  },
  notificationImageContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  notificationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  notificationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Roboto',
  },
  notificationDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    fontFamily: 'Roboto',
  },
  notificationTimestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    fontFamily: 'Roboto',
  },
  noNotificationsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Roboto',
  },
});

export default AdminDashBoard;