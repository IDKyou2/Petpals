const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const User = require("../models/User");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../Uploads/pictures");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Registration route to enforce lowercase username
router.post("/register", async (req, res) => {
  const { username, fullName, email, contact, password, address } = req.body;

  // Validate username: check for spaces or capital letters
  if (/\s/.test(username) || /[A-Z]/.test(username)) {
    return res.status(400).json({
      message:
        "Please make sure that the username will accept only small letters with or without numbers, and it has no space",
    });
  }

  // Validate username: only lowercase letters and numbers
  if (!/^[a-z0-9]+$/.test(username)) {
    return res.status(400).json({
      message:
        "Please make sure that the username will accept only small letters with or without numbers, and it has no space",
    });
  }

  try {
    // Check if username or email already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      username,
      fullName,
      email,
      contact,
      password: hashedPassword,
      address: address || "empty",
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/user/profile", upload.single("profilePic"), async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authentication token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const { fullName, contact } = req.body;

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (contact) updateData.contact = contact;
    if (req.file)
      updateData.profilePic = `Uploads/pictures/${req.file.filename}`;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No fields provided to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: {
        fullName: updatedUser.fullName,
        contact: updatedUser.contact,
        profilePic: updatedUser.profilePic
          ? `/Uploads/pictures/${path.basename(updatedUser.profilePic)}`
          : "/Uploads/default-user.png",
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/user/profile", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication token is missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const userData = await User.findById(userId);

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      fullName: userData.fullName,
      contact: userData.contact,
      email: userData.email,
      profilePic: userData.profilePic
        ? `/Uploads/pictures/${path.basename(userData.profilePic)}`
        : "/Uploads/default-user.png",
      address: userData.address,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid userId format" });
  }

  try {
    const user = await User.findById(userId).select(
      "fullName email contact location profilePic address"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ message: "Error fetching user data" });
  }
});

router.get("/total-users", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    res.json({ totalUsers });
  } catch (error) {
    console.error("Error fetching total users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/all-users", async (req, res) => {
  try {
    const users = await User.find(
      {},
      "fullName profilePic contact username email banned address"
    );
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/user/:userId/ban", async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid userId format" });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.banned = !user.banned;
    await user.save();

    res.status(200).json({
      message: user.banned ? "User has been banned" : "User has been unbanned",
      banned: user.banned,
    });
  } catch (error) {
    console.error("Error banning/unbanning user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
