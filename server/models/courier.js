const mongoose = require('mongoose');

const courierSchema = new mongoose.Schema({
  date: { type: String, required: false },
  vendor_name: { type: String, required: false },
  particular: { type: String, required: false },
  unit: { type: String, required: false },
  total: { type: String, required: false },
  payment_through: { type: String, required: false },
  payment_by: { type: String, required: false },
  status: { type: String, required: true, default: 'Pending' },
  remarks: { type: String, required: false },
  tracking_number: { type: String, required: false },
  courier_company: { type: String, required: false },
  sender_name: { type: String, required: false },
  sender_phone: { type: String, required: false },
  sender_address: { type: String, required: false },
  recipient_name: { type: String, required: false },
  recipient_phone: { type: String, required: false },
  recipient_address: { type: String, required: false },
  shipment_date: { type: String, required: false },
  delivery_date: { type: String, required: false },
  weight: { type: String, required: false },
  cost: { type: String, required: false },
  custom_fields: { type: mongoose.Schema.Types.Mixed, default: {} },
  user_id: { type: String, required: true, default: 'user1' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

courierSchema.index({ tracking_number: 1 });

module.exports = mongoose.model('Courier', courierSchema);
