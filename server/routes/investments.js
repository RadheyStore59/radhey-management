const express = require('express');
const router = express.Router();
const Investment = require('../models/investment');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth);

// GET all investments
router.get('/', async (req, res) => {
  try {
    const investments = await Investment.find({}).sort({ date: -1 });
    res.json(investments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single investment
router.get('/:id', async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id);
    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }
    res.json(investment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new investment
router.post('/', async (req, res) => {
  try {
    const investmentData = { ...req.body, user_id: req.user.id };
    const investment = new Investment(investmentData);
    const savedInvestment = await investment.save();
    res.status(201).json(savedInvestment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST bulk investments
router.post('/bulk', async (req, res) => {
  try {
    const { investments } = req.body;

    if (!Array.isArray(investments)) {
      return res.status(400).json({ message: 'Investments payload must be an array' });
    }

    // Validate required fields per-row so Excel import errors are actionable
    for (let i = 0; i < investments.length; i++) {
      const inv = investments[i] || {};
      const vendor_name = typeof inv.vendor_name === 'string' ? inv.vendor_name.trim() : '';
      const particular = typeof inv.particular === 'string' ? inv.particular.trim() : '';

      // +2 assuming Excel: header row + 1-based row indexing
      const excelRow = i + 2;
      if (!vendor_name) {
        return res.status(400).json({ message: `Investment validation failed: vendor_name is required (row ${excelRow})` });
      }
      if (!particular) {
        return res.status(400).json({ message: `Investment validation failed: particular is required (row ${excelRow})` });
      }
    }

    const investmentsWithUserId = investments.map(investment => ({
      ...investment,
      user_id: req.user.id,
    }));

    const savedInvestments = await Investment.insertMany(investmentsWithUserId);
    res.status(201).json(savedInvestments);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update investment
router.put('/:id', async (req, res) => {
  try {
    const investment = await Investment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }
    res.json(investment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE investment
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const investment = await Investment.findByIdAndDelete(req.params.id);
    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }
    res.json({ message: 'Investment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE all investments
router.delete('/', requireAdmin, async (req, res) => {
  try {
    await Investment.deleteMany({});
    res.json({ message: 'All investments deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
