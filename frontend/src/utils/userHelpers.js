/**
 * User role helper functions
 * Provides consistent role checking across the application
 */

/**
 * Check if user is an admin
 * Handles multiple possible user object structures for compatibility
 * @param {Object} user - User object from auth store
 * @returns {boolean} - True if user is admin
 */
export const isAdmin = (user) => {
  if (!user) return false;
  
  // Check roleId.name (MongoDB populated role)
  if (user.roleId?.name === 'Admin') return true;
  
  // Check Role.name (alternative structure)
  if (user.Role?.name === 'Admin') return true;
  
  // Check role (direct string, case-insensitive)
  const role = user.role?.toUpperCase();
  if (role === 'ADMIN') return true;
  
  return false;
};

/**
 * Check if user is admin or moderator
 * @param {Object} user - User object from auth store
 * @returns {boolean} - True if user is admin or moderator
 */
export const isAdminOrModerator = (user) => {
  if (!user) return false;
  
  // Check roleId.name (MongoDB populated role)
  const roleName = user.roleId?.name || user.Role?.name;
  if (roleName === 'Admin' || roleName === 'Moderator') return true;
  
  // Check role (direct string, case-insensitive)
  const role = user.role?.toUpperCase();
  if (['ADMIN', 'MODERATOR'].includes(role)) return true;
  
  return false;
};

/**
 * Get user role name
 * @param {Object} user - User object from auth store
 * @returns {string|null} - Role name or null
 */
export const getUserRole = (user) => {
  if (!user) return null;
  
  return user.roleId?.name || user.Role?.name || user.role || null;
};


