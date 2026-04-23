const mongoose = require('mongoose');

const stockItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, trim: true, unique: true },
  description: { type: String, required: false, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true, trim: true },
  purchase_price: { type: Number, required: true, min: 0 },
  category_id: { type: String, required: true },
  brand_id: { type: String, required: true },
  dealer_id: { type: String, required: true },
  date_received: { type: Date, required: true },
  expiry_date: { type: Date, required: false },
  notes: { type: String, required: false, trim: true },
  user_id: { type: String, required: true, default: 'user1' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Add indexes for better performance
stockItemSchema.index({ user_id: 1 });
stockItemSchema.index({ name: 1 });
stockItemSchema.index({ sku: 1 });
stockItemSchema.index({ category_id: 1 });
stockItemSchema.index({ brand_id: 1 });
stockItemSchema.index({ dealer_id: 1 });
stockItemSchema.index({ date_received: -1 });

module.exports = mongoose.model('StockItem', stockItemSchema);
