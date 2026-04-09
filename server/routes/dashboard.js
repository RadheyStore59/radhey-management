const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Investment = require('../models/investment');
const Lead = require('../models/lead');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

const getDateOnly = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

const percentChange = (current, previous) => {
  if (!previous || previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
};

// GET dashboard stats
router.get('/', async (req, res) => {
  try {
    // Get counts
    const totalLeads = await Lead.countDocuments({});
    const totalSales = await Sale.countDocuments({});
    const totalInvestments = await Investment.countDocuments({});
    
    // Calculate totals
    const sales = await Sale.find({});
    const investments = await Investment.find({});
    const leads = await Lead.find({});
    
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.sell_price || 0), 0);
    const totalProfit = sales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
    const totalQuantity = sales.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
    const totalInvestmentAmount = investments.reduce((sum, inv) => sum + (inv.total || 0), 0);
    
    // Lead status counts
    const newLeads = leads.filter(lead => lead.status === 'New').length;
    const activeLeads = leads.filter(lead => lead.status === 'Contacted').length;

    // Dynamic percentage calculation: current 30 days vs previous 30 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentStart = new Date(today);
    currentStart.setDate(currentStart.getDate() - 29);
    const previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - 29);

    const inRange = (date, start, end) => !!date && date >= start && date <= end;

    const salesCurrent = sales.filter((sale) => {
      const d = getDateOnly(sale.order_date || sale.created_at);
      return inRange(d, currentStart, today);
    });
    const salesPrevious = sales.filter((sale) => {
      const d = getDateOnly(sale.order_date || sale.created_at);
      return inRange(d, previousStart, previousEnd);
    });

    const leadsCurrent = leads.filter((lead) => {
      const d = getDateOnly(lead.lead_date || lead.created_at);
      return inRange(d, currentStart, today);
    });
    const leadsPrevious = leads.filter((lead) => {
      const d = getDateOnly(lead.lead_date || lead.created_at);
      return inRange(d, previousStart, previousEnd);
    });

    const currentRevenue = salesCurrent.reduce((sum, s) => sum + (s.sell_price || 0), 0);
    const previousRevenue = salesPrevious.reduce((sum, s) => sum + (s.sell_price || 0), 0);
    const currentProfit = salesCurrent.reduce((sum, s) => sum + (s.profit || 0), 0);
    const previousProfit = salesPrevious.reduce((sum, s) => sum + (s.profit || 0), 0);
    const currentQuantity = salesCurrent.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const previousQuantity = salesPrevious.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const currentLeads = leadsCurrent.length;
    const previousLeads = leadsPrevious.length;

    const currentInvestments = investments
      .filter((inv) => inRange(getDateOnly(inv.date || inv.created_at), currentStart, today))
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    const previousInvestments = investments
      .filter((inv) => inRange(getDateOnly(inv.date || inv.created_at), previousStart, previousEnd))
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    const currentActiveLeads = leadsCurrent.filter((lead) => lead.status === 'Contacted').length;
    const previousActiveLeads = leadsPrevious.filter((lead) => lead.status === 'Contacted').length;
    
    const stats = {
      totalLeads,
      totalSales,
      totalQuantity,
      totalRevenue,
      totalProfit,
      totalInventoryItems: 0,
      lowStockItems: 0,
      totalInvestments,
      totalInvestmentAmount,
      newLeads,
      activeLeads,
      percentageChanges: {
        totalLeads: percentChange(currentLeads, previousLeads),
        totalQuantity: percentChange(currentQuantity, previousQuantity),
        totalRevenue: percentChange(currentRevenue, previousRevenue),
        totalProfit: percentChange(currentProfit, previousProfit),
        netAfterInvestment: percentChange(
          currentProfit - currentInvestments,
          previousProfit - previousInvestments
        ),
        activeLeads: percentChange(currentActiveLeads, previousActiveLeads),
      },
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
