const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const path = require("path");
const fs = require("fs");
const router = express.Router();

router.post("/register", async (req, res) => {
  const {
    username,
    fullName,
    email,
    contact,
    password,
    confirmPassword,
    address,
  } = req.body;

  try {
    // 1. Check for duplicate user
    const existingUser = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Username or email already in use. Please choose another.",
      });
    }

    // 2. Validate and save profile picture
    const file = req.files?.profilePic;
    if (!file) {
      return res.status(400).json({ message: "Profile picture is required." });
    }

    const validImageTypes = ["image/png", "image/jpeg"];
    if (!validImageTypes.includes(file.mimetype)) {
      return res
        .status(400)
        .json({ message: "Invalid image type. Only PNG and JPEG allowed." });
    }

    if (file.size > 10 * 1024 * 1024) {
      return res
        .status(400)
        .json({ message: "Image size exceeds 10MB limit." });
    }

    const uploadDir = path.join(__dirname, "../../Uploads/pictures");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${Date.now()}-${file.name}`;
    const savedPath = path.join(uploadDir, filename);
    const profilePicPath = path.join("Uploads/pictures", filename);

    await file.mv(savedPath);
    console.log("Profile picture uploaded to:", savedPath);

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create user
    const newUser = new User({
      username: username.toLowerCase(),
      fullName,
      email: email.toLowerCase(),
      contact,
      password: hashedPassword,
      profilePic: profilePicPath,
      address,
    });

    await newUser.save();
    return res.status(201).json({ message: "Account created successfully!" });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "User already exists. Please use different credentials." });
    }

    return res
      .status(500)
      .json({ message: "Internal server error. Please try again later." });
  }
});


module.exports = router;
