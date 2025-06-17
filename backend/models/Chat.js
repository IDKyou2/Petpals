const mongoose = require("mongoose");
const chatSchema = new mongoose.Schema(
  {
    from: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: String, required: true },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Chat", chatSchema);
