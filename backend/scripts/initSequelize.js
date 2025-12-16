const sequelize = require('../config/sequelize');
const { User } = require('../models/sequelize');
const { ROLES } = require('../constants/roles');

/**
 * Initialize Sequelize database
 * Creates tables and optionally seeds initial data
 */
const initDatabase = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('🔄 Syncing models...');
    await sequelize.sync({ alter: true });
    console.log('✅ Models synchronized');

    // Check if admin user exists
    const adminUser = await User.findOne({ where: { email: 'admin@nirmitee.io' } });

    if (!adminUser) {
      console.log('🔄 Creating default admin user...');
      await User.create({
        email: 'admin@nirmitee.io',
        password: 'admin123', // Change this in production!
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true
      });
      console.log('✅ Default admin user created');
      console.log('   Email: admin@nirmitee.io');
      console.log('   Password: admin123');
      console.log('   ⚠️  Please change the password in production!');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Check if employee user exists
    const employeeUser = await User.findOne({ where: { email: 'employee@nirmitee.io' } });

    if (!employeeUser) {
      console.log('🔄 Creating default employee user...');
      await User.create({
        email: 'employee@nirmitee.io',
        password: 'employee123', // Change this in production!
        name: 'Employee User',
        role: 'EMPLOYEE',
        isActive: true
      });
      console.log('✅ Default employee user created');
      console.log('   Email: employee@nirmitee.io');
      console.log('   Password: employee123');
    } else {
      console.log('ℹ️  Employee user already exists');
    }

    // Check if dummy/test user exists
    const dummyUser = await User.findOne({ where: { email: 'dummy@test.io' } });

    if (!dummyUser) {
      console.log('🔄 Creating dummy test user...');
      await User.create({
        email: 'dummy@test.io',
        password: 'dummy123', // Simple password for testing
        name: 'Dummy User',
        role: 'EMPLOYEE',
        isActive: true
      });
      console.log('✅ Dummy test user created');
      console.log('   Email: dummy@test.io');
      console.log('   Password: dummy123');
      console.log('   ⚠️  This is a test user for development only!');
    } else {
      console.log('ℹ️  Dummy user already exists');
    }

    console.log('✅ Database initialization complete!');
    console.log('\n📝 Available Test Users:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Admin User:');
    console.log('   Email: admin@nirmitee.io');
    console.log('   Password: admin123');
    console.log('\n👤 Employee User:');
    console.log('   Email: employee@nirmitee.io');
    console.log('   Password: employee123');
    console.log('\n👤 Dummy Test User:');
    console.log('   Email: dummy@test.io');
    console.log('   Password: dummy123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

// Run initialization
initDatabase();

