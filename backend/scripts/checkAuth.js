/**
 * Diagnostic script to check authentication setup
 */

require('dotenv').config();
const { connectDB } = require('../config/database');
const sequelize = require('../config/sequelize');
const { User: SequelizeUser } = require('../models/sequelize');
const { User: MongoUser } = require('../models');

const checkAuth = async () => {
  console.log('🔍 Checking Authentication Setup...\n');

  // Check MongoDB
  try {
    await connectDB();
    console.log('✅ MongoDB: Connected');
    
    const mongoUsers = await MongoUser.find().limit(5);
    console.log(`✅ MongoDB: Found ${mongoUsers.length} users`);
    if (mongoUsers.length > 0) {
      console.log('   Sample users:');
      mongoUsers.forEach(u => {
        console.log(`   - ${u.email} (${u._id})`);
      });
    }
  } catch (error) {
    console.error('❌ MongoDB: Connection failed:', error.message);
  }

  console.log('');

  // Check PostgreSQL/Sequelize
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL: Connected');
    
    const sequelizeUsers = await SequelizeUser.findAll({ limit: 5 });
    console.log(`✅ PostgreSQL: Found ${sequelizeUsers.length} users`);
    if (sequelizeUsers.length > 0) {
      console.log('   Sample users:');
      sequelizeUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.id}) - Role: ${u.role}`);
      });
    }
  } catch (error) {
    console.error('❌ PostgreSQL: Connection failed:', error.message);
    console.log('   ⚠️  This is OK if you\'re using MongoDB only');
  }

  console.log('\n📝 Test Users Available:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 Admin:');
  console.log('   Email: admin@nirmitee.com');
  console.log('   Password: admin123');
  console.log('\n👤 Employee:');
  console.log('   Email: employee@nirmitee.com');
  console.log('   Password: employee123');
  console.log('\n👤 Moderator:');
  console.log('   Email: moderator@nirmitee.com');
  console.log('   Password: moderator123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('💡 To test blog creation:');
  console.log('   1. Make sure backend is running: npm run dev');
  console.log('   2. Login via: POST http://localhost:5002/api/auth/login');
  console.log('   3. Use the userId cookie from login response');
  console.log('   4. Create blog: POST http://localhost:5002/api/blogs\n');

  process.exit(0);
};

checkAuth().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

