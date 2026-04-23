const express = require('express');
const router = express.Router();
const StockItem = require('../models/stockItem');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth);

// GET all stock items with search and filter support
router.get('/', async (req, res) => {
  try {
    const { search, category, brand, dealer } = req.query;
    let query = {};
    
    // Build search query
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add filters
    if (category) query.category_id = category;
    if (brand) query.brand_id = brand;
    if (dealer) query.dealer_id = dealer;
    
    const stockItems = await StockItem.find(query).sort({ date_received: -1 });
    
    res.json(stockItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single stock item
router.get('/:id', async (req, res) => {
  try {
    const stockItem = await StockItem.findById(req.params.id);
    
    if (!stockItem) {
      return res.status(404).json({ message: 'Stock item not found' });
    }
    res.json(stockItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new stock item
router.post('/', async (req, res) => {
  try {
    const stockItemData = { ...req.body, user_id: req.user.id };
    const stockItem = new StockItem(stockItemData);
    const savedStockItem = await stockItem.save();
    
    res.status(201).json(savedStockItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update stock item
router.put('/:id', async (req, res) => {
  try {
    const stockItem = await StockItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    if (!stockItem) {
      return res.status(404).json({ message: 'Stock item not found' });
    }
    res.json(stockItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE stock item
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const stockItem = await StockItem.findByIdAndDelete(req.params.id);
    if (!stockItem) {
      return res.status(404).json({ message: 'Stock item not found' });
    }
    res.json({ message: 'Stock item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
