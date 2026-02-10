const { User } = require('../models'); // MongoDB User model
const { Role } = require('../models');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { createClerkClient } = require('@clerk/clerk-sdk-node');
const fs = require('fs');
const path = require('path');

const DEBUG_LOG_PATH = path.join(__dirname, '../debug_sso.txt');

const writeDebugLog = (message, data = {}) => {
  try {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message} ${JSON.stringify(data)}\n`;
    fs.appendFileSync(DEBUG_LOG_PATH, logLine);
  } catch (e) {
    console.error('Failed to write debug log', e);
  }
};

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

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
  const { email, password, firstName, lastName, name } = userData;

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

  // Use provided firstName and lastName, or parse from name field as fallback
  let userFirstName = firstName;
  let userLastName = lastName;

  if (!userFirstName || !userLastName) {
    // Fallback: parse from 'name' field or email
    const nameParts = (name || email.split('@')[0]).trim().split(' ');
    userFirstName = userFirstName || nameParts[0] || 'User';
    userLastName = userLastName || nameParts.slice(1).join(' ') || 'User';
  }

  // Create user in MongoDB
  const user = await User.create({
    email: email.toLowerCase(),
    password,
    firstName: userFirstName,
    lastName: userLastName,
    displayName: `${userFirstName} ${userLastName}`,  // Always use firstName + lastName
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
const login = async (email, password, metadata = {}) => {
  const user = await User.findOne({ email: email.toLowerCase() })
    .populate('roleId', 'name description');

  if (!user) {
    return null;
  }

  // Check if account is locked
  if (user.isLocked) {
    // Record the lock attempt
    await user.incrementLoginAttempts('account_locked', metadata);
    const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60); // minutes
    throw new Error(`Account is locked due to too many failed login attempts. Please try again in ${lockTimeRemaining} minute(s).`);
  }

  if (!user.isActive) {
    await user.incrementLoginAttempts('account_inactive', metadata);
    throw new Error('Account is inactive');
  }

  // Check password (skip for OAuth users)
  if (user.password) {
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment login attempts on failed password
      await user.incrementLoginAttempts('invalid_password', metadata);
      return null;
    }
  } else {
    // OAuth user trying to login with password
    await user.incrementLoginAttempts('oauth_required', metadata);
    throw new Error('Please use OAuth login');
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0 || user.lockUntil) {
    await user.resetLoginAttempts();
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

  /* 
  // Temporarily disable for debugging Clerk SSO
  if (!email.toLowerCase().endsWith('@nirmitee.io')) {
    throw new Error('Only @nirmitee.io email addresses are allowed');
  }
  */

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

/**
 * Synchronize a user from Clerk data
 * This is called automatically when a Clerk token is verified
 */
const syncClerkUser = async (clerkData) => {
  const { email, clerkId, name, avatar } = clerkData;

  // ENFORCE @nirmitee.io email domain restriction
  if (!email || !email.toLowerCase().endsWith('@nirmitee.io')) {
    logger.warn('Clerk SSO attempt from unauthorized domain:', { email });
    throw new Error('Only @nirmitee.io email addresses are allowed');
  }

  // Find or create user
  let user = await User.findOne({
    $or: [
      { email: email.toLowerCase() },
      { oauthId: clerkId, oauthProvider: 'clerk' }
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

    // Parse name if needed
    const nameParts = (name || email.split('@')[0]).trim().split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    // Create new user from Clerk data
    user = await User.create({
      email: email.toLowerCase(),
      firstName,
      lastName,
      displayName: name || `${firstName} ${lastName}`,
      avatar,
      oauthProvider: 'clerk',
      oauthId: clerkId,
      roleId: role._id,
      isActive: true
    });

    logger.info('New user provisioned via Clerk:', { email, clerkId });

    // Re-fetch to get populated role
    user = await User.findById(user._id).populate('roleId', 'name description');
  } else {
    // Update info if it's their first time with Clerk but they existed before
    let needsSave = false;
    if (!user.oauthProvider || user.oauthProvider !== 'clerk') {
      user.oauthProvider = 'clerk';
      user.oauthId = clerkId;
      needsSave = true;
    }

    if (avatar && user.avatar !== avatar) {
      user.avatar = avatar;
      needsSave = true;
    }

    if (needsSave) {
      await user.save();
    }

    user.lastLogin = new Date();
    await user.save();
  }

  return user;
};

/**
 * Verify Clerk session token and return synchronized user
 */
const verifyClerkToken = async (sessionToken) => {
  const logId = Math.random().toString(36).substring(7);
  writeDebugLog(`[${logId}] Starting Clerk token verification`, { tokenLength: sessionToken?.length });

  try {
    let session;
    try {
      // Verify the session token using Clerk SDK
      session = await clerk.verifyToken(sessionToken);
    } catch (tokenError) {
      writeDebugLog(`[${logId}] Token verification failed`, { error: tokenError.message });
      return { success: false, error: 'Invalid Clerk token', isTerminal: false };
    }

    if (!session) {
      writeDebugLog(`[${logId}] No session returned`);
      return { success: false, error: 'Invalid Clerk token', isTerminal: false };
    }

    writeDebugLog(`[${logId}] Token verified`, { sub: session.sub });

    // Get full user profile from Clerk
    const clerkUser = await clerk.users.getUser(session.sub);

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    writeDebugLog(`[${logId}] Fetched Clerk user`, { email });

    const clerkData = {
      clerkId: clerkUser.id,
      email: email,
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
      avatar: clerkUser.imageUrl
    };

    // Synchronize user to our database
    try {
      const user = await syncClerkUser(clerkData);
      writeDebugLog(`[${logId}] User synced successfully`, { userId: user._id });

      return {
        success: true,
        user
      };
    } catch (syncError) {
      writeDebugLog(`[${logId}] Sync failed (TERMINAL)`, { error: syncError.message });
      // Return as terminal error so middleware doesn't fall back to JWT
      return {
        success: false,
        error: syncError.message,
        isTerminal: true
      };
    }

  } catch (error) {
    writeDebugLog(`[${logId}] Unexpected error`, { error: error.message, stack: error.stack });
    logger.error('Clerk token verification failed deep dive:', {
      error: error.message,
      stack: error.stack,
      tokenPresent: !!sessionToken
    });
    return {
      success: false,
      error: error.message || 'Token verification failed'
    };
  }
};

module.exports = {
  register,
  login,
  oauthLogin,
  syncClerkUser,
  verifyClerkToken,
  logout,
  logoutAll,
  generateTokens
};
