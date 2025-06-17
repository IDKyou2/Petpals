import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginPage from "../LoginPage";

const ProtectedRoute = ({
  component: Component,
  onSignUpClick,
  onLoginSuccess,
  navigateToAdminDashBoard,
  ...props
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authTrigger, setAuthTrigger] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const user = await AsyncStorage.getItem("user");
        if (token && user) {
          const parsedUser = JSON.parse(user);
          setIsAuthenticated(true);
          setIsAdmin(parsedUser.role === "admin" && parsedUser.username === "admin123");
        } else {
          setIsAuthenticated(false);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    };
    checkAuth();
  }, [authTrigger]);

  // Listen for login success to trigger re-authentication
  const wrappedOnLoginSuccess = (isAdminLogin, callback) => {
    onLoginSuccess(isAdminLogin, callback);
    setAuthTrigger((prev) => prev + 1); 
  };

  if (isAuthenticated === null) {
    return null;
  }

  if (Component.name === "AdminDashBoard" && !isAdmin) {
    return (
      <LoginPage
        onSignUpClick={onSignUpClick}
        onLoginSuccess={wrappedOnLoginSuccess}
        navigateToAdminDashBoard={navigateToAdminDashBoard}
      />
    );
  }

  return isAuthenticated ? (
    <Component {...props} />
  ) : (
    <LoginPage
      onSignUpClick={onSignUpClick}
      onLoginSuccess={wrappedOnLoginSuccess}
      navigateToAdminDashBoard={navigateToAdminDashBoard}
    />
  );
};

export default ProtectedRoute;