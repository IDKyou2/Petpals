const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

// Enhanced Login Route
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Validate input
    if (!username.trim() || !password.trim()) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required."
      });
    }

    // Find user with case-insensitive search
    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Incorrect username or password."
      });
    }

    // Check if user is banned
    if (user.banned) {
      return res.status(403).json({
        success: false,
        message: "Your account has been banned for violating our policy. Any disrepectful actions will not be tolerated. Please contact support."
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials."
      });
    }

    // Create JWT token with expiration
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        fullName: user.fullName,
        profilePic: user.profilePic
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
   

    // Successful login response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during login. Try again later.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;