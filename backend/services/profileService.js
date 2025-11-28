const { User, UserPoints, Recognition } = require('../models/sequelize/index');
const { Op, Sequelize } = require('sequelize');
const mongoose = require('mongoose');
const { User: MongoUser } = require('../models');

/**
 * Check if Sequelize/PostgreSQL is available
 */
const isSequelizeAvailable = async () => {
  try {
    await User.sequelize.authenticate();
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Convert MongoDB ObjectId to Sequelize UUID by finding user by email
 * Returns the original ID if it's already a Sequelize UUID
 */
const convertToSequelizeUserId = async (userId) => {
  // If it's a MongoDB ObjectId (24 hex characters), convert it
  if (mongoose.Types.ObjectId.isValid(userId) && userId.length === 24) {
    try {
      const mongoUser = await MongoUser.findById(userId);
      if (mongoUser) {
        // Check if Sequelize is available
        const sequelizeAvailable = await isSequelizeAvailable();
        if (!sequelizeAvailable) {
          // If Sequelize not available, return MongoDB ID (will use MongoDB fallback)
          return userId;
        }
        
        // Find Sequelize user by email
        const sequelizeUser = await User.findOne({ 
          where: { email: mongoUser.email.toLowerCase() } 
        });
        if (sequelizeUser) {
          return sequelizeUser.id;
        } else {
          // If Sequelize user doesn't exist, return MongoDB ID for fallback
          return userId;
        }
      }
    } catch (error) {
      // If Sequelize connection error, return MongoDB ID for fallback
      if (error.name === 'SequelizeConnectionError' || 
          error.name === 'SequelizeConnectionRefusedError' ||
          error.message?.includes('role') ||
          error.message?.includes('does not exist')) {
        console.warn('PostgreSQL not available, using MongoDB fallback:', error.message);
        return userId;
      }
      console.warn('MongoDB lookup failed, trying Sequelize directly:', error.message);
    }
  }
  // Return as-is if it's already a Sequelize UUID or if conversion failed
  return userId;
};

/**
 * Get user profile by ID
 * Handles both Sequelize UUID and MongoDB ObjectId
 * Falls back to MongoDB user data if PostgreSQL is not available
 */
const getProfileById = async (userId) => {
  const sequelizeUserId = await convertToSequelizeUserId(userId);
  const isMongoId = mongoose.Types.ObjectId.isValid(userId) && userId.length === 24;
  
  // Try Sequelize first if available
  try {
    const sequelizeAvailable = await isSequelizeAvailable();
    
    if (sequelizeAvailable && !isMongoId) {
      // Try Sequelize user lookup
      const user = await User.findByPk(sequelizeUserId, {
        attributes: {
          exclude: ['password']
        },
        include: [
          {
            model: UserPoints,
            as: 'points',
            attributes: ['totalPoints']
          }
        ]
      });

      if (user) {
        // Get recognition badges
        let badges = [];
        try {
          const recognitions = await Recognition.findAll({
            where: { 
              receiverId: sequelizeUserId,
              badge: { [Op.ne]: null }
            },
            attributes: ['badge'],
            raw: true
          });
          badges = [...new Set(recognitions.map(r => r.badge).filter(Boolean))];
        } catch (error) {
          console.warn('Could not fetch badges:', error.message);
        }

        return {
          ...user.toJSON(),
          badges,
          points: user.points ? user.points.totalPoints : 0
        };
      }
    }
  } catch (error) {
    // If Sequelize fails, fall back to MongoDB
    if (error.name === 'SequelizeConnectionError' || 
        error.name === 'SequelizeConnectionRefusedError' ||
        error.message?.includes('role') ||
        error.message?.includes('does not exist')) {
      console.warn('PostgreSQL not available, using MongoDB fallback');
    } else {
      throw error;
    }
  }
  
  // Fallback to MongoDB user data
  if (isMongoId) {
    const mongoUser = await MongoUser.findById(userId).populate('roleId', 'name description');
    if (!mongoUser) {
      throw new Error('User not found');
    }
    
    // Map MongoDB user to profile format
    return {
      _id: mongoUser._id,
      id: mongoUser._id.toString(),
      name: mongoUser.displayName || `${mongoUser.firstName} ${mongoUser.lastName}`,
      email: mongoUser.email,
      avatar: mongoUser.avatar,
      department: mongoUser.department,
      designation: mongoUser.position,
      bio: null, // MongoDB schema doesn't have bio field
      badges: [],
      points: 0,
      role: mongoUser.roleId?.name || 'Employee',
      isActive: mongoUser.isActive
    };
  }
  
  throw new Error('User not found');
};

/**
 * Update user profile
 * Handles both Sequelize and MongoDB users
 */
const updateProfile = async (userId, updateData) => {
  const isMongoId = mongoose.Types.ObjectId.isValid(userId) && userId.length === 24;
  
  // Try Sequelize first if available
  try {
    const sequelizeAvailable = await isSequelizeAvailable();
    
    if (sequelizeAvailable) {
      let sequelizeUserId;
      try {
        sequelizeUserId = await convertToSequelizeUserId(userId);
      } catch (convertError) {
        // If conversion fails (e.g., Sequelize user doesn't exist), fall through to MongoDB
        console.warn('Could not convert to Sequelize user, using MongoDB:', convertError.message);
        sequelizeUserId = userId;
      }
      
      // Only try Sequelize if we got a valid UUID back (not MongoDB ID)
      if (!isMongoId || sequelizeUserId !== userId) {
        const user = await User.findByPk(sequelizeUserId);
        if (user) {
          const { designation, department, bio, interests, avatar } = updateData;

          if (designation !== undefined) user.designation = designation;
          if (department !== undefined) user.department = department;
          if (bio !== undefined) user.bio = bio;
          if (interests !== undefined) user.interests = interests;
          if (avatar !== undefined) user.avatar = avatar;

          await user.save();
          return user.toSafeObject ? user.toSafeObject() : user.toJSON();
        }
      }
    }
  } catch (error) {
    // If Sequelize fails, fall back to MongoDB
    if (error.name === 'SequelizeConnectionError' || 
        error.name === 'SequelizeConnectionRefusedError' ||
        error.message?.includes('role') ||
        error.message?.includes('does not exist')) {
      console.warn('PostgreSQL not available, using MongoDB fallback for update');
    } else if (error.message !== 'User not found' && !isMongoId) {
      // Re-throw if it's not a connection error and not a MongoDB ID (which we can fall back to)
      throw error;
    }
  }
  
  // Fallback to MongoDB user update
  if (isMongoId) {
    const mongoUser = await MongoUser.findById(userId);
    if (!mongoUser) {
      throw new Error('User not found');
    }
    
    const { designation, department, bio, interests, avatar } = updateData;
    
    // Map Sequelize fields to MongoDB fields
    if (designation !== undefined) mongoUser.position = designation;
    if (department !== undefined) mongoUser.department = department;
    if (avatar !== undefined) mongoUser.avatar = avatar;
    // Note: MongoDB schema doesn't have bio or interests fields
    
    await mongoUser.save();
    
    // Return updated user in profile format
    return {
      _id: mongoUser._id,
      id: mongoUser._id.toString(),
      name: mongoUser.displayName || `${mongoUser.firstName} ${mongoUser.lastName}`,
      email: mongoUser.email,
      avatar: mongoUser.avatar,
      department: mongoUser.department,
      designation: mongoUser.position,
      bio: null,
      badges: [],
      points: 0,
      role: mongoUser.roleId?.name || 'Employee',
      isActive: mongoUser.isActive
    };
  }
  
  throw new Error('User not found');
};

/**
 * Search employee directory
 */
const searchDirectory = async (options = {}) => {
  const { search, department, page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  const where = {
    isActive: true
  };

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { designation: { [Op.iLike]: `%${search}%` } },
      { department: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (department) {
    where.department = department;
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: {
      exclude: ['password']
    },
    include: [
      {
        model: UserPoints,
        as: 'points',
        attributes: ['totalPoints']
      }
    ],
    order: [['name', 'ASC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  return {
    users: rows.map(user => ({
      ...user.toJSON(),
      points: user.points ? user.points.totalPoints : 0
    })),
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(count / limit)
    }
  };
};

/**
 * Get user's recognition badges
 */
const getUserBadges = async (userId) => {
  const sequelizeUserId = await convertToSequelizeUserId(userId);
  const recognitions = await Recognition.findAll({
    where: { 
      receiverId: sequelizeUserId,
      badge: { [Op.ne]: null }
    },
    attributes: [
      'badge',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    group: ['badge'],
    order: [[Sequelize.literal('count'), 'DESC']]
  });

  return recognitions.map(r => ({
    badge: r.badge,
    count: parseInt(r.dataValues.count)
  }));
};

module.exports = {
  getProfileById,
  updateProfile,
  searchDirectory,
  getUserBadges
};

