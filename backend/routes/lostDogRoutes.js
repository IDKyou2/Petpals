const express = require("express");
const LostDog = require("../models/LostDog");
const Stats = require("../models/Stats");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const PetIdCounter = require("../models/PetIdCounter");

const lostDogsDir = path.join(__dirname, "../../Uploads/lostDogs");
if (!fs.existsSync(lostDogsDir)) {
  fs.mkdirSync(lostDogsDir, { recursive: true });
}

router.post("/lostdog", async (req, res) => {
  console.log("Request Headers:", req.headers);
  console.log("Request Body:", req.body);
  console.log("Request Files:", req.files);

  const { name, breed, size, gender, location, details } = req.body;

  if (!name || !breed || !size || !gender || !location) {
    console.log("Missing required fields:", {
      name,
      breed,
      size,
      gender,
      location,
    });
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
    const recentSubmission = await LostDog.findOne({
      userId,
      createdAt: { $gte: fiveMinutesAgo },
    });
    if (recentSubmission) {
      console.log("Recent submission detected:", recentSubmission);
      return res
        .status(429)
        .json({
          message: "Please wait before submitting another lost dog report.",
        });
    }

    const petIdCounter = await PetIdCounter.findOneAndUpdate(
      {},
      { $inc: { nextPetId: 1 } },
      { new: true, upsert: true }
    );
    const petId = petIdCounter.nextPetId;

    let imagePath;
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

      const filename = `${Date.now()}-${file.name}`;
      imagePath = `/Uploads/lostDogs/${filename}`;
      const fullPath = path.join(__dirname, "../../Uploads/lostDogs", filename);

      console.log("Attempting to save image to:", fullPath);
      try {
        await file.mv(fullPath);
        console.log("Image successfully saved to:", fullPath);
      } catch (mvError) {
        console.error("Error moving file:", mvError);
        return res
          .status(500)
          .json({ message: "Failed to save image", error: mvError.message });
      }
    } else {
      console.log("No dogImage file received in req.files");
    }

    const lostDogProfile = new LostDog({
      petId,
      name,
      breed,
      size,
      gender,
      location,
      details: details || undefined,
      imagePath: imagePath || undefined,
      userId,
      postType: "lost",
      category: "Lost",
    });

    const savedLostDog = await lostDogProfile.save();
    console.log("Saved Lost Dog:", savedLostDog);

    req.io.emit("newLostDog", savedLostDog);

    res.status(201).json({
      message: "Lost dog profile created successfully!",
      lostDog: savedLostDog,
    });
  } catch (error) {
    console.error("Error saving lost dog profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/lostdog", async (req, res) => {
  try {
    const lostDogs = await LostDog.find().populate("userId", "fullName contact").exec();
    res.status(200).json({ lostDogs });
  } catch (error) {
    console.error("Error fetching lost dogs:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/total-lostdogs", async (req, res) => {
  try {
    const totalLostDogs = await LostDog.countDocuments({ postType: "lost" });
    res.status(200).json({ totalLostDogs });
  } catch (error) {
    console.error("Error fetching total lost dogs:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/all-lost-dogs", async (req, res) => {
  try {
    const lostDogs = await LostDog.find(
      {},
      "petId name breed gender size imagePath location details userId category"
    ).populate("userId", "fullName contact");
    res.status(200).json(lostDogs);
  } catch (error) {
    console.error("Error fetching lost dogs:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/lostdog/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const dog = await LostDog.findById(id);
    if (!dog) {
      return res.status(404).json({ message: "Missing dog not found" });
    }
    if (dog.imagePath) {
      const imagePath = path.join(__dirname, "../../Uploads", dog.imagePath);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log("Deleted missing dog image:", imagePath);
      }
    }
    await dog.deleteOne();
    req.io.emit("lostDogDeleted", { id });
    res.status(200).json({ message: "Missing dog deleted successfully" });
  } catch (error) {
    console.error("Error deleting missing dog:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.delete("/delete-match", async (req, res) => {
  const { petId1, petId2 } = req.body;
  try {
    const deletedDog1 = await LostDog.findOneAndDelete({ petId: petId1 });
    const deletedDog2 = await LostDog.findOneAndDelete({ petId: petId2 });
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
    const lostDog = await LostDog.findOne({ petId });
    if (!lostDog) {
      return res.status(404).json({ message: "Lost dog not found" });
    }
    if (lostDog.reunited) {
      return res
        .status(400)
        .json({ message: "This dog is already marked as reunited" });
    }
    lostDog.reunited = true;
    await lostDog.save();
    const stats = await Stats.findOne();
    if (stats) {
      stats.reunitedCount += 1;
      await stats.save();
    } else {
      const newStats = new Stats({ reunitedCount: 1 });
      await newStats.save();
    }
    res.status(200).json({ message: "Dog marked as reunited", lostDog });
  } catch (error) {
    console.error("Error marking dog as reunited:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/reunited-count", async (req, res) => {
  try {
    let stats = await Stats.findOne();
    if (!stats) {
      stats = new Stats({ reunitedCount: 0 });
      await stats.save();
      console.log("Created default Stats document:", stats);
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

    const unclaimedDogs = await LostDog.find({
      createdAt: { $lte: twentyThreeDaysAgo },
      reunited: false,
      archived: false,
    });

    await LostDog.updateMany(
      { _id: { $in: unclaimedDogs.map((dog) => dog._id) } },
      { $set: { archived: true } }
    );

    res
      .status(200)
      .json({ message: "Unclaimed lost dogs archived successfully." });
  } catch (error) {
    console.error("Error archiving unclaimed lost dogs:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/restore/:petId", async (req, res) => {
  try {
    const { petId } = req.params;
    const dog = await LostDog.findOneAndUpdate(
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
    console.error("Error restoring lost dog:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// New endpoint: Get all reunited lost dogs
router.get("/all-reunited-dogs", async (req, res) => {
  try {
    const reunitedLostDogs = await LostDog.find({ reunited: true })
      .populate("userId", "fullName contact");
    res.status(200).json(reunitedLostDogs);
  } catch (error) {
    console.error("Error fetching reunited dogs:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// New endpoint: Delete a reunited lost dog
router.delete("/delete-reunited/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const dog = await LostDog.findById(id);
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