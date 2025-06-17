const express = require("express");
const Suggestion = require("../models/Suggestion");
const User = require("../models/User");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Route to handle posting a new suggestion
router.post("/suggestions", async (req, res) => {
  const { suggestion, rating } = req.body;

  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided!" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const newSuggestion = new Suggestion({
      suggestion,
      rating,
      userId,
    });

    const savedSuggestion = await newSuggestion.save();
    // Populate the userId field with fullName before sending the response
    const populatedSuggestion = await Suggestion.findById(savedSuggestion._id)
      .populate("userId", "fullName")
      .exec();

    // Emit the new suggestion via Socket.IO
    if (req.io) {
      req.io.emit("newSuggestion", populatedSuggestion);
    }

    res.status(200).json(populatedSuggestion);
  } catch (error) {
    console.error("Error saving suggestion:", error);
    res.status(500).json({ message: "Failed to submit suggestion" });
  }
});

// Route to fetch all suggestions and populate user full name
router.get("/suggestions", async (req, res) => {
  try {
    const suggestions = await Suggestion.find()
      .populate("userId", "fullName")
      .sort({ createdAt: -1 });
    res.status(200).json(suggestions);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res.status(500).json({ message: "Failed to fetch suggestions" });
  }
});

module.exports = router;
