const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ Connected to MongoDB successfully!');
    
    // Test creating a document
    const testDoc = {
      name: 'Test Document',
      created_at: new Date()
    };
    
    console.log('✅ Database connection test completed!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
}

testConnection();
