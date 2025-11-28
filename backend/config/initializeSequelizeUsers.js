const { User } = require('../models/sequelize');

/**
 * Initialize Sequelize users (for PostgreSQL)
 * Creates default test users if they don't exist
 */
const initializeSequelizeUsers = async () => {
  try {
    console.log('🔄 Initializing Sequelize users...');

    const users = [
      {
        email: 'admin@nirmitee.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true
      },
      {
        email: 'employee@nirmitee.com',
        password: 'employee123',
        name: 'Employee User',
        role: 'EMPLOYEE',
        isActive: true
      },
      {
        email: 'dummy@test.com',
        password: 'dummy123',
        name: 'Dummy User',
        role: 'EMPLOYEE',
        isActive: true
      }
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({ where: { email: userData.email } });
      
      if (!existingUser) {
        await User.create(userData);
        console.log(`✅ Created user: ${userData.email}`);
      } else {
        // Update password if it doesn't match (in case password was changed)
        try {
          const match = await existingUser.comparePassword(userData.password);
          if (!match) {
            existingUser.password = userData.password; // Will be hashed by hook
            await existingUser.save();
            console.log(`✅ Updated password for ${userData.email}`);
          }
        } catch (err) {
          // If compare fails, update password
          existingUser.password = userData.password;
          await existingUser.save();
          console.log(`✅ Updated password for ${userData.email}`);
        }
      }
    }

    console.log('✅ Sequelize users initialized');
    console.log('\n📝 Available Test Users:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Admin User:');
    console.log('   Email: admin@nirmitee.com');
    console.log('   Password: admin123');
    console.log('\n👤 Employee User:');
    console.log('   Email: employee@nirmitee.com');
    console.log('   Password: employee123');
    console.log('\n👤 Dummy Test User:');
    console.log('   Email: dummy@test.com');
    console.log('   Password: dummy123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Error initializing Sequelize users:', error);
    // Don't throw - allow server to continue even if user initialization fails
  }
};

module.exports = initializeSequelizeUsers;

