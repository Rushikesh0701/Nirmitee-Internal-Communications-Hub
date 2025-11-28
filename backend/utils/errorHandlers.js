/**
 * Common error handling utilities
 */
const logger = require('./logger');

/**
 * Check if error is a database connection error
 */
const isDatabaseError = (error) => {
  return (
    error.name === 'SequelizeConnectionRefusedError' ||
    error.name === 'SequelizeConnectionError' ||
    error.name === 'MongoServerError' ||
    error.name === 'MongooseError' ||
    error.message?.includes('ECONNREFUSED') ||
    error.message?.includes('connection')
  );
};

/**
 * Handle database errors with fallback to dummy data
 */
const handleDatabaseError = (error, dummyDataFn, queryParams) => {
  if (isDatabaseError(error)) {
    logger.warn('Database error, using dummy data', { error: error.message });
    return dummyDataFn(queryParams);
  }
  throw error;
};

module.exports = {
  isDatabaseError,
  handleDatabaseError
};

