const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(e => e.message).join(', ');
    error = {
      message,
      statusCode: 400
    };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error = {
      message,
      statusCode: 400
    };
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = {
      message,
      statusCode: 404
    };
  }

  // Sequelize database connection errors - return dummy data instead of crashing
  if (err.name === 'SequelizeConnectionRefusedError' || 
      err.name === 'SequelizeConnectionError' ||
      err.message?.includes('ECONNREFUSED') ||
      err.message?.includes('Connection refused')) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ Database connection error (using dummy mode):', err.message);
      // Return dummy user data for auth endpoints
      if (err.config?.url?.includes('/auth/me')) {
        return res.status(200).json({
          success: true,
          message: 'Database unavailable - using dummy data',
          data: {
            user: {
              id: 'dummy-user-id-123',
              email: 'dummy@test.com',
              name: 'Dummy User',
              role: 'EMPLOYEE',
              isActive: true
            }
          }
        });
      }
    }
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
