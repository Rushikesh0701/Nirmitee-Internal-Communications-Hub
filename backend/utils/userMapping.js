const mongoose = require('mongoose');
const { User: MongoUser } = require('../models');

/**
 * SIMPLIFIED USER MAPPING - MongoDB Only
 * Since we're now using MongoDB exclusively, this file is simplified
 */

/**
 * Validate and return MongoDB User ObjectId
 */
const getMongoUserId = async (userId) => {
  try {
    // Handle dummy user IDs in development mode
    if (!userId || userId === 'dummy-user-id-123') {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using dummy user ID in development mode');
        // Return a valid ObjectId for dummy user
        return new mongoose.Types.ObjectId();
      }
      throw new Error('Invalid user ID');
    }

    // Check if it's already a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(userId)) {
      return new mongoose.Types.ObjectId(userId);
    }

    throw new Error('Invalid MongoDB user ID format');
  } catch (error) {
    console.error('Error in getMongoUserId:', error.message);
    throw error;
  }
};

/**
 * Alias for backward compatibility
 */
const getSequelizeUserId = async (mongoUserId) => {
  // Since we're MongoDB only now, just return the MongoDB ID
  return getMongoUserId(mongoUserId);
};

module.exports = {
  getMongoUserId,
  getSequelizeUserId // Kept for backward compatibility
};
