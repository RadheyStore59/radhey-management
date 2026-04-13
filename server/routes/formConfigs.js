const express = require('express');
const FormConfig = require('../models/formConfig');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

const DEFAULT_FIELDS = {
  leads: [
    { key: 'lead_name', label: 'Customer Name', type: 'text', required: true, enabled: true, order: 0 },
    { key: 'product', label: 'Product', type: 'text', required: false, enabled: true, order: 1 },
    { key: 'mobile_number', label: 'Mobile Number', type: 'text', required: false, enabled: true, order: 2 },
    { key: 'email', label: 'Email', type: 'text', required: false, enabled: true, order: 3 },
    { key: 'lead_source', label: 'Lead Source', type: 'select', required: false, enabled: true, order: 4, options: ['Website', 'Phone', 'Email', 'Referral', 'Social Media', 'Advertisement', 'Other'] },
    { key: 'status', label: 'Status', type: 'select', required: true, enabled: true, order: 5, options: ['New', 'Contacted', 'Converted', 'Lost'] },
    { key: 'date', label: 'Date', type: 'date', required: false, enabled: true, order: 6 },
    { key: 'notes', label: 'Notes', type: 'textarea', required: false, enabled: true, order: 7 },
  ],
  sales: [
    { key: 'invoice_number', label: 'Invoice Number', type: 'text', required: true, enabled: true, order: 0 },
    { key: 'radhey_invoice', label: 'Radhey Invoice', type: 'text', required: false, enabled: true, order: 1 },
    { key: 'order_date', label: 'Order Date', type: 'date', required: false, enabled: true, order: 2 },
    { key: 'order_taken_date', label: 'Order Taken Date', type: 'date', required: false, enabled: true, order: 3 },
    { key: 'order_ready_date', label: 'Order Ready Date', type: 'date', required: false, enabled: true, order: 4 },
    { key: 'product_name', label: 'Product Name', type: 'text', required: true, enabled: true, order: 5 },
    { key: 'customer_name', label: 'Customer Name', type: 'text', required: true, enabled: true, order: 6 },
    { key: 'dealer_name', label: 'Dealer Name', type: 'text', required: false, enabled: true, order: 7 },
    { key: 'phone_no', label: 'Phone Number', type: 'text', required: false, enabled: true, order: 8 },
    { key: 'reference', label: 'Reference', type: 'text', required: false, enabled: true, order: 9 },
    { key: 'deal', label: 'Deal', type: 'text', required: false, enabled: true, order: 10 },
    { key: 'dispatch_date', label: 'Dispatch Date', type: 'date', required: false, enabled: true, order: 11 },
    { key: 'quantity', label: 'Quantity', type: 'number', required: true, enabled: true, order: 12 },
    { key: 'buy_price', label: 'Buy Price', type: 'number', required: true, enabled: true, order: 13 },
    { key: 'sell_price', label: 'Sell Price', type: 'number', required: true, enabled: true, order: 14 },
    { key: 'profit', label: 'Profit', type: 'number', required: false, enabled: true, order: 15 },
    { key: 'payment_by', label: 'Payment By', type: 'text', required: false, enabled: true, order: 16 },
    { key: 'payment_through', label: 'Payment Through', type: 'text', required: false, enabled: true, order: 17 },
    { key: 'received_through_client', label: 'Received Through Client', type: 'text', required: false, enabled: true, order: 18 },
    { key: 'profit_given', label: 'Partner Settlement Details', type: 'text', required: false, enabled: true, order: 19 },
    { key: 'remarks', label: 'Remarks', type: 'textarea', required: false, enabled: true, order: 20 },
  ],
  investments: [
    { key: 'sr_no', label: 'SR. NO', type: 'text', required: false, enabled: true, order: 0 },
    { key: 'date', label: 'Date', type: 'date', required: true, enabled: true, order: 1 },
    { key: 'vendor_name', label: 'Vendor Name', type: 'text', required: true, enabled: true, order: 2 },
    { key: 'particular', label: 'Particular', type: 'text', required: true, enabled: true, order: 3 },
    { key: 'unit', label: 'Unit', type: 'number', required: true, enabled: true, order: 4 },
    { key: 'total', label: 'Total', type: 'number', required: true, enabled: true, order: 5 },
    { key: 'payment_through', label: 'Payment Through', type: 'text', required: false, enabled: true, order: 6 },
    { key: 'payment_by', label: 'Payment By', type: 'text', required: false, enabled: true, order: 7 },
  ],
  gst: [
    { key: 'filing_month', label: 'Filing Month', type: 'text', required: true, enabled: true, order: 0 },
    { key: 'filing_year', label: 'Filing Year', type: 'text', required: true, enabled: true, order: 1 },
    { key: 'turnover', label: 'Turnover', type: 'number', required: false, enabled: true, order: 2 },
    { key: 'tax_paid', label: 'Tax Paid', type: 'number', required: false, enabled: true, order: 3 },
    { key: 'filing_date', label: 'Filing Date', type: 'date', required: false, enabled: true, order: 4 },
    { key: 'status', label: 'Status', type: 'select', required: true, enabled: true, order: 5, options: ['Pending', 'Filed', 'Late Filed', 'Not Filed'] },
    { key: 'remarks', label: 'Remarks', type: 'textarea', required: false, enabled: true, order: 6 },
  ],
  courier: [
    { key: 'date', label: 'Date', type: 'date', required: false, enabled: true, order: 0 },
    { key: 'tracking_number', label: 'Tracking Number', type: 'text', required: true, enabled: true, order: 0 },
    { key: 'courier_company', label: 'Courier Company', type: 'text', required: true, enabled: true, order: 1 },
    { key: 'sender_name', label: 'Sender Name', type: 'text', required: true, enabled: true, order: 2 },
    { key: 'sender_phone', label: 'Sender Phone', type: 'text', required: true, enabled: true, order: 3 },
    { key: 'recipient_name', label: 'Recipient Name', type: 'text', required: true, enabled: true, order: 4 },
    { key: 'recipient_phone', label: 'Recipient Phone', type: 'text', required: true, enabled: true, order: 5 },
    { key: 'shipment_date', label: 'Shipment Date', type: 'date', required: false, enabled: true, order: 6 },
    { key: 'delivery_date', label: 'Delivery Date', type: 'date', required: false, enabled: true, order: 7 },
    { key: 'weight', label: 'Weight', type: 'number', required: false, enabled: true, order: 8 },
    { key: 'cost', label: 'Cost', type: 'number', required: false, enabled: true, order: 9 },
    { key: 'status', label: 'Status', type: 'select', required: true, enabled: true, order: 10, options: ['Pending', 'Completed', 'Cancelled', 'Refunded'] },
    { key: 'remarks', label: 'Remarks', type: 'textarea', required: false, enabled: true, order: 11 },
  ],
};

