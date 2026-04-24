const mongoose = require('mongoose');

const calendarEntrySchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 255
  },
  description: {
    type: String,
    default: ''
  },
  entry_date: {
    type: Date,
    required: true
  },
  reminder_time: {
    type: Date,
    required: true
  },
  reminder_type: {
    type: String,
    enum: ['on_day', '1_day_before', '1_hour_before', 'custom'],
    default: 'on_day'
  },
  category: {
    type: String,
    enum: ['meeting', 'followup', 'task', 'reminder'],
    default: 'reminder'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'done', 'snoozed'],
    default: 'pending'
  },
  snoozed_until: {
    type: Date,
    default: null
  },
  email_sent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
calendarEntrySchema.index({ user_id: 1, entry_date: 1 });
calendarEntrySchema.index({ user_id: 1, reminder_time: 1, status: 1 });

module.exports = mongoose.model('CalendarEntry', calendarEntrySchema);
