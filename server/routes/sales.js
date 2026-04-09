const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth);

// GET all sales
router.get('/', async (req, res) => {
  try {
    const sales = await Sale.find({}).sort({ order_date: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single sale
router.get('/:id', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new sale
router.post('/', async (req, res) => {
  try {
    const saleData = { ...req.body, user_id: req.user.id };
    const sale = new Sale(saleData);
    const savedSale = await sale.save();
    res.status(201).json(savedSale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST bulk sales
router.post('/bulk', async (req, res) => {
  try {
    const { sales } = req.body;

    if (!Array.isArray(sales)) {
      return res.status(400).json({ message: 'Sales payload must be an array' });
    }

    // Validate required fields per-row so Excel import errors are actionable
    for (let i = 0; i < sales.length; i++) {
      const sale = sales[i] || {};
      const product_name = typeof sale.product_name === 'string' ? sale.product_name.trim() : '';
      const customer_name = typeof sale.customer_name === 'string' ? sale.customer_name.trim() : '';

      // +2 assuming Excel: header row + 1-based row indexing
      const excelRow = i + 2;
      if (!product_name) {
        return res.status(400).json({ message: `Sales validation failed: product_name is required (row ${excelRow})` });
      }
      if (!customer_name) {
        return res.status(400).json({ message: `Sales validation failed: customer_name is required (row ${excelRow})` });
      }
    }

    const salesWithUserId = sales.map(sale => ({
      ...sale,
      user_id: req.user.id,
    }));

    const savedSales = await Sale.insertMany(salesWithUserId);
    res.status(201).json(savedSales);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update sale
router.put('/:id', async (req, res) => {
  try {
    const sale = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.json(sale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE sale
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE all sales
router.delete('/', requireAdmin, async (req, res) => {
  try {
    await Sale.deleteMany({});
    res.json({ message: 'All sales deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
