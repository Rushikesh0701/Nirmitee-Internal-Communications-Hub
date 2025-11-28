/**
 * Database Fallback Helper
 * Centralizes the pattern of trying Sequelize/PostgreSQL first,
 * then falling back to MongoDB on database connection errors
 */

const logger = require('./logger');

/**
 * Check if an error is a database connection error
 * @param {Error} error - Error object to check
 * @returns {boolean} True if it's a database connection error
 */
const isDbConnectionError = (error) => {
  return (
    error.name === 'SequelizeConnectionError' ||
    error.name === 'SequelizeConnectionRefusedError' ||
    error.name === 'MongoServerError' ||
    error.message?.includes('ECONNREFUSED') ||
    error.message?.includes('Connection refused') ||
    error.message?.includes('role') ||
    error.message?.includes('does not exist')
  );
};

/**
 * Execute an operation with automatic MongoDB fallback
 * @param {Function} sequelizeOperation - Async function that uses Sequelize/PostgreSQL
 * @param {Function} mongoFallback - Async function that uses MongoDB
 * @param {string} operationName - Name of operation for logging
 * @returns {Promise<any>} Result from either Sequelize or MongoDB operation
 */
const withMongoFallback = async (sequelizeOperation, mongoFallback, operationName = 'Database operation') => {
  try {
    const result = await sequelizeOperation();
    return result;
  } catch (error) {
    if (isDbConnectionError(error)) {
      logger.warn(`${operationName}: PostgreSQL unavailable, using MongoDB fallback`, {
        error: error.message
      });
      return await mongoFallback();
    }
    // Re-throw if not a connection error
    throw error;
  }
};

/**
 * Check if Sequelize/PostgreSQL is available
 * @param {Object} sequelize - Sequelize instance
 * @returns {Promise<boolean>} True if available
 */
const isSequelizeAvailable = async (sequelize) => {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  isDbConnectionError,
  withMongoFallback,
  isSequelizeAvailable
};

