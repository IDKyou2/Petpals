const mongoose = require("mongoose");

const petIdCounterSchema = new mongoose.Schema({
  nextPetId: { type: Number, required: true, default: 1 },
});

const PetIdCounter = mongoose.model("PetIdCounter", petIdCounterSchema);
module.exports = PetIdCounter;
