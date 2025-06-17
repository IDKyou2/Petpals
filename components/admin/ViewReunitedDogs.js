import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Modal, Alert } from 'react-native';
import axios from 'axios';

const API_BASE_URL = "http://192.168.1.24:5000/api/";

const ViewReunitedDogs = ({ onNavigateToAdminDashBoard, onNavigateToViewReunitedDogInfo, onNavigateToUserLogin }) => {
    const [dogs, setDogs] = useState([]);
    const [menuOpen, setMenuOpen] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [dogToDelete, setDogToDelete] = useState(null);

    useEffect(() => {
        const fetchReunitedDogs = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}all-reunited-dogs`);
                if (response.data && Array.isArray(response.data)) {
                    const fetchedDogs = response.data.map(dog => {
                        const normalizedImagePath = dog.imagePath ? dog.imagePath.replace(/\\/g, '/') : null;
                        const imageUrl = normalizedImagePath ? `http://192.168.1.24:5000${normalizedImagePath}` : null;
                        return {
                            id: dog._id,
                            petId: dog.petId,
                            image: imageUrl && normalizedImagePath !== '/Uploads/reunitedDogs/'
                                ? { uri: imageUrl }
                                : require('../../assets/images/dog-icon.png'),
                            originalImageUrl: imageUrl,
                            name: dog.name || "N/A",
                            category: dog.category || "N/A",
                            breed: dog.breed || "N/A",
                            gender: dog.gender || "N/A",
                            lastSeenLocation: dog.location || "N/A",
                            size: dog.size || "N/A",
                            additionalDetails: dog.details || "N/A",
                            postedBy: dog.userId?.fullName || "N/A",
                            contactNumber: dog.userId?.contact || "N/A",
                            userId: dog.userId,
                        };
                    });
                    setDogs(fetchedDogs);
                } else {
                    setDogs([]);
                }
            } catch (error) {
                console.error("Error fetching reunited dogs:", error.message);
                setDogs([]);
            }
        };
        fetchReunitedDogs();
    }, []);

    const handleImageError = (dogId, imageUrl) => {
        setDogs(prevDogs =>
            prevDogs.map(dog =>
                dog.id === dogId ? { ...dog, image: require('../../assets/images/dog-icon.png') } : dog
            )
        );
    };

    const handleRemoveDog = async (dogId) => {
        try {
            // Fetch matched petId
            const matchResponse = await axios.get(`${API_BASE_URL}get-matched-petid/${dogId}`);
            const { petId, matchedPetId, type } = matchResponse.data;

            // Call delete-match with both petIds
            const petId1 = type === 'lost' ? petId : matchedPetId;
            const petId2 = type === 'lost' ? matchedPetId : petId;
            await axios.delete(`${API_BASE_URL}delete-match`, {
                data: { petId1, petId2 },
            });

            // Update state to remove both dogs
            setDogs(prevDogs => prevDogs.filter(dog => dog.petId !== petId && dog.petId !== matchedPetId));
            setDeleteModalVisible(false);
            setDogToDelete(null);
        } catch (error) {
            console.error("Error removing matched dogs:", error.message);
            Alert.alert("Error", "Failed to delete the matched dogs. Please try again.");
        }
    };

    const openDeleteModal = (dogId) => {
        setDogToDelete(dogId);
        setDeleteModalVisible(true);
    };

    const closeDeleteModal = () => {
        setDeleteModalVisible(false);
        setDogToDelete(null);
    };

    const toggleMenu = () => setMenuOpen((prev) => !prev);

    const navigateTo = (path) => {
        const routeMap = {
            "/admin-dash-board": onNavigateToAdminDashBoard,
            "/login": onNavigateToUserLogin,
        };
        const handler = routeMap[path];
        if (handler) {
            handler();
            toggleMenu();
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
                {/* 
                <TouchableOpacity style={styles.hamburgerButton} onPress={toggleMenu}>
                    <View style={styles.hamburger}>
                        <View style={styles.hamburgerLine} />
                        <View style={styles.hamburgerLine} />
                        <View style={styles.hamburgerLine} />
                    </View>
                </TouchableOpacity>
                 */}
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
                            { label: "Logout", path: "/login" },
                        ].map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.menuItem}
                                onPress={() => navigateTo(item.path)}
                            >
                                <Text style={styles.menuText}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={deleteModalVisible}
                transparent
                animationType="fade"
                onRequestClose={closeDeleteModal}
            >
                <View style={styles.deleteModalOverlay}>
                    <View style={styles.deleteModalContent}>
                        <Text style={styles.deleteModalText}>Delete this reunited pair?</Text>
                        <View style={styles.deleteModalButtons}>
                            <TouchableOpacity
                                style={[styles.deleteModalButton, styles.yesButton]}
                                onPress={() => handleRemoveDog(dogToDelete)}
                            >
                                <Text style={styles.deleteModalButtonText}>YES</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.deleteModalButton, styles.noButton]}
                                onPress={closeDeleteModal}
                            >
                                <Text style={styles.deleteModalButtonText}>NO</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <View style={styles.mainContent}>
                <View style={styles.subHeader}>
                    <TouchableOpacity style={styles.backButton} onPress={onNavigateToAdminDashBoard}>
                        <Image
                            source={require('../../assets/images/back-arrow.png')}
                            style={styles.backButtonImage}
                        />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>Reunited with Owner</Text>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={true}
                >
                    {dogs.length > 0 ? (
                        dogs.map(dog => (
                            <View key={dog.id} style={styles.dogCard}>
                                <Image
                                    source={dog.image}
                                    style={styles.dogImage}
                                    onError={() => handleImageError(dog.id, dog.originalImageUrl)}
                                />
                                <View style={styles.infoContainer}>
                                    <Text style={styles.nameText}>{dog.name}</Text>
                                    <Text style={styles.breedText}>Breed: {dog.breed}</Text>
                                    <Text style={styles.categoryText}>{dog.category}</Text>
                                    <View style={styles.buttonContainer}>
                                        <TouchableOpacity
                                            style={styles.viewButton}
                                            onPress={() => onNavigateToViewReunitedDogInfo(dog)}
                                        >
                                            <Text style={styles.buttonText}>VIEW</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.removeButton}
                                            onPress={() => openDeleteModal(dog.id)}
                                        >
                                            <Text style={styles.buttonText}>DELETE</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noDogsText}>No reunited dogs found.</Text>
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
        flexDirection: 'row',
        alignItems: 'center',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        padding: 15,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        width: '100%',
        maxHeight: '50%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    menuItem: {
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#DDD',
    },
    menuText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6B4E31',
        fontFamily: 'Roboto',
    },
    deleteModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteModalContent: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        width: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    deleteModalText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6B4E31',
        marginBottom: 20,
        fontFamily: 'Roboto',
    },
    deleteModalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    deleteModalButton: {
        flex: 1,
        paddingVertical: 10,
        marginHorizontal: 5,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    yesButton: {
        backgroundColor: '#FF6B6B',
    },
    noButton: {
        backgroundColor: '#4CAF50',
    },
    deleteModalButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontFamily: 'Roboto',
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
    dogCard: {
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
    dogImage: {
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
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B4E31',
        fontFamily: 'Roboto',
    },
    nameText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6B4E31',
        fontFamily: 'Roboto',
        marginBottom: 5,
    },
    breedText: {
        fontSize: 14,
        color: '#6B4E31',
        fontFamily: 'Roboto',
        marginBottom: 5,
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
    removeButton: {
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
    buttonText: {
        color: '#6B4E31',
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontFamily: 'Roboto',
    },
    noDogsText: {
        fontSize: 16,
        color: '#6B4E31',
        textAlign: 'center',
        marginTop: 20,
        fontFamily: 'Roboto',
    },
});

export default ViewReunitedDogs;