/**
 * Script to create a test user in both PostgreSQL (Sequelize) and MongoDB
 * This ensures the user exists in both databases for content creation
 */

require('dotenv').config();
const { connectDB } = require('../config/database');
const sequelize = require('../config/sequelize');
const { User: SequelizeUser } = require('../models/sequelize');
const { User: MongoUser, Role } = require('../models');
const { getMongoUserId } = require('../utils/userMapping');

const createTestUser = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Connect to PostgreSQL
    try {
      await sequelize.authenticate();
      console.log('✅ Connected to PostgreSQL');
    } catch (error) {
      console.error('❌ PostgreSQL connection failed:', error.message);
      console.log('⚠️  Continuing with MongoDB only...');
    }

    // User data
    const userData = {
      email: 'test@nirmitee.io',
      password: 'test123',
      name: 'Test User',
      role: 'EMPLOYEE',
      isActive: true
    };

    // Create or get Sequelize user
    let sequelizeUser;
    try {
      const existingSequelizeUser = await SequelizeUser.findOne({
        where: { email: userData.email }
      });

      if (existingSequelizeUser) {
        sequelizeUser = existingSequelizeUser;
        console.log(`✅ Sequelize user already exists: ${userData.email}`);
      } else {
        sequelizeUser = await SequelizeUser.create(userData);
        console.log(`✅ Created Sequelize user: ${userData.email}`);
      }
    } catch (error) {
      console.error('❌ Error creating Sequelize user:', error.message);
      throw error;
    }

    // Create or get MongoDB user
    try {
      // Get or create Role in MongoDB
      let role = await Role.findOne({ name: 'Employee' });
      if (!role) {
        role = await Role.create({
          name: 'Employee',
          description: 'Standard employee access'
        });
        console.log('✅ Created Employee role in MongoDB');
      }

      // Check if MongoDB user exists
      let mongoUser = await MongoUser.findOne({ email: userData.email.toLowerCase() });

      if (mongoUser) {
        console.log(`✅ MongoDB user already exists: ${userData.email}`);
      } else {
        // Parse name
        const nameParts = (userData.name || 'User').trim().split(' ');
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || 'User';

        mongoUser = await MongoUser.create({
          email: userData.email.toLowerCase(),
          firstName: firstName,
          lastName: lastName,
          displayName: userData.name,
          roleId: role._id,
          isActive: true
        });
        console.log(`✅ Created MongoDB user: ${userData.email}`);
      }

      // Test the mapping
      const mongoUserId = await getMongoUserId(sequelizeUser.id);
      console.log(`✅ User mapping verified: Sequelize ID -> MongoDB ID`);

      console.log('\n📝 Test User Created Successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👤 Email:', userData.email);
      console.log('🔑 Password:', userData.password);
      console.log('🆔 Sequelize User ID:', sequelizeUser.id);
      console.log('🆔 MongoDB User ID:', mongoUser._id);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      console.log('💡 To use this user:');
      console.log('   1. Login via: POST http://localhost:5002/api/auth/login');
      console.log('   2. Use the userId cookie from the response');
      console.log('   3. Use that cookie in your blog creation request\n');

    } catch (error) {
      console.error('❌ Error creating MongoDB user:', error.message);
      throw error;
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createTestUser();

