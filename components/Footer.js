import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";

const Footer = ({
    onNavigateToHome,
    onNavigateToChatForum,
    handleNotificationClick,
    newChatsCount,
    newPostsCount,
}) => {
    return (
        <View style={styles.footer}>
            <TouchableOpacity style={styles.footerButton} onPress={onNavigateToHome}>
                <Image
                    source={require("../assets/images/Global-images/home-icon.png")}
                    style={styles.footerIcon}
                />
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.footerButton}
                onPress={onNavigateToChatForum}
            >
                {newChatsCount > 0 && (
                    <Text style={styles.notificationCount}>{newChatsCount}</Text>
                )}
                <Image
                    source={require("../assets/images/Global-images/message-icon.png")}
                    style={styles.footerIcon}
                />
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.footerButton}
                onPress={handleNotificationClick}
            >
                {newPostsCount > 0 && (
                    <Text style={styles.notificationCount}>{newPostsCount}</Text>
                )}
                <Image
                    source={require("../assets/images/Global-images/notification-icon.png")}
                    style={styles.footerIcon}
                />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    footer: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingVertical: 15,
        backgroundColor: "#FFF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    footerButton: {
        padding: 10,
        position: "relative",
    },
    footerIcon: {
        width: 30,
        height: 30,
        tintColor: "#6B4E31",
    },
    notificationCount: {
        position: "absolute",
        top: -5,
        right: -5,
        backgroundColor: "#FF4D4D",
        color: "#FFF",
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        fontSize: 12,
        fontWeight: "bold",
        fontFamily: "Roboto",
    },
});

export default Footer;