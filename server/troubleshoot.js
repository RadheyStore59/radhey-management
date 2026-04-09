const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 MONGODB ATLAS TROUBLESHOOTING');
console.log('=====================================');

// 1. Check environment variables
console.log('\n📋 Environment Variables:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not set');
console.log('PORT:', process.env.PORT || '❌ Not set');

// 2. Test basic connectivity
async function testBasicConnection() {
  try {
    console.log('\n🔗 Testing Connection...');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not set in .env file');
    }

    // Parse URI to check format
    const uri = process.env.MONGODB_URI;
    console.log('URI Format:', uri.startsWith('mongodb+srv://') ? '✅ SRV' : '❌ Regular');
    
    // Test connection with timeout
    const connectionPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      connectTimeoutMS: 10000, // 10 second timeout
    });
    
    // Set timeout for connection attempt
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000);
    });
    
    await Promise.race([connectionPromise, timeoutPromise]);
    console.log('✅ Connection successful!');
    
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    // Provide specific troubleshooting advice
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 TROUBLESHOOTING ECONNREFUSED:');
      console.log('1. Check if MongoDB Atlas cluster is running');
      console.log('2. Verify your IP is whitelisted in Atlas');
      console.log('3. Check if username/password is correct');
      console.log('4. Try accessing Atlas dashboard to test connection');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n🔧 TROUBLESHOOTING ENOTFOUND:');
      console.log('1. Check cluster name in URI');
      console.log('2. Verify DNS resolution');
    } else if (error.message.includes('Authentication failed')) {
      console.log('\n🔧 TROUBLESHOOTING AUTH:');
      console.log('1. Check username/password in URI');
      console.log('2. Verify user has access to database');
    }
    
    return false;
  }
}

// 3. Alternative: Use local MongoDB for testing
async function testLocalConnection() {
  try {
    console.log('\n🏠 Testing Local MongoDB (fallback):');
    const localUri = 'mongodb://localhost:27017/radhey-management';
    
    await mongoose.connect(localUri);
    console.log('✅ Local MongoDB connection successful!');
    console.log('💡 You can use local MongoDB for development');
    
    return true;
  } catch (error) {
    console.error('❌ Local MongoDB failed:', error.message);
    console.log('💡 Make sure local MongoDB is running on port 27017');
    return false;
  }
}

async function main() {
  console.log('\n🎯 TESTING STRATEGIES:');
  console.log('1. Atlas Connection Test');
  const atlasSuccess = await testBasicConnection();
  
  if (!atlasSuccess) {
    console.log('\n2. Local MongoDB Test');
    await testLocalConnection();
  }
  
  console.log('\n📝 RECOMMENDATIONS:');
  console.log('1. For Atlas: Check network, IP whitelist, cluster status');
  console.log('2. For Development: Use local MongoDB with URI: mongodb://localhost:27017/radhey-management');
  console.log('3. Update .env with working URI');
  console.log('4. Then run: node seed.js');
  
  // Close any existing connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}

main().catch(console.error);
