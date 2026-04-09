const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  sr_no: { type: String, required: false },
  date: { type: String, required: true },
  vendor_name: { type: String, required: true },
  particular: { type: String, required: true },
  unit: { type: Number, required: true, default: 1 },
  total: { type: Number, required: true, default: 0 },
  payment_through: { type: String, required: false },
  payment_by: { type: String, required: false },
  custom_fields: { type: mongoose.Schema.Types.Mixed, default: {} },
  user_id: { type: String, required: true, default: 'user1' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Add indexes for better performance
investmentSchema.index({ user_id: 1 });
investmentSchema.index({ date: -1 });
investmentSchema.index({ vendor_name: 1 });

module.exports = mongoose.model('Investment', investmentSchema);
