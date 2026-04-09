const express = require('express');
const Courier = require('../models/courier');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const records = await Courier.find({}).sort({ created_at: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = { ...req.body, user_id: req.user.id };
    const saved = await Courier.create(payload);
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Courier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Courier record not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const deleted = await Courier.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Courier record not found' });
    res.json({ message: 'Courier record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/', requireAdmin, async (req, res) => {
  try {
    await Courier.deleteMany({});
    res.json({ message: 'All courier records deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
