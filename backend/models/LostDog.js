const mongoose = require("mongoose");

const lostDogSchema = new mongoose.Schema({
  petId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  breed: { type: String, required: true },
  size: { type: String, required: true },
  gender: { type: String, required: true },
  location: { type: String, required: true },
  details: { type: String },
  imagePath: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  isNew: { type: Boolean, default: true },
  postType: { type: String, default: "lost" },
  reunited: { type: Boolean, default: false },
  category: { type: String, enum: ["Lost", "Found"], default: "Lost" },
  archived: { type: Boolean, default: false },
});

const LostDog = mongoose.model("LostDog", lostDogSchema);
module.exports = LostDog;
