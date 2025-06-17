import { useState, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";
import { Platform } from "react-native";

const SERVER_URL =
  Platform.OS === "android" ? "http://192.168.1.24:5000" : "http://192.168.1.24:5000";

const useChatCount = () => {
  const [newChatsCount, setNewChatsCount] = useState(0);

  useEffect(() => {
    const socketConnection = io(SERVER_URL, {
      transports: ["websocket"],
    });

    socketConnection.on("connect", () => {
      console.log("Socket.IO connected for chat count:", socketConnection.id);
    });

    socketConnection.on("connect_error", (err) => {
      console.error("Socket.IO connection error for chat count:", err.message);
    });

    socketConnection.on("receive_forum_message", ({ count }) => {
      console.log("Received chat count update:", count);
      setNewChatsCount(count);
    });

    return () => {
      socketConnection.disconnect();
      console.log("Socket.IO disconnected for chat count");
    };
  }, []);

  useEffect(() => {
    const fetchNewChatsCount = async () => {
      try {
        const response = await axios.get(
          `${SERVER_URL}/api/chat/new-chats-count`
        );
        console.log("Initial chat count fetched:", response.data.newChatsCount);
        setNewChatsCount(response.data.newChatsCount);
      } catch (error) {
        console.error(
          "Error fetching new chats count:",
          error.response?.data || error.message
        );
      }
    };

    fetchNewChatsCount();
  }, []);

  return newChatsCount;
};

export default useChatCount;
