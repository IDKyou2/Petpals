import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  Modal,
  Dimensions,
} from "react-native";
import axios from "axios";

const { width, height } = Dimensions.get("window");

const NotificationModal = ({ isModalOpen, closeModal }) => {
  const [notifications, setNotifications] = useState([]);

  // Define API URL constant
  const NEW_POSTS_API_URL = "http://192.168.1.6:5000/api/posts/new-posts";

  useEffect(() => {
    if (isModalOpen) {
      const fetchNotifications = async () => {
        try {
          const response = await axios.get(NEW_POSTS_API_URL);
          const sortedNotifications = response.data.notifications.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          console.log("Fetched notifications:", sortedNotifications);
          setNotifications(sortedNotifications);
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }
      };

      fetchNotifications();
    }
  }, [isModalOpen]);

  const renderNotificationItem = ({ item }) => {
    const createdAt = new Date(item.createdAt);
    const formattedDate = createdAt.toLocaleDateString();
    const formattedTime = createdAt.toLocaleTimeString();
    const imageUri = `${NEW_POSTS_API_URL.replace("/api/posts/new-posts", "")}${item.imagePath
      }`;

    return (
      <View style={styles.notificationItem}>
        <View style={styles.notificationDetails}>
          <Image
            source={{ uri: imageUri }}
            style={styles.notificationImage}
            defaultSource={require("../assets/images/dog-icon.png")}
            onError={(e) =>
              console.log(`Image load error: ${imageUri}`, e.nativeEvent.error)
            }
          />
          <View>
            <Text style={styles.notificationType}>
              {item.category === "Lost" ? "Lost Dog" : "Found Dog"}
            </Text>
            <Text style={styles.notificationName}>
              {item.name}
            </Text>
          </View>
        </View>
        <Text style={styles.notificationDate}>
          {formattedDate} at {formattedTime}
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={isModalOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={closeModal}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
            <Text style={styles.closeButtonText}>X</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Notifications</Text>
          {notifications.length === 0 ? (
            <Text style={styles.noNotifications}>No recent notifications.</Text>
          ) : (
            <FlatList
              data={notifications}
              renderItem={renderNotificationItem}
              keyExtractor={(item) => item._id}
              style={styles.notificationList}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    width: "90%",
    maxHeight: height * 0.8,
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#6B4E31",
    borderRadius: 20,
    padding: 8,
    zIndex: 1,
  },
  closeButtonText: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Roboto",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6B4E31",
    marginBottom: 20,
    textAlign: "center",
    fontFamily: "Roboto",
  },
  notificationList: {
    flexGrow: 0,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#F9F9F9",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationImage: {
    width: 50,
    height: 50,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  notificationType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B4E31",
    fontFamily: "Roboto",
  },
  notificationName: {
    fontSize: 14,
    color: "#333",
    fontFamily: "Roboto",
  },
  notificationDate: {
    fontSize: 12,
    color: "#6B4E31",
    marginLeft: 15,
    fontFamily: "Roboto",
  },
  noNotifications: {
    fontSize: 14,
    color: "#6B4E31",
    textAlign: "center",
    fontFamily: "Roboto",
    marginTop: 20,
  },
});

export default NotificationModal;