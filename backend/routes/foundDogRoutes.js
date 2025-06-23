const express = require("express");
const FoundDog = require("../models/FoundDog");
const Stats = require("../models/Stats");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const PetIdCounter = require("../models/PetIdCounter");

const foundDogsDir = path.join(__dirname, "../../Uploads/foundDogs");
if (!fs.existsSync(foundDogsDir)) {
  fs.mkdirSync(foundDogsDir, { recursive: true });
}

router.post("/founddog", async (req, res) => {
  console.log("Request Headers:", req.headers);
  console.log("Request Body:", req.body);
  console.log("Request Files:", req.files);

  const { breed, size, gender, location, details } = req.body;

  if (!breed || !size || !gender || !location) {
    console.log("Missing required fields:", { breed, size, gender, location });
    return res
      .status(400)
      .json({ message: "All fields except details are required!" });
  }

  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      console.log("No token provided");
      return res.status(401).json({ message: "No token provided!" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);
    const userId = decoded.userId;

    // Check for recent submission (within 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentSubmission = await FoundDog.findOne({
      userId,
      createdAt: { $gte: fiveMinutesAgo },
    });
    if (recentSubmission) {
      console.log("Recent submission detected:", recentSubmission);
      return res
        .status(429)
        .json({
          message: "Please wait before submitting another found dog report. You are trying to spam...",
        });
    }

    const petIdCounter = await PetIdCounter.findOneAndUpdate(
      {},
      { $inc: { nextPetId: 1 } },
      { new: true, upsert: true }
    );
    const petId = petIdCounter.nextPetId;

    let imagePath = null;
    if (req.files && req.files.dogImage) {
      const file = req.files.dogImage;
      console.log("File Details:", {
        name: file.name,
        mimetype: file.mimetype,
        size: file.size,
      });

      const validImageTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!validImageTypes.includes(file.mimetype)) {
        console.log("Invalid file type:", file.mimetype);
        return res.status(400).json({
          message: "Invalid file type. Only PNG, JPEG, and JPG are allowed.",
        });
      }

      if (file.size > 10 * 1024 * 1024) {
        console.log("File size too large:", file.size);
        return res
          .status(400)
          .json({ message: "File size exceeds 10MB limit." });
      }

      // Determine file extension based on MIME type
      let fileExtension = "jpg";
      if (file.mimetype === "image/png") {
        fileExtension = "png";
      } else if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") {
        fileExtension = "jpg";
      }

      const filename = `${Date.now()}-${file.name}`;
      imagePath = `/Uploads/foundDogs/${filename}`;
      const fullPath = path.join(
        __dirname,
        "../../Uploads/foundDogs",
        filename
      );

      console.log("Attempting to save image to piątek, 192.168.1.6:5000/api/founddog", fullPath);
      await file.mv(fullPath);
      console.log("Image successfully saved to:", fullPath);
    } else {
      console.log(
        "No dogImage file received in req.files. Proceeding without image."
      );

    }

    const foundDogProfile = new FoundDog({
      petId,
      breed,
      size,
      gender,
      location,
      details: details || undefined,
      imagePath: imagePath || undefined,
      userId,
      isNew: true,
      postType: "found",
      reunited: false,
      category: "Found",
      archived: false,
    });

    const savedFoundDog = await foundDogProfile.save();
    console.log("Saved Found Dog:", savedFoundDog);

    req.io.emit("newFoundDog", savedFoundDog);

    res.status(201).json({
      message: "Found dog profile created successfully!",
      foundDog: savedFoundDog,
      imageStatus: imagePath
        ? "Image uploaded successfully"
        : "No image uploaded",
    });
  } catch (error) {
    console.error("Error saving found dog profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/founddog", async (req, res) => {
  try {
    const foundDogs = await FoundDog.find()
      .populate("userId", "fullName contact")
      .exec();
    res.status(200).json({ foundDogs });
  } catch (error) {
    console.error("Error fetching found dogs:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/total-founddogs", async (req, res) => {
  try {
    const totalFoundDogs = await FoundDog.countDocuments({ postType: "found" });
    res.status(200).json({ totalFoundDogs });
  } catch (error) {
    console.error("Error fetching total found dogs:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/all-found-dogs", async (req, res) => {
  try {
    const foundDogs = await FoundDog.find(
      {},
      "petId breed gender size imagePath location details userId category"
    ).populate("userId", "fullName contact");
    res.status(200).json(foundDogs);
  } catch (error) {
    console.error("Error fetching found dogs:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/founddog/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const dog = await FoundDog.findById(id);
    if (!dog) {
      return res.status(404).json({ message: "Found dog not found" });
    }
    if (dog.imagePath) {
      const imagePath = path.join(__dirname, "../../Uploads", dog.imagePath);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log("Deleted found dog image:", imagePath);
      }
    }
    await dog.deleteOne();
    req.io.emit("foundDogDeleted", { id });
    res.status(200).json({ message: "Found dog deleted successfully" });
  } catch (error) {
    console.error("Error deleting found dog:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.delete("/delete-match", async (req, res) => {
  const { petId1, petId2 } = req.body;
  try {
    const deletedDog1 = await FoundDog.findOneAndDelete({ petId: petId1 });
    const deletedDog2 = await FoundDog.findOneAndDelete({ petId: petId2 });
    if (!deletedDog1 || !deletedDog2) {
      return res.status(404).json({ message: "One or both dogs not found" });
    }
    if (deletedDog1.imagePath) {
      const imagePath1 = path.join(
        __dirname,
        "../../Uploads",
        deletedDog1.imagePath
      );
      if (fs.existsSync(imagePath1)) {
        fs.unlinkSync(imagePath1);
      }
    }
    if (deletedDog2.imagePath) {
      const imagePath2 = path.join(
        __dirname,
        "../../Uploads",
        deletedDog2.imagePath
      );
      if (fs.existsSync(imagePath2)) {
        fs.unlinkSync(imagePath2);
      }
    }
    const stats = await Stats.findOne();
    if (stats) {
      stats.reunitedCount += 1;
      await stats.save();
    } else {
      const newStats = new Stats({ reunitedCount: 1 });
      await newStats.save();
    }
    res
      .status(200)
      .json({ message: "Both dogs have been deleted successfully!" });
  } catch (error) {
    console.error("Error deleting dogs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.put("/mark-reunited/:petId", async (req, res) => {
  const { petId } = req.params;
  try {
    const foundDog = await FoundDog.findOne({ petId });
    if (!foundDog) {
      return res.status(404).json({ message: "Found dog not found" });
    }
    if (foundDog.reunited) {
      return res
        .status(400)
        .json({ message: "This dog is already marked as reunited" });
    }
    foundDog.reunited = true;
    await foundDog.save();
    const stats = await Stats.findOne();
    if (stats) {
      stats.reunitedCount += 1;
      await stats.save();
    } else {
      const newStats = new Stats({ reunitedCount: 1 });
      await newStats.save();
    }
    res.status(200).json({ message: "Dog marked as reunited", foundDog });
  } catch (error) {
    console.error("Error marking dog as reunited:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/reunited-count", async (req, res) => {
  try {
    const stats = await Stats.findOne();
    if (!stats) {
      return res.status(404).json({ message: "Stats not found" });
    }
    res.status(200).json({ reunitedCount: stats.reunitedCount });
  } catch (error) {
    console.error("Error fetching reunited count:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/archive-unclaimed", async (req, res) => {
  try {
    const twentyThreeDaysAgo = new Date(Date.now() - 23 * 24 * 60 * 60 * 1000);

    const unclaimedDogs = await FoundDog.find({
      createdAt: { $lte: twentyThreeDaysAgo },
      reunited: false,
      archived: false,
    });

    await FoundDog.updateMany(
      { _id: { $in: unclaimedDogs.map((dog) => dog._id) } },
      { $set: { archived: true } }
    );

    res
      .status(200)
      .json({ message: "Unclaimed found dogs archived successfully." });
  } catch (error) {
    console.error("Error archiving unclaimed found dogs:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/restore/:petId", async (req, res) => {
  try {
    const { petId } = req.params;
    const dog = await FoundDog.findOneAndUpdate(
      { petId, archived: true },
      { $set: { archived: false } },
      { new: true }
    );

    if (!dog) {
      return res
        .status(404)
        .json({ message: "Dog not found or already restored." });
    }

    res.status(200).json({ message: "Dog restored successfully.", dog });
  } catch (error) {
    console.error("Error restoring found dog:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// New endpoint: Get all reunited found dogs
router.get("/all-reunited-dogs", async (req, res) => {
  try {
    const reunitedFoundDogs = await FoundDog.find({ reunited: true })
      .populate("userId", "fullName contact");
    res.status(200).json(reunitedFoundDogs);
  } catch (error) {
    console.error("Error fetching reunited dogs:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// New endpoint: Delete a reunited found dog
router.delete("/delete-reunited/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const dog = await FoundDog.findById(id);
    if (!dog) {
      return res.status(404).json({ message: "Dog not found" });
    }
    if (dog.imagePath) {
      const imagePath = path.join(__dirname, "../../Uploads", dog.imagePath);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    await dog.deleteOne();
    res.status(200).json({ message: "Dog deleted successfully" });
  } catch (error) {
    console.error("Error deleting reunited dog:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/test-upload", (req, res) => {
  console.log("Test Upload Files:", req.files);
  res.json({ files: req.files });
});

module.exports = router;