/**
 * Standardized response helpers for consistent API responses
 */

const sendSuccess = (res, data, message = null, statusCode = 200) => {
  const response = { success: true, data };
  if (message) response.message = message;
  return res.status(statusCode).json(response);
};

const sendError = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = {
  sendSuccess,
  sendError
};

