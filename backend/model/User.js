const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  tokenVersion: { type: Number, default: 0 },
  walletAddress: { type: String, default: null },  // ✅ 여기 추가됨
  name: { type: String, default: "" },
  bio: { type: String, default: "" },
  profileImage: { type: String, default: "" }
});

module.exports = mongoose.model('User', userSchema);
