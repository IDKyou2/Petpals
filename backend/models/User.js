const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contact: { type: String, required: true },
  password: { type: String, required: true },
  profilePic: { type: String, default: "" },
  banned: { type: Boolean, default: false },  
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
