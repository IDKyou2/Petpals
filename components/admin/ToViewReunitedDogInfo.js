import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';

const ToViewReunitedDogInfoScreen = ({ onNavigateBack, dog }) => {
    const defaultDogImage = require('../../assets/images/dog-icon.png');
    const [dogImage, setDogImage] = useState(dog?.image || defaultDogImage);

    useEffect(() => {
        console.log("Dog Image:", dog?.image);
        setDogImage(dog?.image || defaultDogImage);
    }, [dog]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>PETPALS</Text>
                <TouchableOpacity style={styles.hamburgerButton}>
                    <View style={styles.hamburger}>
                        <View style={styles.hamburgerLine} />
                        <View style={styles.hamburgerLine} />
                        <View style={styles.hamburgerLine} />
                    </View>
                </TouchableOpacity>
            </View>
            <View style={styles.contentContainer}>
                <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
                    <Image
                        source={require('../../assets/images/back-arrow.png')}
                        style={styles.backButtonImage}
                    />
                </TouchableOpacity>
                <Text style={styles.title}>Reunited Dog Info</Text>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={true}
                >
                    <View style={styles.dogCard}>
                        <Image
                            source={dogImage}
                            style={styles.dogImage}
                            onError={(e) => {
                                console.log("Image load error:", e.nativeEvent.error);
                                setDogImage(defaultDogImage);
                            }}
                        />
                        <View style={styles.infoCard}>
                            <Text style={styles.dogName}>{dog?.name || 'N/A'}</Text>
                            {/* <TouchableOpacity style={styles.editButton}>
                                <Text style={styles.editButtonText}>Edit</Text>
                            </TouchableOpacity> */}
                            <View style={styles.infoContainer}>
                                <Text style={styles.label}>Pet ID:</Text>
                                <Text style={styles.value}>{dog?.petId || 'N/A'}</Text>
                            </View>
                            <View style={styles.infoContainer}>
                                <Text style={styles.label}>Category:</Text>
                                <Text style={styles.value}>{dog?.category || 'N/A'}</Text>
                            </View>
                            <View style={styles.infoContainer}>
                                <Text style={styles.label}>Breed:</Text>
                                <Text style={styles.value}>{dog?.breed || 'N/A'}</Text>
                            </View>
                            <View style={styles.infoContainer}>
                                <Text style={styles.label}>Gender:</Text>
                                <Text style={styles.value}>{dog?.gender || 'N/A'}</Text>
                            </View>
                            <View style={styles.infoContainer}>
                                <Text style={styles.label}>Last seen location:</Text>
                                <Text style={styles.value}>{dog?.lastSeenLocation || 'N/A'}</Text>
                            </View>
                            <View style={styles.infoContainer}>
                                <Text style={styles.label}>Size:</Text>
                                <Text style={styles.value}>{dog?.size || 'N/A'}</Text>
                            </View>
                            <View style={styles.infoContainer}>
                                <Text style={styles.label}>Additional details:</Text>
                                <Text style={styles.value}>{dog?.additionalDetails || 'N/A'}</Text>
                            </View>
                            <View style={styles.infoContainer}>
                                <Text style={styles.label}>Posted by:</Text>
                                <Text style={styles.value}>{dog?.postedBy || 'N/A'}</Text>
                            </View>
                            <View style={styles.infoContainer}>
                                <Text style={styles.label}>Contact number:</Text>
                                <Text style={styles.value}>{dog?.contactNumber || 'N/A'}</Text>
                            </View>
                        </View>
                    </View>
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
    contentContainer: {
        flex: 1,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 15,
        alignSelf: 'center',
        width: '90%',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'Roboto',
        color: '#6B4E31',
        textAlign: 'center',
        marginBottom: 20,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
        alignItems: 'center',
    },
    dogCard: {
        borderRadius: 15,
        padding: 15,
        alignItems: 'center',
        width: '100%',
    },
    dogImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#FFD700',
        marginBottom: 10,
        backgroundColor: '#F9F9F9',
    },
    infoCard: {
        borderRadius: 10,
        padding: 15,
        width: '100%',
        alignItems: 'center',
    },
    dogName: {
        fontSize: 20,
        fontWeight: '600',
        fontFamily: 'Roboto',
        color: '#6B4E31',
        marginBottom: 10,
        textTransform: 'capitalize',
    },
    // editButton: {
    //     backgroundColor: '#FFD700',
    //     paddingVertical: 10,
    //     paddingHorizontal: 20,
    //     borderRadius: 10,
    //     marginBottom: 15,
    //     shadowColor: '#000',
    //     shadowOffset: { width: 0, height: 2 },
    //     shadowOpacity: 0.2,
    //     shadowRadius: 3,
    //     elevation: 4,
    // },
    // editButtonText: {
    //     color: '#6B4E31',
    //     fontSize: 16,
    //     fontWeight: 'bold',
    //     fontFamily: 'Roboto',
    //     textTransform: 'uppercase',
    // },
    infoContainer: {
        flexDirection: 'row',
        marginBottom: 10,
        width: '100%',
        paddingHorizontal: 10,
    },
    label: {
        fontSize: 16,
        fontFamily: 'Roboto',
        color: '#6B4E31',
        width: '40%',
        fontWeight: '600',
    },
    value: {
        fontSize: 16,
        fontFamily: 'Roboto',
        color: '#6B4E31',
        width: '60%',
    },
});

export default ToViewReunitedDogInfoScreen;