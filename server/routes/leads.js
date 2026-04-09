const express = require('express');
const router = express.Router();
const Lead = require('../models/lead');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth);

// GET all leads
router.get('/', async (req, res) => {
  try {
    const leads = await Lead.find({}).sort({ lead_date: -1 });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single lead
router.get('/:id', async (req, res) => {
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

// POST bulk leads
router.post('/bulk', async (req, res) => {
  try {
    const { leads } = req.body;
    const leadsWithUserId = leads.map(lead => ({ ...lead, user_id: req.user.id }));
    const savedLeads = await Lead.insertMany(leadsWithUserId);
    res.status(201).json(savedLeads);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update lead
router.put('/:id', async (req, res) => {
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
router.delete('/:id', requireAdmin, async (req, res) => {
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