router.get('/:module', async (req, res) => {
  try {
    const { module } = req.params;
    let config = await FormConfig.findOne({ module });
    if (!config) {
      const fields = DEFAULT_FIELDS[module] || [];
      config = await FormConfig.create({ module, fields });
    } else {
      const defaults = DEFAULT_FIELDS[module] || [];
      const existingByKey = new Map((config.fields || []).map((f) => [f.key, f]));
      let changed = false;

      for (const df of defaults) {
        if (!existingByKey.has(df.key)) {
          config.fields.push(df);
          changed = true;
        }
      }

      if (changed) {
        config.fields = config.fields
          .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
          .map((f, idx) => ({ ...f.toObject?.() || f, order: idx }));
        await config.save();
      }
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:module', requireAdmin, async (req, res) => {
  try {
    const { module } = req.params;
    const { fields } = req.body;
    if (!Array.isArray(fields)) {
      return res.status(400).json({ message: 'fields must be an array' });
    }

    const sanitized = fields.map((f, idx) => ({
      key: String(f.key || '').trim(),
      label: String(f.label || '').trim(),
      type: ['text', 'number', 'date', 'textarea', 'select'].includes(f.type) ? f.type : 'text',
      required: Boolean(f.required),
      enabled: f.enabled !== false,
      placeholder: String(f.placeholder || ''),
      options: Array.isArray(f.options) ? f.options.map((x) => String(x).trim()).filter(Boolean) : [],
      order: Number.isFinite(Number(f.order)) ? Number(f.order) : idx,
    })).filter((f) => f.key && f.label);

    const updated = await FormConfig.findOneAndUpdate(
      { module },
      { module, fields: sanitized },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
