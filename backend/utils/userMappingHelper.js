/**
 * Helper wrapper for user mapping with consistent error handling
 */

const { getMongoUserId, getSequelizeUserId } = require('./userMapping');

/**
 * Get MongoDB user ID from Sequelize user ID with consistent error handling
 * @param {string} sequelizeUserId - Sequelize user UUID
 * @returns {Promise<string>} MongoDB ObjectId
 * @throws {Error} If user mapping fails
 */
const getMongoUserIdSafe = async (sequelizeUserId) => {
  try {
    return await getMongoUserId(sequelizeUserId);
  } catch (error) {
    throw new Error(
      error.message || 'Valid authentication required. Please login.'
    );
  }
};

/**
 * Get Sequelize user ID from MongoDB user ID with consistent error handling
 * @param {string} mongoUserId - MongoDB ObjectId
 * @returns {Promise<string>} Sequelize user UUID
 * @throws {Error} If user mapping fails
 */
const getSequelizeUserIdSafe = async (mongoUserId) => {
  try {
    return await getSequelizeUserId(mongoUserId);
  } catch (error) {
    console.warn(`Could not map MongoDB user ${mongoUserId} to Sequelize:`, error.message);
    return null; // Return null instead of throwing to allow graceful degradation
  }
};

module.exports = {
  getMongoUserIdSafe,
  getSequelizeUserIdSafe
};

