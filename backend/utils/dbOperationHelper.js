/**
 * Database Operation Helper
 * Ensures all write operations (CREATE/UPDATE/DELETE) actually save to database
 * and fail loudly if database is unavailable
 */

const logger = require('./logger');

/**
 * Ensure database operation succeeded
 * Throws error if operation failed or database is unavailable
 */
const ensureDbOperation = async (operation, operationName) => {
  try {
    const result = await operation();
    
    // Verify result exists (for create operations)
    if (!result) {
      throw new Error(`${operationName} failed: No result returned`);
    }
    
    // For create operations, verify ID exists
    if (operationName.includes('create') && !result.id && !result._id) {
      throw new Error(`${operationName} failed: Created entity has no ID`);
    }
    
    logger.info(`✅ ${operationName} successful`, {
      id: result.id || result._id,
      type: operationName
    });
    
    return result;
  } catch (error) {
    // Check if it's a database connection error
    if (error.name === 'SequelizeConnectionError' ||
        error.name === 'SequelizeConnectionRefusedError' ||
        error.name === 'MongoServerError' ||
        error.name === 'MongooseError' ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('connection')) {
      
      logger.error(`❌ Database unavailable for ${operationName}`, {
        error: error.message,
        operation: operationName
      });
      
      throw new Error(
        `Database connection required. ${operationName} failed because database is unavailable. ` +
        `Please ensure PostgreSQL and MongoDB are running.`
      );
    }
    
    // Re-throw other errors
    throw error;
  }
};

/**
 * Verify entity was saved to database
 */
const verifyEntitySaved = (entity, entityName) => {
  if (!entity) {
    throw new Error(`${entityName} was not created`);
  }
  
  if (!entity.id && !entity._id) {
    throw new Error(`${entityName} was created but has no ID`);
  }
  
  return true;
};

module.exports = {
  ensureDbOperation,
  verifyEntitySaved
};

