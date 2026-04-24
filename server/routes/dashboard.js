const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Investment = require('../models/investment');
const Lead = require('../models/lead');
const StockItem = require('../models/stockItem');
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
    const { startDate, endDate } = req.query;
    
    // Get all data first
    const sales = await Sale.find({});
    const investments = await Investment.find({});
    const leads = await Lead.find({});
    const stockItems = await StockItem.find({});
    
    // Get counts
    const totalLeads = leads.length;
    const totalSales = sales.length;
    const totalInvestments = investments.length;
    const totalStockItems = stockItems.length;
    
    // Filter by date range if provided
    let filteredSales = sales;
    let filteredInvestments = investments;
    let filteredLeads = leads;
    let filteredStockItems = stockItems;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.order_date);
        return saleDate >= start && saleDate <= end;
      });
      
      filteredInvestments = investments.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate >= start && invDate <= end;
      });
      
      filteredLeads = leads.filter(lead => {
        const leadDate = new Date(lead.lead_date);
        return leadDate >= start && leadDate <= end;
      });
      
      filteredStockItems = stockItems.filter(item => {
        const itemDate = new Date(item.date_received);
        return itemDate >= start && itemDate <= end;
      });
    }
    
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.sell_price || 0), 0);
    const totalProfit = filteredSales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
    const totalQuantity = filteredSales.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
    const totalInvestmentAmount = filteredInvestments.reduce((sum, inv) => sum + (inv.total || 0), 0);
    
    // Pending payments calculation
    const pendingPayments = filteredSales.filter(sale => {
      const paymentStatus = (sale.payment_by || '').toLowerCase();
      const receivedStatus = (sale.received_through_client || '').toLowerCase();
      return paymentStatus === 'pending' || paymentStatus === '' || receivedStatus === 'pending' || receivedStatus === '';
    });
    const pendingPaymentAmount = pendingPayments.reduce((sum, sale) => sum + (sale.sell_price || 0), 0);
    
    // Stock statistics
    const totalStockQuantity = filteredStockItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalStockValue = filteredStockItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.purchase_price || 0)), 0);
    const lowStockItems = filteredStockItems.filter(item => (item.quantity || 0) <= 5).length;
    
    // Lead status counts
    const newLeads = filteredLeads.filter(lead => lead.status === 'New').length;
    const activeLeads = filteredLeads.filter(lead => lead.status === 'Contacted').length;

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
      totalInventoryItems: totalStockItems,
      lowStockItems,
      totalStockQuantity,
      totalStockValue,
      totalInvestments,
      totalInvestmentAmount,
      pendingPaymentAmount,
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
