const { User } = require('../models'); // MongoDB User model
const { Role } = require('../models');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
  return { accessToken, refreshToken };
};

/**
 * Register a new user (using MongoDB)
 */
const register = async (userData) => {
  const { email, password, name } = userData;

  // ENFORCE @nirmitee.io email domain restriction
  if (!email || !email.toLowerCase().endsWith('@nirmitee.io')) {
    throw new Error('Only @nirmitee.io email addresses are allowed');
  }

  // Check if user exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Get or create Employee role
  let role = await Role.findOne({ name: 'Employee' });
  if (!role) {
    role = await Role.create({
      name: 'Employee',
      description: 'Default employee role'
    });
  }

  // Parse name into firstName and lastName
  const nameParts = (name || email.split('@')[0]).trim().split(' ');
  const firstName = nameParts[0] || 'User';
  const lastName = nameParts.slice(1).join(' ') || 'User';

  // Create user in MongoDB
  const user = await User.create({
    email: email.toLowerCase(),
    password,
    firstName,
    lastName,
    displayName: name || `${firstName} ${lastName}`,
    roleId: role._id,
    isActive: true
  });

  // Verify user was actually saved to database
  if (!user || !user._id) {
    throw new Error('Failed to create user in database - user object has no ID');
  }

  // Double-check by querying the database
  const verifyUser = await User.findById(user._id);
  if (!verifyUser) {
    throw new Error('User was created but cannot be found in database - transaction may have failed');
  }

  logger.info('User created and verified in MongoDB', {
    id: user._id,
    email: user.email,
    name: user.displayName,
    firstName: user.firstName,
    lastName: user.lastName
  });

  // Return user without password
  return user.toJSON();
};

/**
 * Login user with email and password (using MongoDB)
 */
const login = async (email, password) => {
  const user = await User.findOne({ email: email.toLowerCase() })
    .populate('roleId', 'name description');

  if (!user) {
    return null;
  }

  if (!user.isActive) {
    throw new Error('Account is inactive');
  }

  // Check password (skip for OAuth users)
  if (user.password) {
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return null;
    }
  } else {
    // OAuth user trying to login with password
    throw new Error('Please use OAuth login');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  return {
    user: user.toJSON()
  };
};

/**
 * OAuth login placeholder (Outlook Workspace) - using MongoDB
 */
const oauthLogin = async (oauthData) => {
  const { email, name, avatar, provider, oauthId } = oauthData;

  // Validate domain
  if (!email.toLowerCase().endsWith('@nirmitee.io')) {
    throw new Error('Only @nirmitee.io email addresses are allowed');
  }

  // Find or create user
  let user = await User.findOne({
    $or: [
      { email: email.toLowerCase() },
      { oauthId, oauthProvider: provider }
    ]
  }).populate('roleId', 'name description');

  if (!user) {
    // Get or create Employee role
    let role = await Role.findOne({ name: 'Employee' });
    if (!role) {
      role = await Role.create({
        name: 'Employee',
        description: 'Default employee role'
      });
    }

    // Parse name
    const nameParts = (name || email.split('@')[0]).trim().split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    // Create new OAuth user
    user = await User.create({
      email: email.toLowerCase(),
      firstName,
      lastName,
      displayName: name || `${firstName} ${lastName}`,
      avatar,
      oauthProvider: provider,
      oauthId,
      roleId: role._id,
      isActive: true
    });
  } else {
    // Update OAuth info if needed
    if (!user.oauthProvider) {
      user.oauthProvider = provider;
      user.oauthId = oauthId;
      if (avatar) user.avatar = avatar;
      await user.save();
    }
    user.lastLogin = new Date();
    await user.save();
  }

  if (!user.isActive) {
    throw new Error('Account is inactive');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  return {
    user: user.toJSON()
  };
};

/**
 * Logout user
 */
const logout = async () => {
  // No token cleanup needed
  return;
};

/**
 * Logout user from all devices
 */
const logoutAll = async (userId) => {
  // No token cleanup needed
  return;
};

module.exports = {
  register,
  login,
  oauthLogin,
  logout,
  logoutAll,
  generateTokens
};

