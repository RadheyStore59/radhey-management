const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  lead_date: { type: String, required: true },
  contact_name: { type: String, required: true },
  phone_no: { type: String, required: false },
  email: { type: String, required: false },
  address: { type: String, required: false },
  company_name: { type: String, required: false },
  lead_source: { type: String, required: false },
  product_requirement: { type: String, required: false },
  quantity: { type: Number, required: false },
  budget: { type: Number, required: false },
  budget_per_piece: { type: Number, required: false },
  customization: { type: String, required: false },
  status: { type: String, required: true, default: 'New' },
  last_follow_up: { type: String, required: false },
  next_action: { type: String, required: false },
  notes: { type: String, required: false },
  custom_fields: { type: mongoose.Schema.Types.Mixed, default: {} },
  user_id: { type: String, required: true, default: 'user1' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Add indexes for better performance
leadSchema.index({ user_id: 1 });
leadSchema.index({ lead_date: -1 });
leadSchema.index({ status: 1 });

module.exports = mongoose.model('Lead', leadSchema);
