import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LoginPage = ({ onSignUpClick, onLoginSuccess, navigateToAdminDashBoard }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = "http://192.168.1.24:5000/api/login/login";

  const handleLoginSubmit = async () => {
    console.log("User clicked login button.");
    if (!username?.trim() || !password?.trim()) {
      setErrorMessage("Please enter both username and password.");
      setTimeout(() => {
        setErrorMessage("");
      }, 5000);
      return;
    }

    // Whitespace validation
    if (/\s/.test(username) || /\s/.test(password)) {
      setErrorMessage("Username and password cannot contain whitespace.");
      setTimeout(() => {
        setErrorMessage("");
      }, 5000);
      return;
    }

    // Admin credentials check
    if (username === "admin123" && password === "admin123") {
      setIsLoading(true);
      try {
        await AsyncStorage.multiSet([
          ["token", "admin-dummy-token"],
          ["user", JSON.stringify({ username: "admin123", role: "admin" })],
        ]);
        // Pass a callback to onLoginSuccess to handle navigation after state updates
        onLoginSuccess(true, navigateToAdminDashBoard);
      } catch (error) {
        console.error("Admin login error:", error);
        setErrorMessage("Admin login failed. Please try again.");
        setTimeout(() => {
          setErrorMessage("");
        }, 10000);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Regular user login
    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        API_URL,
        { username, password },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        await AsyncStorage.multiSet([
          ["token", response.data.token],
          ["user", JSON.stringify(response.data.user)],
        ]);
        onLoginSuccess(false);
      }
    } catch (error) {
      let errorMsg = "Login failed. Please try again.";

      if (error.response) {
        errorMsg = error.response.data.message || errorMsg;
        if (error.response.status === 401) {
          Alert.alert("Login Error", error.response.data.message);
          console.log("Login Error:", error.response.data.message);
          setErrorMessage("Incorrect username or password. Please try again.");
        } else if (error.response.status === 403) {
          Alert.alert("Login Error", error.response.data.message);
          setErrorMessage(errorMsg);
        } else {
          setErrorMessage(errorMsg);
        }
        setTimeout(() => {
          setErrorMessage("");
        }, 10000);
      } else if (error.request) {
        errorMsg = "Network error. Please check your internet connection.";
        if (!API_URL) {
          console.log("API_URL is not defined. Please check your configuration.");
        } else {
          console.log("Request made but no response received. Double check the API_URL:", API_URL);
        }
      } else {
        errorMsg = `Error: ${error.message}`;
        console.log("Error in setting up request:", error.message);
      }
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.LoginPageContainer}>
        <View style={styles.loginLogo}>
          <Image
            source={require("../assets/images/Global-images/Logo-removebg.png")}
            style={styles.logoImage}
          />
        </View>

        {errorMessage && (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        )}

        <View style={styles.LoginPage}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            editable={!isLoading}
            autoCapitalize="none"
            placeholderTextColor="#6B4E31"
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.inputWithIcon}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              editable={!isLoading}
              placeholderTextColor="#6B4E31"
            />
            <TouchableOpacity
              onPress={() => setPasswordVisible(!passwordVisible)}
              style={styles.passwordIcon}
              disabled={isLoading}
            >
              <Image
                source={
                  passwordVisible
                    ? require("../assets/images/Global-images/hide-eyes-updated.png")
                    : require("../assets/images/Global-images/open-eyes-updated.png")
                }
                style={styles.iconImage}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonLoading,
            ]}
            onPress={handleLoginSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#6B4E31" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.loginText}>
          Don't have an account?{" "}
          <Text onPress={onSignUpClick} disabled={isLoading}>
            <Text style={styles.signUpLinkButton}>Signup</Text>
          </Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  LoginPageContainer: {
    width: '80%',
    maxWidth: 400,
    minHeight: 350,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    padding: 20,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  loginLogo: {
    marginBottom: 10,
  },
  logoImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    opacity: 0.95,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  errorMessage: {
    color: '#FF4D4D',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Roboto',
  },
  LoginPage: {
    width: '100%',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    color: '#6B4E31',
    fontFamily: 'Roboto',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputWithIcon: {
    width: '100%',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingRight: 40,
    color: '#6B4E31',
    fontFamily: 'Roboto',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  passwordContainer: {
    width: '100%',
    position: 'relative',
  },
  passwordIcon: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -16 }], // Adjust -12 based on the icon's height
  },
  iconImage: {
    width: 25,
    height: 20,
    tintColor: '#6B4E31',
  },
  loginButton: {
    width: '100%',
    padding: 12,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  loginButtonLoading: {
    backgroundColor: '#FFD700',
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#6B4E31',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
  loginText: {
    marginTop: 15,
    fontSize: 14,
    textAlign: 'center',
    color: '#6B4E31',
    fontFamily: 'Roboto',
  },
  signUpLinkButton: {
    color: '#FFD700',
    textDecorationLine: 'underline',
    fontFamily: 'Roboto',
  },
});

export default LoginPage;