const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * User Mapping Utilities - MongoDB Only
 */

/**
 * Validate and return MongoDB User ObjectId
 */
const getMongoUserId = async (userId) => {
  try {
    if (!userId) {
      throw new Error('Invalid user ID');
    }

    // Check if it's already a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(userId)) {
      return new mongoose.Types.ObjectId(userId);
    }

    throw new Error('Invalid MongoDB user ID format');
  } catch (error) {
    logger.error('Error in getMongoUserId', { error: error.message });
    throw error;
  }
};

module.exports = {
  getMongoUserId
};
