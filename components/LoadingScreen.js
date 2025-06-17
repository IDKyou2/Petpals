import React, { useEffect } from "react";
import { StyleSheet, View, Image, Text } from "react-native";
import BounceText from "./BounceText";

const LoadingScreen = ({ onFinishLoading }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinishLoading();
    }, 9000);

    return () => clearTimeout(timer);
  }, [onFinishLoading]);

  return (
    <View style={styles.loadingScreen}>
      <View style={styles.loadingScreenForm}>
        <View style={styles.loadingScreenLogo}>
          <Image
            source={require("../assets/images/Global-images/Logo-updated.png")}
            style={styles.logo}
          />
        </View>
        <View style={styles.loadingText}>
          {["L", "O", "A", "D", "I", "N", "G", ".", ".", "."].map(
            (char, index) => (
              <BounceText key={index} char={char} delay={index * 100} />
            )
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#D2B48C",
  },
  loadingScreenForm: {
    width: "100%",
    maxWidth: 500,
    height: 500,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    borderRadius: 10,
    marginTop: 50,
  },
  loadingScreenLogo: {
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 5,
    borderColor: "black",
  },
  loadingText: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 20,
    marginTop: 20,
    fontFamily: "Arial",
  },
  char: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff", 
    animation: "bounce 1s infinite",
  },
});

export default LoadingScreen;
