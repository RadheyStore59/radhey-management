const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Lead = require('../models/lead');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth);

// POST batch leads
router.post('/batch', async (req, res) => {
  try {
    const { leads } = req.body;
    const leadsWithUserId = leads.map(lead => ({ ...lead, user_id: req.user.id }));
    const savedLeads = await Lead.insertMany(leadsWithUserId);
    res.status(201).json(savedLeads);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT batch update leads
router.put('/batch', async (req, res) => {
  try {
    const { updates } = req.body;
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ message: 'Updates must be an array' });
    }

    const bulkOps = updates
      .filter(update => {
        if (!update.id || !mongoose.Types.ObjectId.isValid(update.id)) {
          console.error(`Invalid lead ID in batch update: ${update.id}`);
          return false;
        }
        return true;
      })
      .map(update => ({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(update.id) },
          update: { $set: update.data }
        }
      }));

    if (bulkOps.length === 0) {
      return res.status(400).json({ message: 'No valid updates provided' });
    }

    const result = await Lead.bulkWrite(bulkOps);
    res.json(result);
  } catch (error) {
    console.error('Batch update error:', error);
    res.status(400).json({ message: error.message });
  }
});

// GET all leads
router.get('/', async (req, res) => {
  try {
    // If Admin, show everything. If Staff, show only their own data.
    const query = (req.user && req.user.role === 'Admin') ? {} : { user_id: req.user.id };
    const leads = await Lead.find(query).sort({ pipeline_order: 1, lead_date: -1 });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single lead
router.get('/:id([0-9a-fA-F]{24})', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new lead
router.post('/', async (req, res) => {
  try {
    const leadData = { ...req.body, user_id: req.user.id };
    const lead = new Lead(leadData);
    const savedLead = await lead.save();
    res.status(201).json(savedLead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update lead
router.put('/:id([0-9a-fA-F]{24})', async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    res.json(lead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE lead
router.delete('/:id([0-9a-fA-F]{24})', requireAdmin, async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE all leads
router.delete('/', requireAdmin, async (req, res) => {
  try {
    await Lead.deleteMany({});
    res.json({ message: 'All leads deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
