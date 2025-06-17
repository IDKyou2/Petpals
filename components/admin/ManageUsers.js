import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = "http://192.168.1.24:5000/api/";

const ManageUsersScreen = ({ onNavigateToAdminDashBoard, onNavigateToProfileUser }) => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}auth/all-users`);
                console.log("API Response:", response.data);
                if (response.data && Array.isArray(response.data)) {
                    const fetchedUsers = response.data.map(user => {
                        const normalizedProfilePic = user.profilePic ? user.profilePic.replace(/\\/g, '/') : null;
                        const imageUrl = normalizedProfilePic ? `http://192.168.1.24:5000/${normalizedProfilePic}` : null;
                        console.log(`User ${user._id} - Full Name: ${user.fullName}, Profile Pic Path: ${normalizedProfilePic}, Full URL: ${imageUrl}`);
                        return {
                            id: user._id,
                            fullName: user.fullName || 'Unknown User',
                            email: user.email || 'N/A',
                            username: user.username || 'N/A',
                            contact: user.contact || 'N/A',
                            profilePic: normalizedProfilePic,
                            image: imageUrl && normalizedProfilePic !== 'Uploads/'
                                ? { uri: imageUrl }
                                : require('../../assets/images/default-user.png'),
                            originalImageUrl: imageUrl,
                            banned: user.banned, // Use the actual banned status from the API
                        };
                    });
                    setUsers(fetchedUsers);
                } else {
                    console.error("Unexpected response format:", response.data);
                    setUsers([]);
                }
            } catch (error) {
                console.error("Error fetching users:", error.message);
                setUsers([]);
            }
        };
        fetchUsers();
    }, []);

    const handleImageError = async (userId, imageUrl) => {
        console.warn(`Failed to load image for user ${userId}. URL: ${imageUrl}`);
        try {
            const response = await fetch(imageUrl, { method: 'HEAD' });
            console.log(`Fetch response for ${imageUrl}: Status ${response.status}`);
            if (response.status === 404) {
                console.log(`Image not found on server for ${userId}. Check uploads directory.`);
            }
        } catch (error) {
            console.error(`Error fetching ${imageUrl}:`, error.message);
        }
        setUsers(prevUsers =>
            prevUsers.map(user =>
                user.id === userId
                    ? { ...user, image: require('../../assets/images/default-user.png') }
                    : user
            )
        );
    };

    const handleBlockUser = async (userId, currentStatus) => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Error", "Authentication token not found. Please log in again.");
                return;
            }

            const response = await axios.put(
                `${API_BASE_URL}auth/user/${userId}/ban`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 200) {
                setUsers(prevUsers =>
                    prevUsers.map(user =>
                        user.id === userId
                            ? { ...user, banned: response.data.banned }
                            : user
                    )
                );
                Alert.alert(
                    "Success",
                    response.data.message,
                    [{ text: "OK" }]
                );
            }
        } catch (error) {
            console.error("Error toggling block status:", error.message);
            const errorMsg = error.response?.data?.message || "Failed to update user status. Please try again.";
            Alert.alert("Error", errorMsg);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/images/Logo-removebg.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
            </View>
            <View style={styles.mainContent}>
                <View style={styles.subHeader}>
                    <TouchableOpacity style={styles.backButton} onPress={onNavigateToAdminDashBoard}>
                        <Image
                            source={require('../../assets/images/back-arrow.png')}
                            style={styles.backButtonImage}
                        />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>Manage Users</Text>
                </View>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={true}
                >
                    {users.length > 0 ? (
                        users.map(user => (
                            <View key={user.id} style={styles.userCard}>
                                <Image
                                    source={user.image}
                                    style={styles.userImage}
                                    onError={() => handleImageError(user.id, user.image.uri)}
                                />
                                <View style={styles.infoContainer}>
                                    <Text style={styles.nameText}>{user.fullName}</Text>
                                    <Text style={styles.categoryText}>Email: {user.email}</Text>
                                    <View style={styles.buttonContainer}>
                                        <TouchableOpacity
                                            style={styles.viewButton}
                                            onPress={() => onNavigateToProfileUser(user)}
                                        >
                                            <Text style={styles.buttonText}>VIEW</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.blockButton, user.banned ? null : styles.unblockButton]}
                                            onPress={() => handleBlockUser(user.id, user.banned)}
                                        >
                                            <Text style={styles.buttonText}>{user.banned ? 'UNBLOCK USER' : 'BLOCK USER'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noUsersText}>No users found.</Text>
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    logoContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 100,
        height: 100,
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
    mainContent: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 15,
        marginHorizontal: 10,
        marginVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    subHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    backButtonImage: {
        width: 24,
        height: 24,
        tintColor: '#6B4E31',
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFD700',
        fontFamily: 'Roboto',
        flex: 1,
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 15,
        marginBottom: 15,
        marginHorizontal: 10,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    userImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#FFD700',
        marginRight: 15,
        backgroundColor: '#F9F9F9',
    },
    infoContainer: {
        flex: 1,
    },
    nameText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6B4E31',
        fontFamily: 'Roboto',
        marginBottom: 5,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B4E31',
        fontFamily: 'Roboto',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
    },
    viewButton: {
        backgroundColor: '#FFD700',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    blockButton: {
        backgroundColor: '#FF6B6B',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    unblockButton: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#FFD700',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    buttonText: {
        color: '#6B4E31',
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontFamily: 'Roboto',
    },
    noUsersText: {
        fontSize: 16,
        color: '#6B4E31',
        textAlign: 'center',
        marginTop: 20,
        fontFamily: 'Roboto',
    },
});

export default ManageUsersScreen;