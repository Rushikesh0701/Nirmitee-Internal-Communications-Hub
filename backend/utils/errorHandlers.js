/**
 * Common error handling utilities
 */
const logger = require('./logger');

/**
 * Check if error is a database connection error
 */
const isDatabaseError = (error) => {
  return (
    error.name === 'MongoServerError' ||
    error.name === 'MongooseError' ||
    error.message?.includes('ECONNREFUSED') ||
    error.message?.includes('connection')
  );
};

module.exports = {
  isDatabaseError
};

