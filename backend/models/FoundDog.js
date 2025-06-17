const mongoose = require("mongoose");

const foundDogSchema = new mongoose.Schema({
  petId: { type: Number, required: true, unique: true },
  breed: { type: String, required: true },
  size: { type: String, required: true },
  gender: { type: String, required: true },
  location: { type: String, required: true },
  details: { type: String },
  imagePath: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  isNew: { type: Boolean, default: true },
  postType: { type: String, default: "found" },
  reunited: { type: Boolean, default: false },
  category: { type: String, enum: ["Found", "Lost"], default: "Found" },
  archived: { type: Boolean, default: false },
});

const FoundDog = mongoose.model("FoundDog", foundDogSchema);
module.exports = FoundDog;
