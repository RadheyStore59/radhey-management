const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  invoice_number: { type: String, required: true },
  radhey_invoice: { type: String, required: false },
  order_date: { type: String, required: true },
  order_taken_date: { type: String, required: false },
  order_ready_date: { type: String, required: false },
  product_name: { type: String, required: true },
  customer_name: { type: String, required: true },
  dealer_name: { type: String, required: false },
  phone_no: { type: String, required: false },
  reference: { type: String, required: false },
  phase: { type: String, required: false, default: 'Order Taken' },
  deal: { type: String, required: false },
  dispatch_date: { type: String, required: false },
  quantity: { type: Number, required: true, default: 1 },
  buy_price: { type: Number, required: true, default: 0 },
  sell_price: { type: Number, required: true, default: 0 },
  profit: { type: Number, required: true, default: 0 },
  payment_by: { type: String, required: false },
  payment_through: { type: String, required: false },
  received_through_client: { type: String, required: false },
  profit_given: { type: String, required: false, default: '' },
  remarks: { type: String, required: false },
  custom_fields: { type: mongoose.Schema.Types.Mixed, default: {} },
  user_id: { type: String, required: true, default: 'user1' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Add indexes for better performance
saleSchema.index({ user_id: 1 });
saleSchema.index({ order_date: -1 });
saleSchema.index({ invoice_number: 1 });

module.exports = mongoose.model('Sale', saleSchema);
