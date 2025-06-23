import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import axios from 'axios';

const API_BASE_URL = "http://192.168.1.6:5000/api/";

const FoundDogs = ({ onNavigateToAdminDashBoard, onNavigateToViewFoundDogInfo }) => {
    const [dogs, setDogs] = useState([]);

    useEffect(() => {
        const fetchFoundDogs = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}all-found-dogs`);
                console.log("API Response:", response.data);
                if (response.data && Array.isArray(response.data)) {
                    const fetchedDogs = response.data.map(dog => {
                        const normalizedImagePath = dog.imagePath ? dog.imagePath.replace(/\\/g, '/') : null;
                        const imageUrl = normalizedImagePath ? `http://192.168.1.6:5000${normalizedImagePath}` : null;
                        console.log(`Dog ${dog._id} - Image Path: ${normalizedImagePath}, Full URL: ${imageUrl}`);
                        return {
                            id: dog._id,
                            petId: dog.petId,
                            category: dog.category,
                            breed: dog.breed,
                            gender: dog.gender,
                            lastSeenLocation: dog.location,
                            size: dog.size,
                            additionalDetails: dog.details,
                            userId: dog.userId,
                            image: imageUrl && normalizedImagePath !== '/Uploads/foundDogs/'
                                ? { uri: imageUrl }
                                : require('../../assets/images/dog-icon.png'),
                            originalImageUrl: imageUrl,
                        };
                    });
                    setDogs(fetchedDogs);
                } else {
                    console.error("Unexpected response format:", response.data);
                    setDogs([]);
                }
            } catch (error) {
                console.error("Error fetching found dogs:", error.message);
                setDogs([]);
            }
        };
        fetchFoundDogs();
    }, []);

    const handleImageError = (dogId, imageUrl) => {
        console.warn(`Failed to load image for dog ${dogId}. URL: ${imageUrl}`);
        setDogs(prevDogs =>
            prevDogs.map(dog =>
                dog.id === dogId ? { ...dog, image: require('../../assets/images/dog-icon.png') } : dog
            )
        );
    };

    const handleViewDog = (dog) => {
        onNavigateToViewFoundDogInfo(dog);
    };

    const handleRemoveDog = (dogId) => {
        Alert.alert(
            "Confirm Deletion",
            "Are you sure you want to delete this found dog?",
            [
                {
                    text: "No",
                    style: "cancel",
                },
                {
                    text: "Yes",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await axios.delete(`${API_BASE_URL}founddog/${dogId}`);
                            setDogs(prevDogs => prevDogs.filter(dog => dog.id !== dogId));
                            Alert.alert("Success", "Found dog deleted successfully!");
                        } catch (error) {
                            console.error("Error deleting dog:", error.message);
                            Alert.alert("Error", "Failed to delete dog. Please try again.");
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/images/Logo-removebg.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
            </View>

            {/* Content */}
            <View style={styles.mainContent}>
                <View style={styles.subHeader}>
                    <TouchableOpacity style={styles.backButton} onPress={onNavigateToAdminDashBoard}>
                        <Image
                            source={require('../../assets/images/back-arrow.png')}
                            style={styles.backButtonImage}
                        />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>Found Dogs</Text>
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
                                    <Text style={styles.nameText}>{dog.breed || "N/A"}</Text>
                                    <Text style={styles.breedText}>Category: {dog.category || "N/A"}</Text>
                                    <Text style={styles.categoryText}>Location: {dog.lastSeenLocation || "N/A"}</Text>
                                    <View style={styles.buttonContainer}>
                                        <TouchableOpacity style={styles.viewButton} onPress={() => handleViewDog(dog)}>
                                            <Text style={styles.buttonText}>VIEW</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveDog(dog.id)}>
                                            <Text style={styles.buttonText}>DELETE</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noDogsText}>No found dogs found.</Text>
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

export default FoundDogs;