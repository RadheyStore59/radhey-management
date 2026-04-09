require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Lead = require('./models/lead');
const Sale = require('./models/Sale');
const Investment = require('./models/investment');
const User = require('./models/user');

const sampleData = {
  sales: [
    {
      invoice_number: 'INV001',
      radhey_invoice: 'RAD001',
      order_date: '2024-01-15',
      order_taken_date: '2024-01-10',
      order_ready_date: '2024-01-12',
      product_name: 'Laptop Dell XPS 15',
      customer_name: 'John Smith',
      dealer_name: 'Tech Solutions Inc',
      phone_no: '+1234567890',
      reference: 'REF-001',
      deal: 'Corporate Deal',
      dispatch_date: '2024-01-20',
      quantity: 2,
      buy_price: 45000,
      sell_price: 55000,
      profit: 20000,
      payment_by: 'John Doe',
      payment_through: 'Bank Transfer',
      received_through_client: 'Online Payment',
      profit_given: 5000,
      remarks: 'Premium customer, delivered on time',
      user_id: 'user1',
    },
    {
      invoice_number: 'INV002',
      radhey_invoice: 'RAD002',
      order_date: '2024-02-10',
      order_taken_date: '2024-02-05',
      order_ready_date: '2024-02-08',
      product_name: 'iPhone 15 Pro',
      customer_name: 'Sarah Johnson',
      dealer_name: 'Mobile World',
      phone_no: '+0987654321',
      reference: 'REF-002',
      deal: 'Retail Deal',
      dispatch_date: '2024-02-15',
      quantity: 1,
      buy_price: 85000,
      sell_price: 95000,
      profit: 10000,
      payment_by: 'Mike Wilson',
      payment_through: 'Credit Card',
      received_through_client: 'POS Terminal',
      profit_given: 2000,
      remarks: 'New customer, good feedback',
      user_id: 'user1',
    },
  ],
  investments: [
    {
      sr_no: 'INV001',
      date: '2024-01-05',
      vendor_name: 'Office Supplies Co',
      particular: 'Stationery and Office Equipment',
      unit: 50,
      total: 15000,
      payment_through: 'Bank Transfer',
      payment_by: 'Admin',
      user_id: 'user1',
    },
    {
      sr_no: 'INV002',
      date: '2024-01-10',
      vendor_name: 'Tech Hardware Ltd',
      particular: 'Computer Accessories',
      unit: 25,
      total: 25000,
      payment_through: 'UPI',
      payment_by: 'John Doe',
      user_id: 'user1',
    },
    {
      sr_no: 'INV003',
      date: '2024-01-15',
      vendor_name: 'Furniture Mart',
      particular: 'Office Chairs and Tables',
      unit: 10,
      total: 45000,
      payment_through: 'Cash',
      payment_by: 'Sarah Smith',
      user_id: 'user1',
    },
  ],
  leads: [
    {
      lead_date: '2024-01-20',
      contact_name: 'Robert Brown',
      company_name: 'ABC Corporation',
      lead_source: 'Website Inquiry',
      product_requirement: 'Software Solution',
      quantity: 100,
      budget: 500000,
      customization: 'Custom API Integration',
      status: 'New',
      last_follow_up: '2024-01-21',
      next_action: 'Schedule Demo',
      notes: 'Interested in enterprise solution',
      user_id: 'user1',
    },
    {
      lead_date: '2024-01-22',
      contact_name: 'Emily Davis',
      company_name: 'XYZ Enterprises',
      lead_source: 'Referral',
      product_requirement: 'Hardware Upgrade',
      quantity: 50,
      budget: 200000,
      customization: 'Standard Configuration',
      status: 'Contacted',
      last_follow_up: '2024-01-23',
      next_action: 'Send Proposal',
      notes: 'Warm lead from existing client',
      user_id: 'user1',
    },
  ],
};

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is missing in server/.env');
  }

  await mongoose.connect(uri);

  // Ensure at least one Admin exists so you can manage users.
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@radhey.com').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const staffEmail = (process.env.STAFF_EMAIL || 'staff1@radhey.com').toLowerCase().trim();
  const staffPassword = process.env.STAFF_PASSWORD || 'staff123';

  const adminExists = await User.findOne({ email: adminEmail });
  if (!adminExists) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await User.create({
      id: 'user1',
      email: adminEmail,
      passwordHash,
      role: 'Admin',
    });
  }

  const staffExists = await User.findOne({ email: staffEmail });
  if (!staffExists) {
    const passwordHash = await bcrypt.hash(staffPassword, 10);
    await User.create({
      id: 'user2',
      email: staffEmail,
      passwordHash,
      role: 'Staff',
    });
  }

  const shouldReset = process.argv.includes('--reset');
  if (shouldReset) {
    await Promise.all([
      Lead.deleteMany({ user_id: 'user1' }),
      Sale.deleteMany({ user_id: 'user1' }),
      Investment.deleteMany({ user_id: 'user1' }),
    ]);
  }

  const [leads, sales, investments] = await Promise.all([
    Lead.insertMany(sampleData.leads),
    Sale.insertMany(sampleData.sales),
    Investment.insertMany(sampleData.investments),
  ]);

  console.log(
    JSON.stringify(
      {
        inserted: {
          leads: leads.length,
          sales: sales.length,
          investments: investments.length,
        },
      },
      null,
      2
    )
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
