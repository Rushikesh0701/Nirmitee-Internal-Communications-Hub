/**
 * Helper wrapper for user mapping with consistent error handling
 */

const { getMongoUserId } = require('./userMapping');
const logger = require('./logger');

/**
 * Get MongoDB user ID with consistent error handling
 * @param {string} userId - User ID string
 * @returns {Promise<string>} MongoDB ObjectId
 * @throws {Error} If user mapping fails
 */
const getMongoUserIdSafe = async (userId) => {
  try {
    return await getMongoUserId(userId);
  } catch (error) {
    throw new Error(
      error.message || 'Valid authentication required. Please login.'
    );
  }
};

module.exports = {
  getMongoUserIdSafe
};
