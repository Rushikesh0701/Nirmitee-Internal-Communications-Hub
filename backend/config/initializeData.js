const { Role, User } = require('../models');

const initializeData = async () => {
  try {
    // Create roles if they don't exist
    const roles = [
      { name: 'Admin', description: 'Full system access' },
      { name: 'Moderator', description: 'Content moderation and management' },
      { name: 'Employee', description: 'Standard employee access' }
    ];

    const createdRoles = {};
    for (const roleData of roles) {
      let role = await Role.findOne({ name: roleData.name });
      if (!role) {
        role = await Role.create(roleData);
      }
      createdRoles[roleData.name] = role;
    }

    console.log('✅ Roles initialized');

    // Create test users if they don't exist
    // Note: Password will be hashed automatically by User model's pre('save') hook
    const users = [
      {
        email: 'admin@nirmitee.io',
        password: 'admin123', // Will be hashed by User model
        firstName: 'Admin',
        lastName: 'User',
        department: 'IT',
        position: 'System Administrator',
        roleId: createdRoles['Admin']._id,
        isActive: true
      },
      {
        email: 'moderator@nirmitee.io',
        password: 'moderator123', // Will be hashed by User model
        firstName: 'Moderator',
        lastName: 'User',
        department: 'HR',
        position: 'Content Moderator',
        roleId: createdRoles['Moderator']._id,
        isActive: true
      },
      {
        email: 'employee@nirmitee.io',
        password: 'employee123', // Will be hashed by User model
        firstName: 'John',
        lastName: 'Doe',
        department: 'Engineering',
        position: 'Software Developer',
        roleId: createdRoles['Employee']._id,
        isActive: true
      }
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        await User.create(userData);
      } else {
        // Update existing user's password if needed (in case it was double-hashed)
        // Only update if password comparison fails
        try {
          const match = await existingUser.comparePassword(userData.password);
          if (!match) {
            // Password doesn't match, update it
            existingUser.password = userData.password; // Will be re-hashed by pre-save hook
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

    console.log('✅ Test users initialized');
    console.log('\n📝 Test User Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Admin User:');
    console.log('   Email: admin@nirmitee.io');
    console.log('   Password: admin123');
    console.log('\n👤 Moderator User:');
    console.log('   Email: moderator@nirmitee.io');
    console.log('   Password: moderator123');
    console.log('\n👤 Employee User:');
    console.log('   Email: employee@nirmitee.io');
    console.log('   Password: employee123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Error initializing data:', error);
    throw error;
  }
};

module.exports = initializeData;
