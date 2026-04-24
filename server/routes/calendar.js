const express = require('express');
const router = express.Router();
const CalendarEntry = require('../models/CalendarEntry');
const { requireAuth } = require('../middleware/auth');
const mongoose = require('mongoose');

// Helper function to safely convert string to ObjectId
const toObjectId = (id) => {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (error) {
    return null;
  }
};

// Apply auth middleware to all routes
router.use(requireAuth);

// POST /api/calendar/entry - Create new entry
router.post('/entry', async (req, res) => {
  try {
    const {
      title,
      description,
      entry_date,
      reminder_time,
      reminder_type,
      category,
      priority
    } = req.body;

    // Parse entry_date as local date to avoid timezone shift
    const [entryYear, entryMonth, entryDay] = entry_date.split('T')[0].split('-').map(Number);
    const localEntryDate = new Date(entryYear, entryMonth - 1, entryDay, 0, 0, 0);

    const entry = new CalendarEntry({
      user_id: req.user.id,
      title,
      description: description || '',
      entry_date: localEntryDate,
      reminder_time: new Date(reminder_time),
      reminder_type: reminder_type || 'on_day',
      category: category || 'reminder',
      priority: priority || 'medium'
    });

    await entry.save();
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create calendar entry', details: error.message });
  }
});

// GET /api/calendar/entries - Get all entries for logged-in user
router.get('/entries', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let query = { user_id: req.user.id };
    
    if (start_date || end_date) {
      query.entry_date = {};
      if (start_date) query.entry_date.$gte = new Date(start_date);
      if (end_date) query.entry_date.$lte = new Date(end_date);
    }

    const entries = await CalendarEntry.find(query)
      .sort({ entry_date: 1, reminder_time: 1 });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch calendar entries' });
  }
});

// GET /api/calendar/entries/:date - Get entries for a specific date
router.get('/entries/:date', async (req, res) => {
  try {
    const targetDateStr = req.params.date; // Format: YYYY-MM-DD
    
    // Parse target date as local date
    const [targetYear, targetMonth, targetDay] = targetDateStr.split('-').map(Number);
    
    // Get all entries for this user
    const allUserEntries = await CalendarEntry.find({ user_id: req.user.id });

    // Filter entries by matching local date components
    const entries = allUserEntries.filter(entry => {
      const entryDate = new Date(entry.entry_date);
      const entryYear = entryDate.getFullYear();
      const entryMonth = entryDate.getMonth() + 1; // 0-indexed
      const entryDay = entryDate.getDate();
      
      return entryYear === targetYear && entryMonth === targetMonth && entryDay === targetDay;
    }).sort((a, b) => new Date(a.reminder_time) - new Date(b.reminder_time));

    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch entries for date' });
  }
});

// PUT /api/calendar/entry/:id - Update entry
router.put('/entry/:id', async (req, res) => {
  try {
    const {
      title,
      description,
      entry_date,
      reminder_time,
      reminder_type,
      category,
      priority,
      status,
      snoozed_until
    } = req.body;

    const updateData = {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(entry_date && { entry_date: new Date(entry_date) }),
      ...(reminder_time && { reminder_time: new Date(reminder_time) }),
      ...(reminder_type && { reminder_type }),
      ...(category && { category }),
      ...(priority && { priority }),
      ...(status && { status }),
      ...(snoozed_until !== undefined && { snoozed_until: snoozed_until ? new Date(snoozed_until) : null })
    };

    const entry = await CalendarEntry.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      updateData,
      { new: true }
    );

    if (!entry) {
      return res.status(404).json({ error: 'Calendar entry not found' });
    }

    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update calendar entry' });
  }
});

// DELETE /api/calendar/entry/:id - Delete entry
router.delete('/entry/:id', async (req, res) => {
  try {
    const entry = await CalendarEntry.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user.id
    });

    if (!entry) {
      return res.status(404).json({ error: 'Calendar entry not found' });
    }

    res.json({ message: 'Calendar entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete calendar entry' });
  }
});

// GET /api/calendar/reminders/due - Get all reminders due right now
router.get('/reminders/due', async (req, res) => {
  try {
    const now = new Date();

    // First, update all snoozed reminders whose snooze time has expired
    await CalendarEntry.updateMany(
      {
        user_id: req.user.id,
        status: 'snoozed',
        snoozed_until: { $lte: new Date() }
      },
      {
        $set: { status: 'pending', snoozed_until: null }
      }
    );

    // Then get all due reminders
    const entries = await CalendarEntry.find({
      user_id: req.user.id,
      reminder_time: { $lte: new Date() },
      status: { $in: ['pending', 'snoozed'] },
      $or: [
        { snoozed_until: null },
        { snoozed_until: { $lte: new Date() } }
      ]
    }).sort({ reminder_time: 1 });

    // Send email notifications for due reminders that haven't been notified yet
    const remindersNeedingEmail = entries.filter(entry => !entry.email_sent);
    
    if (remindersNeedingEmail.length > 0) {
      const { sendReminderEmail } = require('../services/emailService');
      
      // Only send to admin email from EMAIL_USER env variable
      const adminEmail = process.env.EMAIL_USER;
      
      if (adminEmail) {
        for (const reminder of remindersNeedingEmail) {
          try {
            const reminderData = {
              title: reminder.title,
              description: reminder.description,
              reminder_time: reminder.reminder_time,
              category: reminder.category,
              priority: reminder.priority,
              userEmail: adminEmail
            };
            
            await sendReminderEmail(reminderData);
            
            // Mark reminder as email sent
            await CalendarEntry.findByIdAndUpdate(reminder._id, { email_sent: true });
            
          } catch (emailError) {
            // Failed to send email for this reminder
          }
        }
      }
    }

    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch due reminders' });
  }
});

// PUT /api/calendar/entry/:id/reset-email - Reset email notification status
router.put('/entry/:id/reset-email', async (req, res) => {
  try {
    const entry = await CalendarEntry.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      { email_sent: false },
      { new: true }
    );

    if (!entry) {
      return res.status(404).json({ error: 'Calendar entry not found' });
    }

    res.json({ 
      message: 'Email notification status reset successfully',
      entry 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset email notification status' });
  }
});

module.exports = router;
