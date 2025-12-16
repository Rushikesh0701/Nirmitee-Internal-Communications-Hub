const authService = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/responseHelpers');
const { COOKIE_CONFIG } = require('../utils/constants');
const logger = require('../utils/logger');

// Removed fallback logic - app now requires database

const setAuthCookie = (res, userId) => {
  // Convert MongoDB ObjectId to string if needed
  const userIdString = userId?.toString ? userId.toString() : userId;
  res.cookie('userId', userIdString, COOKIE_CONFIG);
};

const setAuthTokens = (userId) => {
  const { accessToken, refreshToken } = authService.generateTokens(userId);
  return { accessToken, refreshToken };
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    const result = await authService.login(email, password);

    if (!result) {
      return sendError(res, 'Invalid credentials', 401);
    }

    // Generate JWT tokens
    const userId = result.user._id || result.user.id;
    const tokens = setAuthTokens(userId);

    // Also set cookie for backward compatibility
    setAuthCookie(res, userId);

    return sendSuccess(res, { user: result.user, ...tokens }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const oauthOutlook = async (req, res, next) => {
  try {
    const { email, name, avatar, oauthId } = req.body;

    // VALIDATE @nirmitee.io domain
    if (!email || !email.toLowerCase().endsWith('@nirmitee.io')) {
      return sendError(res, 'Access restricted to @nirmitee.io email addresses only', 403);
    }

    const result = await authService.oauthLogin({
      email,
      name,
      avatar,
      provider: 'outlook',
      oauthId: oauthId || email
    });

    // Generate JWT tokens
    const userId = result.user._id || result.user.id;
    const tokens = setAuthTokens(userId);

    // Also set cookie for backward compatibility
    setAuthCookie(res, userId);

    return sendSuccess(res, { user: result.user, ...tokens }, 'OAuth login successful');
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, 'Refresh token required', 400);
    }

    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

      const decoded = jwt.verify(refreshToken, JWT_SECRET);
      const tokens = setAuthTokens(decoded.userId);

      return sendSuccess(res, tokens, 'Token refreshed successfully');
    } catch (jwtError) {
      return sendError(res, 'Invalid or expired refresh token', 401);
    }
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout();
    res.clearCookie('userId');
    return sendSuccess(res, null, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    if (!req.userId) {
      return sendError(res, 'Not authenticated', 401);
    }

    const { User } = require('../models'); // MongoDB User model
    const user = await User.findById(req.userId).populate('roleId', 'name description');

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (!user.isActive) {
      return sendError(res, 'User account is inactive', 403);
    }

    return sendSuccess(res, { user: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    let user;

    try {
      // Create user in database
      user = await authService.register({ email, password, name });

      // Verify user was actually saved
      if (!user || !user._id) {
        logger.error('Registration failed: User object missing ID', { email });
        return sendError(res,
          'Registration failed: User was not saved to database. Please try again.',
          500
        );
      }

      logger.info('✅ User registered and saved to MongoDB', {
        email,
        userId: user._id,
        name: user.displayName || `${user.firstName} ${user.lastName}`
      });
    } catch (dbError) {
      // Database unavailable - FAIL LOUDLY, NO DUMMY MODE
      if (dbError.name === 'SequelizeConnectionError' ||
        dbError.name === 'SequelizeConnectionRefusedError' ||
        dbError.name === 'SequelizeDatabaseError' ||
        dbError.message?.includes('ECONNREFUSED') ||
        dbError.message?.includes('connection') ||
        dbError.message?.includes('database')) {
        logger.error('❌ Database connection failed during registration', {
          error: dbError.message,
          email,
          errorName: dbError.name
        });
        return sendError(res,
          'Database connection required. Please ensure PostgreSQL is running. User was NOT saved to database.',
          503
        );
      }

      // Other errors (like duplicate email) should be passed through
      logger.error('Registration error:', {
        error: dbError.message,
        email,
        errorName: dbError.name
      });
      throw dbError;
    }

    // User is already in MongoDB, no sync needed

    return sendSuccess(res, { user }, 'User registered successfully', 201);
  } catch (error) {
    if (error.message === 'User with this email already exists') {
      return sendError(res, error.message, 409);
    }
    next(error);
  }
};

module.exports = {
  login,
  oauthOutlook,
  refresh,
  logout,
  getMe,
  register
};
