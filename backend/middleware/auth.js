const { User } = require('../models'); // MongoDB User model
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Authenticate user with JWT token
 * Reads JWT from Authorization header
 * REQUIRES LOGIN - Returns 401 if not authenticated
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('[Middleware] Auth Check:', {
      path: req.path,
      method: req.method,
      hasAuthIndex: !!authHeader,
      tokenLength: token ? token.length : 0,
      clerkKeyPresent: !!process.env.CLERK_SECRET_KEY
    });

    // 1. Check for Clerk Token (Native Integration)
    // Clerk tokens are typically long and have a specific structure, 
    // but the most reliable way is to try verifying them if we have a secret key.
    if (token && process.env.CLERK_SECRET_KEY) {
      const authService = require('../services/authService');
      const verification = await authService.verifyClerkToken(token);

      if (verification.success) {
        const user = verification.user;
        req.user = user.toJSON ? user.toJSON() : user;
        req.userId = user._id || user.id;
        req.userRole = user.roleId?.name || (typeof user.roleId === 'object' ? user.roleId.name : 'Employee');
        req.authProvider = 'clerk';
        return next();
      }

      // CRITICAL: If Clerk said "valid token but forbidden user" (e.g. domain mismatch),
      // stop here and return 403. Do not fall back to JWT.
      if (verification.isTerminal) {
        return res.status(403).json({
          success: false,
          message: verification.error || 'Access denied'
        });
      }
    }

    // 2. Fall back to standard JWT authentication
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).populate('roleId', 'name description');

        if (user && user.isActive) {
          req.user = user.toJSON();
          req.userId = decoded.userId;
          req.userRole = user.roleId?.name || 'Employee';
          req.authProvider = 'jwt';
          return next();
        }
      } catch (jwtError) {
        // Only return 401 if it's NOT a Clerk token that just failed
        // (to avoid double 401s if we're doing complex logic)
        if (jwtError.name === 'TokenExpiredError') {
          return res.status(401).json({ success: false, message: 'Token expired' });
        }
      }
    }

    // 3. Fall back to cookie-based auth (backward compatibility)
    const userId = req.cookies?.userId;
    if (userId) {
      let cleanUserId = userId;
      if (typeof userId === 'string') {
        cleanUserId = userId.replace(/^j:"|"|'/g, '');
      }

      try {
        const user = await User.findById(cleanUserId).populate('roleId', 'name description');
        if (user && user.isActive) {
          req.user = user.toJSON();
          req.userId = cleanUserId;
          req.userRole = user.roleId?.name || 'Employee';
          req.authProvider = 'cookie';
          return next();
        }
      } catch (dbError) {
        // Silent fail for DB issues in middleware, will hit 401 below
      }
    }

    // No valid auth found
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please login.'
    });

  } catch (error) {
    console.error('Middleware Auth Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server authentication error'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no auth
 * Checks both JWT tokens and cookies
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // 1. Try Clerk Token
    if (token && process.env.CLERK_SECRET_KEY) {
      try {
        const authService = require('../services/authService');
        const verification = await authService.verifyClerkToken(token);
        if (verification.success) {
          const user = verification.user;
          req.user = user.toJSON ? user.toJSON() : user;
          req.userId = user._id || user.id;
          req.userRole = user.roleId?.name || (typeof user.roleId === 'object' ? user.roleId.name : 'Employee');
          return next();
        }
      } catch (err) {
        // Ignore errors in optional auth
      }
    }

    // 2. Try standard JWT
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).populate('roleId', 'name description');
        if (user && user.isActive) {
          req.user = user.toJSON();
          req.userId = decoded.userId;
          req.userRole = user.roleId?.name || 'Employee';
          return next();
        }
      } catch (jwtError) {
        // Ignore errors in optional auth
      }
    }

    // 3. Try cookie-based auth
    const userId = req.cookies?.userId;
    if (userId) {
      try {
        let cleanUserId = userId;
        if (typeof userId === 'string') {
          cleanUserId = userId.replace(/^j:"|"|'/g, '');
        }
        const user = await User.findById(cleanUserId).populate('roleId', 'name description');
        if (user && user.isActive) {
          req.user = user.toJSON();
          req.userId = cleanUserId;
          req.userRole = user.roleId?.name || 'Employee';
        }
      } catch (error) {
        // Ignore errors in optional auth
      }
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};
