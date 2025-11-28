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
    // Check for cookie-based auth first (backward compatibility)
    const userId = req.cookies?.userId;
    
    // Check for JWT in Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token && !userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login.'
      });
    }
    
    // If JWT token is present, use JWT authentication
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).populate('roleId', 'name description');
        
        if (!user || !user.isActive) {
          return res.status(401).json({
            success: false,
            message: 'Invalid authentication.'
          });
        }
        
        req.user = user.toJSON();
        req.userId = decoded.userId;
        req.userRole = user.roleId?.name || 'Employee';
        
        return next();
      } catch (jwtError) {
        if (jwtError.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Token expired. Please refresh.'
          });
        }
        return res.status(401).json({
          success: false,
          message: 'Authentication failed.'
        });
      }
    }
    
    // Fall back to cookie-based auth (backward compatibility)
    if (userId) {
      // Clean up userId - handle JSON-encoded values or extract from string
      let cleanUserId = userId;
      if (typeof userId === 'string') {
        if (userId.startsWith('j:"') && userId.endsWith('"')) {
          cleanUserId = userId.slice(3, -1);
        } else if (userId.startsWith('"') && userId.endsWith('"')) {
          cleanUserId = userId.slice(1, -1);
        }
        cleanUserId = cleanUserId.replace(/^["']|["']$/g, '');
      }
      
      try {
        const user = await User.findById(cleanUserId).populate('roleId', 'name description');
        
        if (!user || !user.isActive) {
          return res.status(401).json({
            success: false,
            message: 'Invalid authentication. Please login again.'
          });
        }
        
        req.user = user.toJSON();
        req.userId = cleanUserId;
        req.userRole = user.roleId?.name || 'Employee';
        
        return next();
      } catch (dbError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Database unavailable, allowing request with dummy user');
          req.userId = userId || 'dummy-user-id-123';
          req.userRole = 'Employee';
          req.user = {
            _id: userId || 'dummy-user-id-123',
            email: 'dummy@test.com',
            displayName: 'Dummy User',
            firstName: 'Dummy',
            lastName: 'User',
            isActive: true
          };
          return next();
        }
        return res.status(503).json({
          success: false,
          message: 'Service temporarily unavailable.'
        });
      }
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please login again.'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no auth
 */
const optionalAuth = async (req, res, next) => {
  try {
    const userId = req.cookies?.userId;
    if (userId) {
      const user = await User.findById(userId).populate('roleId', 'name description');
      if (user && user.isActive) {
        req.user = user.toJSON();
        req.userId = userId;
        req.userRole = user.roleId?.name || 'Employee';
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
