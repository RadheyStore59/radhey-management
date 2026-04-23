const mongoose = require('mongoose');

const formFieldSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, enum: ['text', 'number', 'date', 'textarea', 'select'], default: 'text' },
  required: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },
  placeholder: { type: String, default: '' },
  options: { type: [String], default: [] },
  order: { type: Number, default: 0 },
}, { _id: false });

const formConfigSchema = new mongoose.Schema({
  module: {
    type: String,
    required: true,
    enum: ['leads', 'sales', 'investments', 'gst', 'courier', 'stock'],
    unique: true,
    index: true,
  },
  fields: { type: [formFieldSchema], default: [] },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('FormConfig', formConfigSchema);
