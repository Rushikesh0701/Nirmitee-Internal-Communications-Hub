const { ROLES } = require('../constants/roles');

/**
 * Check if user has one of the allowed roles
 */
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const userRole = req.userRole || req.user.role;
    
    // Normalize role names (handle both 'ADMIN' and 'Admin' formats)
    const normalizedUserRole = userRole?.toUpperCase();
    const normalizedAllowedRoles = allowedRoles.map(r => r.toUpperCase());
    
    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

/**
 * Check if user is Admin
 */
const isAdmin = checkRole(ROLES.ADMIN);

/**
 * Check if user is Moderator or Admin
 */
const isModerator = checkRole(ROLES.ADMIN, ROLES.MODERATOR);

/**
 * Check if user is Employee, Moderator, or Admin
 */
const isEmployee = checkRole(ROLES.ADMIN, ROLES.MODERATOR, ROLES.EMPLOYEE);

/**
 * Check if user can perform action based on ownership
 */
const checkOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const userRole = req.userRole || req.user.role;
    const normalizedUserRole = userRole?.toUpperCase();
    
    // Admin and Moderator can access any resource
    if (normalizedUserRole === 'ADMIN' || normalizedUserRole === 'MODERATOR') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.resource?.[resourceUserIdField] || req.params?.userId;
    if (resourceUserId && resourceUserId === req.userId) {
      return next();
    }

    return res.status(403).json({ 
      success: false, 
      message: 'You can only access your own resources' 
    });
  };
};

module.exports = {
  checkRole,
  isAdmin,
  isModerator,
  isEmployee,
  checkOwnership
};
