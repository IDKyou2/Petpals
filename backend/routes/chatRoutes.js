const express = require("express");
const Chat = require("../models/Chat");
const PrivateChat = require("../models/PrivateChat");
const User = require("../models/User");
const path = require("path");
const router = express.Router();

// ============================================= Existing global chat routes...
router.get("/messages", async (req, res) => {
  try {
    const messages = await Chat.find().sort({ createdAt: 1 });
    const messagesWithProfilePics = await Promise.all(
      messages.map(async (msg) => {
        const user = await User.findOne({ fullName: msg.from });
        return {
          ...msg._doc,
          profilePic: user
            ? user.profilePic
              ? `/uploads/${path.basename(user.profilePic)}`
              : "/uploads/default-user.png"
            : "/uploads/default-user.png",
        };
      })
    );
    res.json(messagesWithProfilePics);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/new-chats-count", async (req, res) => {
  try {
    const count = await Chat.countDocuments();
    res.json({ newChatsCount: count });
  } catch (err) {
    console.error("Error fetching new chats count:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/messages", async (req, res) => {
  try {
    const { from, text, timestamp } = req.body;
    const newMessage = new Chat({ from, text, timestamp });
    await newMessage.save();
    const allMessages = await Chat.find().sort({ createdAt: 1 });
    const messagesWithProfilePics = await Promise.all(
      allMessages.map(async (msg) => {
        const user = await User.findOne({ fullName: msg.from });
        return {
          ...msg._doc,
          profilePic: user
            ? user.profilePic
              ? `/uploads/${path.basename(user.profilePic)}`
              : "/uploads/default-user.png"
            : "/uploads/default-user.png",
        };
      })
    );
    const messageCount = await Chat.countDocuments();
    req.io.emit("receive_forum_message", {
      messages: messagesWithProfilePics,
      count: messageCount,
    });
    res.status(201).json(newMessage);
  } catch (err) {
    console.error("Error saving message from 5500:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================= New private chat routes
router.get("/private-messages/:userFullName", async (req, res) => {
  try {
    const { userFullName } = req.params;
    const messages = await PrivateChat.find({
      $or: [{ from: userFullName }, { to: userFullName }],
    }).sort({ createdAt: 1 });
    const messagesWithProfilePics = await Promise.all(
      messages.map(async (msg) => {
        const user = await User.findOne({ fullName: msg.from });
        return {
          ...msg._doc,
          profilePic: user
            ? user.profilePic
              ? `/uploads/${path.basename(user.profilePic)}`
              : "/uploads/default-user.png"
            : "/uploads/default-user.png",
        };
      })
    );
    res.json(messagesWithProfilePics);
  } catch (err) {
    console.error("Error fetching private messages:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/private-messages", async (req, res) => {
  try {
    const { from, to, text, timestamp } = req.body;
    const newMessage = new PrivateChat({ from, to, text, timestamp });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    console.error("Error saving private message:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "fullName profilePic");
    const usersWithProfilePics = users.map((user) => ({
      fullName: user.fullName,
      profilePic: user.profilePic
        ? `/uploads/${path.basename(user.profilePic)}`
        : "/uploads/default-user.png",
    }));
    res.json(usersWithProfilePics);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
