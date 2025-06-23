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
  console.log("Request body:", req.body);
  console.log("Request files:", req.files);

  if (
    !username ||
    !fullName ||
    !email ||
    !contact ||
    !password ||
    !confirmPassword ||
    !address
  ) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  if (!req.files || !req.files.profilePic) {
    return res.status(400).json({ message: "Profile picture is required!" });
  }

  if (password !== confirmPassword) {
    return res
      .status(400)
      .json({ message: "Password and confirm password don't match." });
  }

  try {
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      
      if (existingUser) {
        return res
          .status(400)
          .json({
            message: "User already exists. Please change your username or email.",
          });
      }
  
    const hashedPassword = await bcrypt.hash(password, 10);
    const file = req.files.profilePic;
    const validImageTypes = ["image/png", "image/jpeg"];
    console.log("File received:", file);

    if (!validImageTypes.includes(file.mimetype)) {
      return res
        .status(400)
        .json({ message: "Invalid file type. Only PNG and JPEG are allowed." });
    }

    if (file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ message: "File size exceeds 10MB limit." });
    }

    const uploadDir = path.join(__dirname, "../../Uploads/pictures");
    const filename = `${Date.now()}-${file.name}`;
    const profilePicPath = path.join("Uploads/pictures", filename);

    console.log(
      "Saving file to:",
      path.join(__dirname, "../../Uploads/pictures", filename)
    );
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    await file.mv(path.join(__dirname, "../../Uploads/pictures", filename));
    console.log("Profile picture saved successfully");

    const newUser = new User({
      username,
      fullName,
      email,
      contact,
      password: hashedPassword,
      profilePic: profilePicPath,
      address,
    });

    await newUser.save();
    res.status(201).json({ message: "Account Created!" });
  } catch (error) {
    console.error("Error saving user:", error);
 
    if (error.code === 11000) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    res.status(500).json({ message: "Server error" });
   
  }
});

module.exports = router;
