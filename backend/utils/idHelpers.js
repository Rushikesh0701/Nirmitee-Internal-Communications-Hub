/**
 * ID Helper Utilities
 * Centralizes ID extraction and comparison logic for MongoDB
 */

const mongoose = require('mongoose');

/**
 * Extract ID from various formats (MongoDB ObjectId or plain string)
 * @param {any} entity - Entity or ID to extract from
 * @returns {string|null} Extracted ID or null
 */
const extractId = (entity) => {
  if (!entity) return null;

  // If it's already a string, return it
  if (typeof entity === 'string') return entity;

  return entity._id?.toString() || entity.id?.toString() || entity.toString();
};

/**
 * Compare two IDs safely, handling different formats
 * @param {any} id1 - First ID
 * @param {any} id2 - Second ID
 * @returns {boolean} True if IDs match
 */
const compareIds = (id1, id2) => {
  const extractedId1 = extractId(id1);
  const extractedId2 = extractId(id2);

  if (!extractedId1 || !extractedId2) return false;

  return extractedId1 === extractedId2;
};

/**
 * Check if a string is a valid MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid MongoDB ObjectId
 */
const isValidMongoId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && id.length === 24;
};

/**
 * Validate that an ID is a valid MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid
 */
const isValidId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return isValidMongoId(id);
};

/**
 * Extract and validate an ID
 * @param {any} entity - Entity or ID to extract from
 * @param {string} errorMessage - Custom error message if invalid
 * @throws {Error} If ID is invalid
 * @returns {string} Valid ID
 */
const extractAndValidateId = (entity, errorMessage = 'Invalid ID format') => {
  const id = extractId(entity);
  if (!id || !isValidId(id)) {
    throw new Error(errorMessage);
  }
  return id;
};

module.exports = {
  extractId,
  compareIds,
  isValidMongoId,
  isValidId,
  extractAndValidateId
};
