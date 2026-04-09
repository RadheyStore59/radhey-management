const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // Keep this as a separate string id because all your existing app data uses `user_id: 'user1'`
    id: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ['Admin', 'Staff'], default: 'Staff' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

module.exports = mongoose.model('User', userSchema);

