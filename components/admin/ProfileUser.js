import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';

const ProfileUserScreen = ({ onNavigateToManageUsersScreen, user }) => {
    const defaultImage = require('../../assets/images/default-user.png');
    const profileImage = user?.profilePic && user.profilePic !== 'Uploads/'
        ? { uri: `http://192.168.1.24:5000/${user.profilePic}` }
        : defaultImage;

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
                <TouchableOpacity style={styles.backButton} onPress={onNavigateToManageUsersScreen}>
                    <Image
                        source={require('../../assets/images/back-arrow.png')}
                        style={styles.backButtonImage}
                    />
                </TouchableOpacity>
                <Text style={styles.title}>User Profile</Text>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={true}
                >
                    <View style={styles.profileCard}>
                        <Image
                            source={profileImage}
                            style={styles.profileImage}
                            onError={() => defaultImage}
                        />
                        <View style={styles.infoCard}>
                            <Text style={styles.username}>{user?.fullName || 'Unknown User'}</Text>
                            {/* <TouchableOpacity style={styles.editButton}>
                                <Text style={styles.editButtonText}>Edit</Text>
                            </TouchableOpacity> */}
                            <View style={styles.infoContainer}>
                                <Text style={styles.label}>Username:</Text>
                                <Text style={styles.value}>{user?.username || 'N/A'}</Text>
                            </View>
                            <View style={styles.infoContainer}>
                                <Text style={styles.label}>Full name:</Text>
                                <Text style={styles.value}>{user?.fullName || 'N/A'}</Text>
                            </View>
                            <View style={styles.infoContainer}>
                                <Text style={styles.label}>Contact #:</Text>
                                <Text style={styles.value}>{user?.contact || 'N/A'}</Text>
                            </View>
                            <View style={styles.infoContainer}>
                                <Text style={styles.label}>Email:</Text>
                                <Text style={styles.value}>{user?.email || 'N/A'}</Text>
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
    profileCard: {
        borderRadius: 15,
        padding: 15,
        alignItems: 'center',
        width: '100%',
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#FFD700',
        marginBottom: 10,
        backgroundColor: '#F9F9F9',
    },
    infoCard: {
        // backgroundColor: '#FFF',
        borderRadius: 10,
        padding: 15,
        width: '100%',
        alignItems: 'center',
        // shadowColor: '#000',
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.1,
        // shadowRadius: 4,
        // elevation: 3,
    },
    username: {
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

export default ProfileUserScreen;