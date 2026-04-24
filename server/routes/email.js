const express = require('express');
const router = express.Router();
const { sendReminderEmail, testEmailConfig } = require('../services/emailService');
const CalendarEntry = require('../models/CalendarEntry');
const User = require('../models/user');

// POST /api/email/send-reminder - Send reminder email
router.post('/send-reminder', async (req, res) => {
  try {
    const { reminderId } = req.body;
    
    // Get the reminder details
    const reminder = await CalendarEntry.findById(reminderId);
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    // Get user details for email
    const user = await User.findOne({ id: reminder.user_id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user has email notifications enabled
    if (!user.emailNotifications?.enabled || !user.emailNotifications?.reminders) {
      return res.json({ 
        success: false, 
        message: 'Email notifications are disabled for this user' 
      });
    }
    
    // Prepare reminder data for email
    const reminderData = {
      title: reminder.title,
      description: reminder.description,
      reminder_time: reminder.reminder_time,
      category: reminder.category,
      priority: reminder.priority,
      userEmail: user.email
    };
    
    // Send the email
    const result = await sendReminderEmail(reminderData);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Reminder email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error 
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to send reminder email' });
  }
});

// POST /api/email/send-all-reminders - Send all due reminders
router.post('/send-all-reminders', async (req, res) => {
  try {
    const now = new Date();
    
    // Get all due reminders
    const dueReminders = await CalendarEntry.find({
      reminder_time: { $lte: now },
      status: { $in: ['pending', 'snoozed'] },
      $or: [
        { snoozed_until: null },
        { snoozed_until: { $lte: now } }
      ]
    }).populate('user_id');
    
    const results = [];
    
    for (const reminder of dueReminders) {
      try {
        // Get user details
        const user = await User.findOne({ id: reminder.user_id });
        
        // Skip if user has email notifications disabled
        if (!user?.emailNotifications?.enabled || !user?.emailNotifications?.reminders) {
          results.push({
            reminderId: reminder._id,
            success: false,
            reason: 'Email notifications disabled'
          });
          continue;
        }
        
        // Prepare reminder data
        const reminderData = {
          title: reminder.title,
          description: reminder.description,
          reminder_time: reminder.reminder_time,
          category: reminder.category,
          priority: reminder.priority,
          userEmail: user.email
        };
        
        // Send email
        const result = await sendReminderEmail(reminderData);
        
        results.push({
          reminderId: reminder._id,
          success: result.success,
          messageId: result.messageId,
          error: result.error
        });
        
      } catch (error) {
        results.push({
          reminderId: reminder._id,
          success: false,
          error: error.message
        });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    res.json({
      message: `Processed ${dueReminders.length} reminders`,
      successful,
      failed,
      results
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to send reminder emails' });
  }
});

// GET /api/email/test-config - Test email configuration
router.get('/test-config', async (req, res) => {
  try {
    const result = await testEmailConfig();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to test email configuration' });
  }
});

module.exports = router;
