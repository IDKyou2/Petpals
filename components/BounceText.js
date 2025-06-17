import React, { useRef, useEffect } from "react";
import { Animated, StyleSheet } from "react-native";

const BounceText = ({ char, delay }) => {
  const bounceValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceValue, {
          toValue: -20,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(bounceValue, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [bounceValue]);

  return (
    <Animated.Text
      style={[styles.char, { transform: [{ translateY: bounceValue }] }]}
    >
      {char}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  char: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#333",
  },
});

export default BounceText;
