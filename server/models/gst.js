const mongoose = require('mongoose');

const gstSchema = new mongoose.Schema({
  filing_month: { type: String, required: true },
  filing_year: { type: String, required: true },
  turnover: { type: String, required: false },
  tax_paid: { type: String, required: false },
  due_date: { type: String, required: false },
  filing_date: { type: String, required: false },
  status: { type: String, required: true, default: 'Pending' },
  remarks: { type: String, required: false },
  custom_fields: { type: mongoose.Schema.Types.Mixed, default: {} },
  user_id: { type: String, required: true, default: 'user1' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

gstSchema.index({ filing_year: 1, filing_month: 1 });

module.exports = mongoose.model('Gst', gstSchema);
