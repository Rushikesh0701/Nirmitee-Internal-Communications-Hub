const mongoose = require('mongoose');
const { User: SequelizeUser } = require('../models/sequelize');
const { User: MongoUser } = require('../models');
const { Role } = require('../models');

/**
 * Get or create MongoDB User ObjectId from Sequelize User UUID
 * This function maps between Sequelize (PostgreSQL) users and MongoDB users
 */
const getMongoUserId = async (sequelizeUserId) => {
  try {
    // Handle dummy user IDs in development mode
    if (!sequelizeUserId || sequelizeUserId === 'dummy-user-id-123') {
      if (process.env.NODE_ENV === 'development') {
        try {
          // In development, create or find a dummy MongoDB user
          let dummyMongoUser = await MongoUser.findOne({ email: 'dummy@test.com' });
          
          if (!dummyMongoUser) {
            // Get or create a default role
            let role = await Role.findOne({ name: 'Employee' });
            if (!role) {
              role = await Role.create({
                name: 'Employee',
                description: 'Default employee role'
              });
            }
            
            // Create dummy MongoDB user
            dummyMongoUser = await MongoUser.create({
              email: 'dummy@test.com',
              firstName: 'Dummy',
              lastName: 'User',
              displayName: 'Dummy User',
              roleId: role._id,
              isActive: true
            });
          }
          
          return dummyMongoUser._id;
        } catch (dbError) {
          // If MongoDB is not available in development, allow it to fail gracefully
          // The calling code should handle this
          console.error('MongoDB error in user mapping (development mode):', dbError.message);
          throw new Error('MongoDB connection required for blog creation. Please ensure MongoDB is running.');
        }
      } else {
      throw new Error('Invalid user ID: dummy user IDs are not allowed');
      }
    }

    // Check if it's already a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(sequelizeUserId)) {
      // Verify the user exists in MongoDB
      const mongoUser = await MongoUser.findById(sequelizeUserId);
      if (mongoUser) {
        return new mongoose.Types.ObjectId(sequelizeUserId);
      }
      // If not found, fall through to create from Sequelize user
    }

    // Get Sequelize user by UUID
    const sequelizeUser = await SequelizeUser.findByPk(sequelizeUserId);
    if (!sequelizeUser) {
      throw new Error('User not found in authentication system');
    }

    // Find or create MongoDB user by email
    let mongoUser = await MongoUser.findOne({ email: sequelizeUser.email.toLowerCase() });

    if (!mongoUser) {
      // Create MongoDB user from Sequelize user data
      // We need to get or create a Role first
      // Map Sequelize role names (ADMIN, EMPLOYEE, MODERATOR) to MongoDB role names (Admin, Employee, Moderator)
      const roleMap = {
        'ADMIN': 'Admin',
        'EMPLOYEE': 'Employee',
        'MODERATOR': 'Moderator'
      };
      const mongoRoleName = roleMap[sequelizeUser.role] || 'Employee';
      
      let role = await Role.findOne({ name: mongoRoleName });
      
      if (!role) {
        // Create default role if it doesn't exist
        role = await Role.create({
          name: mongoRoleName,
          description: `Role for ${mongoRoleName}`
        });
      }

      // Parse name into firstName and lastName
      const nameParts = (sequelizeUser.name || 'User').trim().split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || 'User';

      mongoUser = await MongoUser.create({
        email: sequelizeUser.email.toLowerCase(),
        firstName: firstName,
        lastName: lastName,
        displayName: sequelizeUser.name,
        avatar: sequelizeUser.avatar,
        department: sequelizeUser.department,
        position: sequelizeUser.designation,
        roleId: role._id,
        isActive: sequelizeUser.isActive !== false,
        oauthProvider: sequelizeUser.oauthProvider,
        oauthId: sequelizeUser.oauthId
      });
    } else {
      // Update MongoDB user if needed
      const needsUpdate = 
        mongoUser.firstName !== (sequelizeUser.name?.split(' ')[0] || 'User') ||
        mongoUser.displayName !== sequelizeUser.name ||
        mongoUser.isActive !== sequelizeUser.isActive;

      if (needsUpdate) {
        const nameParts = (sequelizeUser.name || 'User').trim().split(' ');
        mongoUser.firstName = nameParts[0] || 'User';
        mongoUser.lastName = nameParts.slice(1).join(' ') || 'User';
        mongoUser.displayName = sequelizeUser.name;
        mongoUser.isActive = sequelizeUser.isActive !== false;
        if (sequelizeUser.avatar) mongoUser.avatar = sequelizeUser.avatar;
        if (sequelizeUser.department) mongoUser.department = sequelizeUser.department;
        if (sequelizeUser.designation) mongoUser.position = sequelizeUser.designation;
        await mongoUser.save();
      }
    }

    return mongoUser._id;
  } catch (error) {
    console.error('Error in getMongoUserId:', error.message);
    throw error;
  }
};

/**
 * Get Sequelize User UUID from MongoDB User ObjectId
 * This is the reverse mapping from getMongoUserId
 */
const getSequelizeUserId = async (mongoUserId) => {
  try {
    // Handle invalid IDs
    if (!mongoUserId) {
      throw new Error('MongoDB user ID is required');
    }

    // Get MongoDB user
    let mongoUser;
    if (mongoose.Types.ObjectId.isValid(mongoUserId)) {
      mongoUser = await MongoUser.findById(mongoUserId);
    } else {
      throw new Error('Invalid MongoDB user ID format');
    }

    if (!mongoUser) {
      throw new Error('User not found in MongoDB');
    }

    // Find Sequelize user by email
    const sequelizeUser = await SequelizeUser.findOne({
      where: { email: mongoUser.email.toLowerCase() }
    });

    if (!sequelizeUser) {
      // If Sequelize user doesn't exist, create one
      // Map MongoDB role to Sequelize role
      let role = 'EMPLOYEE';
      if (mongoUser.roleId) {
        const mongoRole = await Role.findById(mongoUser.roleId);
        if (mongoRole) {
          const roleMap = {
            'Admin': 'ADMIN',
            'Employee': 'EMPLOYEE',
            'Moderator': 'MODERATOR'
          };
          role = roleMap[mongoRole.name] || 'EMPLOYEE';
        }
      }

      // Create Sequelize user from MongoDB user data
      const newSequelizeUser = await SequelizeUser.create({
        email: mongoUser.email.toLowerCase(),
        name: mongoUser.displayName || `${mongoUser.firstName} ${mongoUser.lastName}`,
        role: role,
        avatar: mongoUser.avatar,
        department: mongoUser.department,
        designation: mongoUser.position,
        isActive: mongoUser.isActive !== false,
        oauthProvider: mongoUser.oauthProvider,
        oauthId: mongoUser.oauthId
      });

      return newSequelizeUser.id;
    }

    return sequelizeUser.id;
  } catch (error) {
    console.error('Error in getSequelizeUserId:', error.message);
    throw error;
  }
};

module.exports = {
  getMongoUserId,
  getSequelizeUserId
};

