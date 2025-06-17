import React, { useState, useEffect } from "react";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoadingScreen from "../../components/LoadingScreen";
import LoginPage from "../../components/LoginPage";
import RegisterForm from "../../components/RegisterForm";
import TermsModal from "../../components/TermsCondition";
import HomePage from "../../components/HomePage";
import UserProfile from "../../components/UserProfile";
import LostDogForm from "../../components/LostDogForm";
import LostDogFormConfirmation from "../../components/LostDogFormConfirmation";
import LostDogPage from "../../components/LostDogPage";
import FoundDogForm from "../../components/FoundDogForm";
import FoundDogFormConfirmation from "../../components/FoundDogFormConfirmation";
import FoundDogPage from "../../components/FoundDogPage";
import MatchPage from "../../components/MatchPage";
import ChatForum from "../../components/ChatForum";
import PrivateChat from "../../components/PrivateChat";
import LostDogPageViewInfo from "../../components/LostDogPageViewInfo";
import FoundDogPageViewInfo from "../../components/FoundDogPageViewInfo";
import MatchPageMoreInfoLost from "../../components/MatchPageMoreInfoLost";
import MatchPageMoreInfoFound from "../../components/MatchPageMoreInfoFound";
import SuggestionsPage from "../../components/SuggestionsPage";
import SuggestionsForm from "../../components/SuggestionsForm";
import AdminDashBoard from "../../components/admin/AdminDashBoard";
import ManageUsersScreen from "../../components/admin/ManageUsers";
import ProfileUserScreen from "../../components/admin/ProfileUser";
import MissingDogs from "../../components/admin/MissingDogs";
import FoundDogs from "../../components/admin/FoundDogs";
import ViewLostDogInfoScreen from "../../components/admin/ViewLostDogInfo";
import ViewFoundDogInfo from "../../components/admin/ViewFoundDogInfo";
import ViewUnclaimedDogs from "../../components/admin/ViewUnclaimedDogs";
import ToViewUnclaimedDogsScreen from "../../components/admin/ToViewUnclaimedDogs";
import ViewReunitedDogs from "../../components/admin/ViewReunitedDogs";
import ToViewReunitedDogInfoScreen from "../../components/admin/ToViewReunitedDogInfo";
import Footer from "../../components/Footer";
import ProtectedRoute from "../../components/utils/ProtectedRoute";

interface FormData {
  name?: string;
  breed: string;
  size: string;
  details: string;
  gender: string;
  location: string;
  image: {
    uri: string;
    type?: string;
    name?: string;
  } | null;
}

interface SuggestionData {
  suggestion: string;
  rating: number;
}

