require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Lead = require('./models/lead');
const Sale = require('./models/Sale');
const Investment = require('./models/investment');
const User = require('./models/user');

const sampleData = {
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
