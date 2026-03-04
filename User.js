const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  telegramId: { type: String, unique: true, required: true },
  name: String,
  balance: { type: Number, default: 0 },
  referralCount: { type: Number, default: 0 },
  referralEarnings: { type: Number, default: 0 },
  referredBy: { type: String, default: null } // কে রেফার করেছে তার আইডি
});

module.exports = mongoose.model('User', UserSchema);