const App = () => {
  const [loading, setLoading] = useState(true);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [isTermsModalVisible, setIsTermsModalVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<
    | "LoginPage"
    | "HomePage"
    | "UserProfile"
    | "LostDogForm"
    | "LostDogFormConfirmation"
    | "LostDogPage"
    | "FoundDogForm"
    | "FoundDogFormConfirmation"
    | "FoundDogPage"
    | "MatchPage"
    | "ChatForum"
    | "PrivateChat"
    | "LostDogPageViewInfo"
    | "FoundDogPageViewInfo"
    | "MatchPageMoreInfoLost"
    | "MatchPageMoreInfoFound"
    | "SuggestionsPage"
    | "SuggestionsForm"
    | "AdminDashBoard"
    | "ManageUsersScreen"
    | "ProfileUser"
    | "MissingDogs"
    | "FoundDogs"
    | "ViewLostDogInfo"
    | "ViewFoundDogInfo"
    | "ViewUnclaimedDogs"
    | "ToViewUnclaimedDogs"
    | "ViewReunitedDogs"
    | "ToViewReunitedDogInfo"
  >("LoginPage");
  const [formData, setFormData] = useState<FormData | null>(null);
  const [selectedDog, setSelectedDog] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newSuggestion, setNewSuggestion] = useState<SuggestionData | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [unclaimedDogs, setUnclaimedDogs] = useState<any[]>([]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const [token, user] = await AsyncStorage.multiGet(["token", "user"]);
        if (token[1] && user[1]) {
          const userData = JSON.parse(user[1]);
          const isAdminLogin = userData?.role === "admin";
          setIsLoggedIn(true);
          setIsAdmin(isAdminLogin);
          setCurrentScreen(isAdminLogin ? "AdminDashBoard" : "HomePage");
        } else {
          setIsLoggedIn(false);
          setIsAdmin(false);
          setCurrentScreen("LoginPage");
        }
      } catch (error) {
        console.error("Error initializing app:", error);
        setIsLoggedIn(false);
        setIsAdmin(false);
        setCurrentScreen("LoginPage");
      } finally {
        setLoading(false);
      }
    };
    initializeApp();
  }, []);

  const handleFinishLoading = () => {
    setLoading(false);
  };

  const handleSignUpClick = () => {
    setIsTermsModalVisible(true);
  };

  const handleAcceptTerms = () => {
    setIsTermsModalVisible(false);
    setShowRegisterForm(true);
  };

  const handleLoginClick = () => {
    setShowRegisterForm(false);
    setIsLoggedIn(false);
    setIsAdmin(false);
    setCurrentScreen("LoginPage");
  };

  const handleLoginSuccess = (isAdminLogin: boolean, callback?: () => void) => {
    setIsLoggedIn(true);
    setIsAdmin(isAdminLogin);
    setCurrentScreen(isAdminLogin ? "AdminDashBoard" : "HomePage");
    if (isAdminLogin && callback) {
      callback(); // Execute navigation callback for admin
    }
  };

  const navigateToProfile = () => {
    setCurrentScreen("UserProfile");
  };

  const navigateToHome = () => {
    setCurrentScreen("HomePage");
    setFormData(null);
    setSelectedDog(null);
    setSelectedUser(null);
    setNewSuggestion(null);
  };

  const navigateToLostDogForm = () => {
    setCurrentScreen("LostDogForm");
    setFormData(null);
  };

  const navigateToFoundDogForm = () => {
    setCurrentScreen("FoundDogForm");
    setFormData(null);
  };

  const navigateToMatchPage = () => {
    setCurrentScreen("MatchPage");
  };

  const navigateToMatchPageMoreInfoLost = (dog: any) => {
    console.log("Setting currentScreen to MatchPageMoreInfoLost");
    setSelectedDog(dog);
    setCurrentScreen("MatchPageMoreInfoLost");
  };

  const navigateToMatchPageMoreInfoFound = (dog: any) => {
    console.log("Setting currentScreen to MatchPageMoreInfoFound");
    setSelectedDog(dog);
    setCurrentScreen("MatchPageMoreInfoFound");
  };

  const navigateToLostDogFormConfirmation = (data: FormData) => {
    setFormData(data);
    setCurrentScreen("LostDogFormConfirmation");
  };

  const navigateToFoundDogFormConfirmation = (data: FormData) => {
    setFormData(data);
    setCurrentScreen("FoundDogFormConfirmation");
  };

  const navigateToLostDogPage = () => {
    setCurrentScreen("LostDogPage");
    setFormData(null);
    setSelectedDog(null);
  };

  const navigateToFoundDogPage = () => {
    setCurrentScreen("FoundDogPage");
    setFormData(null);
    setSelectedDog(null);
  };

  const navigateToMatchedPage = () => {
    setCurrentScreen("MatchPage");
    setFormData(null);
    setSelectedDog(null);
  };

  const navigateToChatForum = () => {
    setCurrentScreen("ChatForum");
    setFormData(null);
    setSelectedDog(null);
    setSelectedUser(null);
  };

  const navigateToPrivateChat = (user: any) => {
    setSelectedUser(user);
    setCurrentScreen("PrivateChat");
  };

  const navigateToFoundDogPageViewInfo = (dog: any) => {
    console.log("Setting currentScreen to FoundDogPageViewInfo");
    setSelectedDog(dog);
    setCurrentScreen("FoundDogPageViewInfo");
  };

  const navigateToLostDogPageViewInfo = (dog: any) => {
    setSelectedDog(dog);
    setCurrentScreen("LostDogPageViewInfo");
  };

  const navigateToSuggestionsPage = (data?: SuggestionData) => {
    setNewSuggestion(data || null);
    setCurrentScreen("SuggestionsPage");
    setFormData(null);
    setSelectedDog(null);
    setReloadTrigger((prev) => prev + 1);
  };

  const navigateToSuggestionsForm = () => {
    setCurrentScreen("SuggestionsForm");
    setFormData(null);
    setSelectedDog(null);
  };

  const navigateToAdminDashBoard = () => {
    setCurrentScreen("AdminDashBoard");
    setFormData(null);
    setSelectedDog(null);
    setSelectedUser(null);
    setNewSuggestion(null);
  };

  const navigateToManageUsersScreen = () => {
    if (isAdmin) {
      setCurrentScreen("ManageUsersScreen");
      setFormData(null);
      setSelectedDog(null);
      setSelectedUser(null);
      setNewSuggestion(null);
    } else {
      setCurrentScreen("LoginPage");
    }
  };

  const navigateToProfileUser = (user: any) => {
    if (isAdmin) {
      setSelectedUser(user);
      setCurrentScreen("ProfileUser");
      setFormData(null);
      setSelectedDog(null);
      setNewSuggestion(null);
    } else {
      setCurrentScreen("LoginPage");
    }
  };

  const navigateToMissingDogsScreen = () => {
    if (isAdmin) {
      setCurrentScreen("MissingDogs");
      setFormData(null);
      setSelectedDog(null);
      setSelectedUser(null);
      setNewSuggestion(null);
    } else {
      setCurrentScreen("LoginPage");
    }
  };

  const navigateToFoundDogsScreen = () => {
    if (isAdmin) {
      setCurrentScreen("FoundDogs");
      setFormData(null);
      setSelectedDog(null);
      setSelectedUser(null);
      setNewSuggestion(null);
    } else {
      setCurrentScreen("LoginPage");
    }
  };

  const navigateToViewLostDogInfo = (dog: any) => {
    if (isAdmin) {
      setSelectedDog(dog);
      setCurrentScreen("ViewLostDogInfo");
      setFormData(null);
      setSelectedUser(null);
      setNewSuggestion(null);
    } else {
      setCurrentScreen("LoginPage");
    }
  };

  const navigateToViewFoundDogInfo = (dog: any) => {
    if (isAdmin) {
      setSelectedDog(dog);
      setCurrentScreen("ViewFoundDogInfo");
      setFormData(null);
      setSelectedUser(null);
      setNewSuggestion(null);
    } else {
      setCurrentScreen("LoginPage");
    }
  };

  const navigateToViewUnclaimedDogsScreen = () => {
    if (isAdmin) {
      setCurrentScreen("ViewUnclaimedDogs");
      setFormData(null);
      setSelectedDog(null);
      setSelectedUser(null);
      setNewSuggestion(null);
    } else {
      setCurrentScreen("LoginPage");
    }
  };

  const navigateToToViewUnclaimedDogs = (dog: any) => {
    if (isAdmin) {
      setSelectedDog(dog);
      setCurrentScreen("ToViewUnclaimedDogs");
      setFormData(null);
      setSelectedUser(null);
      setNewSuggestion(null);
    } else {
      setCurrentScreen("LoginPage");
    }
  };

  const navigateToViewReunitedDogsScreen = () => {
    if (isAdmin) {
      setCurrentScreen("ViewReunitedDogs");
      setFormData(null);
      setSelectedDog(null);
      setSelectedUser(null);
      setNewSuggestion(null);
    } else {
      setCurrentScreen("LoginPage");
    }
  };

  const navigateToViewReunitedDogInfo = (dog: any) => {
    if (isAdmin) {
      setSelectedDog(dog);
      setCurrentScreen("ToViewReunitedDogInfo");
      setFormData(null);
      setSelectedUser(null);
      setNewSuggestion(null);
    } else {
      setCurrentScreen("LoginPage");
    }
  };

  const navigateToUserLogin = () => {
    setCurrentScreen("LoginPage");
    setFormData(null);
    setSelectedDog(null);
    setSelectedUser(null);
    setNewSuggestion(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
    AsyncStorage.multiRemove(["token", "user"]);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setCurrentScreen("LoginPage");
    setFormData(null);
    setSelectedDog(null);
    setSelectedUser(null);
    setNewSuggestion(null);
    setReloadTrigger(0);
    AsyncStorage.multiRemove(["token", "user"]);
  };

  return (
    <View style={{ flex: 1 }}>
      {loading ? (
        <LoadingScreen onFinishLoading={handleFinishLoading} />
      ) : showRegisterForm ? (
        <RegisterForm onLoginClick={handleLoginClick} />
      ) : currentScreen === "LoginPage" ? (
        <LoginPage
          onSignUpClick={handleSignUpClick}
          onLoginSuccess={handleLoginSuccess}
          navigateToAdminDashBoard={navigateToAdminDashBoard}
        />
      ) : isLoggedIn ? (
        currentScreen === "HomePage" ? (
          <ProtectedRoute
            component={HomePage}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onBackClick={handleLogout}
            onNavigateToProfile={navigateToProfile}
            onNavigateToLostDogForm={navigateToLostDogForm}
            onNavigateToFoundDogForm={navigateToFoundDogForm}
            onNavigateToLostDogPage={navigateToLostDogPage}
            onNavigateToMatchedPage={navigateToMatchedPage}
            onNavigateToFoundDogPage={navigateToFoundDogPage}
            onNavigateToChatForum={navigateToChatForum}
            onNavigateToSuggestionsPage={navigateToSuggestionsPage}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "UserProfile" ? (
          <ProtectedRoute
            component={UserProfile}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToHome={navigateToHome}
            onLogout={handleLogout}
            onNavigateToChatForum={navigateToChatForum}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "LostDogForm" ? (
          <ProtectedRoute
            component={LostDogForm}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToHome={navigateToHome}
            onNavigateToProfile={navigateToProfile}
            onNavigateToLostDogFormConfirmation={navigateToLostDogFormConfirmation}
            onLogout={handleLogout}
            onNavigateToChatForum={navigateToChatForum}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "LostDogFormConfirmation" ? (
          <ProtectedRoute
            component={LostDogFormConfirmation}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToHome={navigateToHome}
            onNavigateToProfile={navigateToProfile}
            onNavigateToLostDogForm={navigateToLostDogForm}
            formData={formData}
            onNavigateToLostDogPage={navigateToLostDogPage}
            onNavigateToMatchedPage={navigateToMatchedPage}
            onLogout={handleLogout}
            onNavigateToChatForum={navigateToChatForum}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "LostDogPage" ? (
          <ProtectedRoute
            component={LostDogPage}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToHome={navigateToHome}
            onNavigateToProfile={navigateToProfile}
            onLogout={handleLogout}
            onNavigateToMatchedPage={navigateToMatchedPage}
            onNavigateToLostDogForm={navigateToLostDogForm}
            onNavigateToFoundDogPage={navigateToFoundDogPage}
            onNavigateToChatForum={navigateToChatForum}
            onNavigateToLostDogPageViewInfo={navigateToLostDogPageViewInfo}
            onNavigateToSuggestionsPage={navigateToSuggestionsPage}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "FoundDogForm" ? (
          <ProtectedRoute
            component={FoundDogForm}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToHome={navigateToHome}
            onNavigateToProfile={navigateToProfile}
            onNavigateToFoundDogFormConfirmation={navigateToFoundDogFormConfirmation}
            onLogout={handleLogout}
            onNavigateToChatForum={navigateToChatForum}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "FoundDogFormConfirmation" ? (
          <ProtectedRoute
            component={FoundDogFormConfirmation}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToHome={navigateToHome}
            onNavigateToProfile={navigateToProfile}
            onNavigateToFoundDogForm={navigateToFoundDogForm}
            formData={formData}
            onNavigateToFoundDogPage={navigateToFoundDogPage}
            onNavigateToMatchedPage={navigateToMatchedPage}
            onLogout={handleLogout}
            onNavigateToChatForum={navigateToChatForum}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "FoundDogPage" ? (
          <ProtectedRoute
            component={FoundDogPage}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToHome={navigateToHome}
            onNavigateToProfile={navigateToProfile}
            onLogout={handleLogout}
            onNavigateToMatchedPage={navigateToMatchedPage}
            onNavigateToFoundDogForm={navigateToFoundDogForm}
            onNavigateToLostDogPage={navigateToLostDogPage}
            onNavigateToChatForum={navigateToChatForum}
            onNavigateToFoundDogPageViewInfo={navigateToFoundDogPageViewInfo}
            onNavigateToSuggestionsPage={navigateToSuggestionsPage}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "MatchPage" ? (
          <ProtectedRoute
            component={MatchPage}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToHome={navigateToHome}
            onNavigateToProfile={navigateToProfile}
            onLogout={handleLogout}
            onNavigateToLostDogPage={navigateToLostDogPage}
            onNavigateToFoundDogPage={navigateToFoundDogPage}
            onNavigateToChatForum={navigateToChatForum}
            onNavigateToLostDogPageViewInfo={navigateToLostDogPageViewInfo}
            onNavigateToMatchPageMoreInfoLost={navigateToMatchPageMoreInfoLost}
            onNavigateToMatchPageMoreInfoFound={navigateToMatchPageMoreInfoFound}
            onNavigateToSuggestionsPage={navigateToSuggestionsPage}
            onNavigateToSuggestionsForm={navigateToSuggestionsForm}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "ChatForum" ? (
          <ProtectedRoute
            component={ChatForum}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToHome={navigateToHome}
            onNavigateToProfile={navigateToProfile}
            onNavigateToLostDogPage={navigateToLostDogPage}
            onNavigateToFoundDogPage={navigateToFoundDogPage}
            onNavigateToMatchedPage={navigateToMatchedPage}
            onLogout={handleLogout}
            onNavigateToChatForum={navigateToChatForum}
            onNavigateToPrivateChat={navigateToPrivateChat}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "PrivateChat" ? (
          <ProtectedRoute
            component={PrivateChat}
            user={selectedUser}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToHome={navigateToHome}
            onNavigateToProfile={navigateToProfile}
            onNavigateToChatForum={navigateToChatForum}
            onLogout={handleLogout}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "LostDogPageViewInfo" ? (
          <ProtectedRoute
            component={LostDogPageViewInfo}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToHome={navigateToHome}
            onNavigateToProfile={navigateToProfile}
            onNavigateToLostDogPage={navigateToLostDogPage}
            onLogout={handleLogout}
            onNavigateToChatForum={navigateToChatForum}
            dog={selectedDog}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "FoundDogPageViewInfo" ? (
          <ProtectedRoute
            component={FoundDogPageViewInfo}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToHome={navigateToHome}
            onNavigateToProfile={navigateToProfile}
            onNavigateToFoundDogPage={navigateToFoundDogPage}
            onLogout={handleLogout}
            onNavigateToChatForum={navigateToChatForum}
            dog={selectedDog}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "MatchPageMoreInfoLost" ? (
          <ProtectedRoute
            component={MatchPageMoreInfoLost}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToHome={navigateToHome}
            onNavigateToProfile={navigateToProfile}
            onNavigateToMatchPage={navigateToMatchPage}
            onLogout={handleLogout}
            onNavigateToChatForum={navigateToChatForum}
            dog={selectedDog}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "MatchPageMoreInfoFound" ? (
          <ProtectedRoute
            component={MatchPageMoreInfoFound}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToHome={navigateToHome}
            onNavigateToProfile={navigateToProfile}
            onNavigateToMatchPage={navigateToMatchPage}
            onLogout={handleLogout}
            onNavigateToChatForum={navigateToChatForum}
            dog={selectedDog}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "SuggestionsPage" ? (
          <ProtectedRoute
            component={SuggestionsPage}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToHome={navigateToHome}
            onNavigateToProfile={navigateToProfile}
            onNavigateToLostDogPage={navigateToLostDogPage}
            onNavigateToFoundDogPage={navigateToFoundDogPage}
            onNavigateToMatchedPage={navigateToMatchedPage}
            onNavigateToChatForum={navigateToChatForum}
            onLogout={handleLogout}
            reloadTrigger={reloadTrigger}
            newSuggestion={newSuggestion}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "SuggestionsForm" ? (
          <ProtectedRoute
            component={SuggestionsForm}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToHome={navigateToHome}
            onNavigateToProfile={navigateToProfile}
            onNavigateToLostDogPage={navigateToLostDogPage}
            onNavigateToFoundDogPage={navigateToFoundDogPage}
            onNavigateToChatForum={navigateToChatForum}
            onNavigateToSuggestionsPage={navigateToSuggestionsPage}
            onBackClick={handleLogout}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "AdminDashBoard" ? (
          <ProtectedRoute
            component={AdminDashBoard}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToAdminDashBoard={navigateToAdminDashBoard}
            onNavigateToUserLogin={navigateToUserLogin}
            onNavigateToManageUsersScreen={navigateToManageUsersScreen}
            onNavigateToMissingDogsScreen={navigateToMissingDogsScreen}
            onNavigateToFoundDogsScreen={navigateToFoundDogsScreen}
            onNavigateToViewUnclaimedDogsScreen={navigateToViewUnclaimedDogsScreen}
            onNavigateToViewReunitedDogsScreen={navigateToViewReunitedDogsScreen}
            onLogout={handleLogout}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "ManageUsersScreen" ? (
          <ProtectedRoute
            component={ManageUsersScreen}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToAdminDashBoard={navigateToAdminDashBoard}
            onNavigateToProfileUser={navigateToProfileUser}
            onLogout={handleLogout}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "ProfileUser" ? (
          <ProtectedRoute
            component={ProfileUserScreen}
            user={selectedUser}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToManageUsersScreen={navigateToManageUsersScreen}
            onLogout={handleLogout}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "MissingDogs" ? (
          <ProtectedRoute
            component={MissingDogs}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToAdminDashBoard={navigateToAdminDashBoard}
            onNavigateToViewLostDogInfo={navigateToViewLostDogInfo}
            onLogout={handleLogout}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "FoundDogs" ? (
          <ProtectedRoute
            component={FoundDogs}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToAdminDashBoard={navigateToAdminDashBoard}
            onNavigateToViewFoundDogInfo={navigateToViewFoundDogInfo}
            onLogout={handleLogout}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "ViewLostDogInfo" ? (
          <ProtectedRoute
            component={ViewLostDogInfoScreen}
            dog={selectedDog}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateBack={navigateToMissingDogsScreen}
            onLogout={handleLogout}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "ViewFoundDogInfo" ? (
          <ProtectedRoute
            component={ViewFoundDogInfo}
            dog={selectedDog}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateBack={navigateToFoundDogsScreen}
            onLogout={handleLogout}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "ViewUnclaimedDogs" ? (
          <ProtectedRoute
            component={ViewUnclaimedDogs}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToAdminDashBoard={navigateToAdminDashBoard}
            onNavigateToViewUnclaimedDogInfo={navigateToToViewUnclaimedDogs}
            onLogout={handleLogout}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "ToViewUnclaimedDogs" ? (
          <ProtectedRoute
            component={ToViewUnclaimedDogsScreen}
            dog={selectedDog}
            dogs={unclaimedDogs}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateBack={navigateToViewUnclaimedDogsScreen}
            onNavigateToDogInfo={navigateToViewLostDogInfo}
            onLogout={handleLogout}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "ViewReunitedDogs" ? (
          <ProtectedRoute
            component={ViewReunitedDogs}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToAdminDashBoard={navigateToAdminDashBoard}
            onNavigateToViewReunitedDogInfo={navigateToViewReunitedDogInfo}
            onLogout={handleLogout}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : currentScreen === "ToViewReunitedDogInfo" ? (
          <ProtectedRoute
            component={ToViewReunitedDogInfoScreen}
            dog={selectedDog}
            onSignUpClick={handleSignUpClick}
            onLoginSuccess={handleLoginSuccess}
            onNavigateBack={navigateToViewReunitedDogsScreen}
            onLogout={handleLogout}
            navigateToAdminDashBoard={navigateToAdminDashBoard}
          />
        ) : null
      ) : (
        <LoginPage
          onSignUpClick={handleSignUpClick}
          onLoginSuccess={handleLoginSuccess}
          navigateToAdminDashBoard={navigateToAdminDashBoard}
        />
      )}
      <TermsModal
        visible={isTermsModalVisible}
        onClose={() => setIsTermsModalVisible(false)}
        onAccept={handleAcceptTerms}
      />
    </View>
  );
};

export default App;