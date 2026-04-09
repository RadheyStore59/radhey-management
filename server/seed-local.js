// This script will populate your MongoDB Atlas with sample data
// Run this after fixing your MongoDB Atlas connection issues

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
      remarks: 'Premium customer, delivered on time'
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
      remarks: 'New customer, good feedback'
    }
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
      payment_by: 'Admin'
    },
    {
      sr_no: 'INV002',
      date: '2024-01-10',
      vendor_name: 'Tech Hardware Ltd',
      particular: 'Computer Accessories',
      unit: 25,
      total: 25000,
      payment_through: 'UPI',
      payment_by: 'John Doe'
    },
    {
      sr_no: 'INV003',
      date: '2024-01-15',
      vendor_name: 'Furniture Mart',
      particular: 'Office Chairs and Tables',
      unit: 10,
      total: 45000,
      payment_through: 'Cash',
      payment_by: 'Sarah Smith'
    }
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
      notes: 'Interested in enterprise solution'
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
      notes: 'Warm lead from existing client'
    }
  ]
};

console.log('=== SAMPLE DATA FOR MONGODB ATLAS ===');
console.log('\n📊 SALES DATA:');
console.log(JSON.stringify(sampleData.sales, null, 2));

console.log('\n💰 INVESTMENT DATA:');
console.log(JSON.stringify(sampleData.investments, null, 2));

console.log('\n👥 LEADS DATA:');
console.log(JSON.stringify(sampleData.leads, null, 2));

console.log('\n=== INSTRUCTIONS ===');
console.log('1. Fix your MongoDB Atlas connection issues');
console.log('2. Update .env with correct MONGODB_URI');
console.log('3. Run: node seed.js to populate database');
console.log('4. Start server with: npm start');
console.log('5. Test API endpoints at: http://localhost:5000/api');
