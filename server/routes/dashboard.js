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

const normalizeStatus = (status) => String(status || '').trim().toLowerCase();
const CLOSED_LEAD_STATUSES = new Set(['won', 'lost', 'converted', 'closed']);
const isActiveLead = (lead) => {
  const status = normalizeStatus(lead?.status);
  if (!status) return true;
  return !CLOSED_LEAD_STATUSES.has(status);
};

// GET dashboard stats
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // If Admin, show everything. If Staff, show only their own data.
    const query = (req.user && req.user.role === 'Admin') ? {} : { 
      $or: [
        { user_id: req.user.id },
        { user_id: 'user1' } // Allow legacy leads
      ]
    };

    const sales = await Sale.find(query);
    const investments = await Investment.find(query);
    const leads = await Lead.find(query);
    const stockItems = await StockItem.find(query);

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
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      
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
    // Keep active leads aligned with Leads Management (global active count for current user scope),
    // so dashboard and leads module show consistent values even when dashboard date filters are applied.
    const newLeads = filteredLeads.filter((lead) => normalizeStatus(lead.status) === 'new').length;
    const activeLeads = leads.filter(isActiveLead).length;

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

    const investmentsCurrent = investments.filter((inv) => {
      const d = getDateOnly(inv.date || inv.created_at);
      return inRange(d, currentStart, today);
    });
    const investmentsPrevious = investments.filter((inv) => {
      const d = getDateOnly(inv.date || inv.created_at);
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
    const currentInvestments = investmentsCurrent.reduce((sum, i) => sum + (i.total || 0), 0);
    const previousInvestments = investmentsPrevious.reduce((sum, i) => sum + (i.total || 0), 0);

    const currentActiveLeads = leadsCurrent.filter(isActiveLead).length;
    const previousActiveLeads = leadsPrevious.filter(isActiveLead).length;

    const stats = {
      totalLeads,
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
