const express = require("express");
const LostDog = require("../models/LostDog");
const FoundDog = require("../models/FoundDog");
const router = express.Router();
const path = require("path");
const fs = require("fs");

// =================== Get all non-reunited, non-archived lost and found dogs
router.get("/all-non-reunited-dogs", async (req, res) => {
    try {
        const lostDogs = await LostDog.find(
            { reunited: false, archived: false },
            "petId name breed gender size imagePath location details userId category"
        ).populate("userId", "fullName contact");

        const foundDogs = await FoundDog.find(
            { reunited: false, archived: false },
            "petId breed gender size imagePath location details userId category"
        ).populate("userId", "fullName contact");

        const allDogs = [
            ...lostDogs.map(dog => ({
                _id: dog._id,
                petId: dog.petId,
                name: dog.name || "N/A",
                breed: dog.breed,
                gender: dog.gender,
                size: dog.size,
                imagePath: dog.imagePath || null,
                location: dog.location,
                details: dog.details || "",
                userId: dog.userId,
                category: dog.category || "Lost",
            })),
            ...foundDogs.map(dog => ({
                _id: dog._id,
                petId: dog.petId,
                name: dog.name || "N/A",
                breed: dog.breed,
                gender: dog.gender,
                size: dog.size,
                imagePath: dog.imagePath || null,
                location: dog.location,
                details: dog.details || "",
                userId: dog.userId,
                category: dog.category || "Found",
            })),
        ];

        res.status(200).json(allDogs);
    } catch (error) {
        console.error("Error fetching non-reunited dogs:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// =================== Get total count of non-reunited dogs
router.get("/total-non-reunited-dogs", async (req, res) => {
    try {
        const lostDogCount = await LostDog.countDocuments({ reunited: false, archived: false });
        const foundDogCount = await FoundDog.countDocuments({ reunited: false, archived: false });
        const totalNonReunitedDogs = lostDogCount + foundDogCount;
        res.status(200).json({ totalNonReunitedDogs });
    } catch (error) {
        console.error("Error fetching total non-reunited dogs:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// =================== Delete an unclaimed dog (Lost or Found) by ID
router.delete("/unclaimeddog/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Check if the dog is a LostDog
        let dog = await LostDog.findById(id);
        let dogType = "lost";

        if (!dog) {
            // If not found in LostDog, check FoundDog
            dog = await FoundDog.findById(id);
            dogType = "found";
            if (!dog) {
                return res.status(404).json({ message: "Dog not found" });
            }
        }

        // Delete associated image if it exists
        if (dog.imagePath) {
            const imagePath = path.join(__dirname, "../../Uploads", dog.imagePath);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log(`Deleted ${dogType} dog image:`, imagePath);
            }
        }

        // Delete the dog from the database
        await dog.deleteOne();

        // Emit socket event for real-time update
        req.io.emit(`${dogType}DogDeleted`, { id });

        res.status(200).json({ message: `${dogType.charAt(0).toUpperCase() + dogType.slice(1)} dog deleted successfully` });
    } catch (error) {
        console.error("Error deleting unclaimed dog:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;