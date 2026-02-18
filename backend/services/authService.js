const { User, Role } = require('../models');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { createClerkClient } = require('@clerk/clerk-sdk-node');

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

/**
 * Helper: Generate access and refresh tokens
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
  return { accessToken, refreshToken };
};

/**
 * Helper: Get or create a role by name
 */
const getOrCreateRole = async (name, description = '') => {
  let role = await Role.findOne({ name });
  if (!role) {
    role = await Role.create({
      name,
      description: description || `Default ${name} role`
    });
  }
  return role;
};

/**
 * Helper: Map Clerk user data (metadata/orgs) to application role
 */
const mapClerkUserToAppRole = async (clerkUser) => {
  // 1. Check Public Metadata (Highest priority)
  const metadataRole = clerkUser.publicMetadata?.role;
  if (metadataRole) {
    const normalized = metadataRole.toString().toLowerCase();
    if (normalized === 'admin') return 'Admin';
    if (normalized === 'moderator') return 'Moderator';
  }

  // 2. Check Organization Memberships (Fallback)
  try {
    const memberships = await clerk.users.getOrganizationMembershipList({ userId: clerkUser.id });
    if (memberships.some(m => ['org:admin', 'admin'].includes(m.role))) return 'Admin';
    if (memberships.some(m => ['org:moderator', 'moderator'].includes(m.role))) return 'Moderator';
  } catch (err) {
    logger.warn(`Failed to fetch memberships for user ${clerkUser.id}: ${err.message}`);
  }

  return 'Employee';
};

/**
 * Helper: Ensure user is in the default organization
 */
const ensureDefaultOrganization = async (clerkUser, email) => {
  try {
    const DEFAULT_ORG_ID = process.env.CLERK_ORGANIZATION_ID || 'org_39Ta00yBEDXWf5FIvx5j6xIA8uu';
    if (!email.toLowerCase().endsWith('@nirmitee.io')) return;

    const memberships = await clerk.users.getOrganizationMembershipList({ userId: clerkUser.id });
    const isMember = memberships.some(m => m.organization.id === DEFAULT_ORG_ID);

    if (!isMember) {
      logger.info(`Adding user ${clerkUser.id} to default organization ${DEFAULT_ORG_ID}`);
      await clerk.organizations.createOrganizationMembership({
        organizationId: DEFAULT_ORG_ID,
        userId: clerkUser.id,
        role: 'basic_member',
      });
    }
  } catch (err) {
    logger.warn(`Organization check/assignment failed for ${clerkUser.id}: ${err.message}`);
  }
};

/**
 * Helper: Revoke all other active sessions for a user
 */
const revokeOtherSessions = async (userId, currentSessionId) => {
  try {
    const sessions = await clerk.sessions.getSessionList({ userId, status: 'active' });
    for (const s of sessions) {
      if (s.id !== currentSessionId) {
        await clerk.sessions.revokeSession(s.id);
        logger.info(`Revoked old session ${s.id} for user ${userId}`);
      }
    }
  } catch (err) {
    logger.error('Session revocation error:', err.message);
  }
};

/**
 * Register a new user
 */
const register = async (userData) => {
  const { email, password, firstName, lastName, name } = userData;

  if (!email || !email.toLowerCase().endsWith('@nirmitee.io')) {
    throw new Error('Only @nirmitee.io email addresses are allowed');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) throw new Error('User with this email already exists');

  const role = await getOrCreateRole('Employee');

  const nameParts = (name || email.split('@')[0]).trim().split(' ');
  const userFirstName = firstName || nameParts[0] || 'User';
  const userLastName = lastName || nameParts.slice(1).join(' ') || 'User';

  const user = await User.create({
    email: email.toLowerCase(),
    password,
    firstName: userFirstName,
    lastName: userLastName,
    displayName: `${userFirstName} ${userLastName}`,
    roleId: role._id,
    isActive: true
  });

  return user.toJSON();
};

/**
 * Login user with email and password
 */
const login = async (email, password, metadata = {}) => {
  const user = await User.findOne({ email: email.toLowerCase() })
    .populate('roleId', 'name description');

  if (!user) return null;

  if (user.isLocked) {
    await user.incrementLoginAttempts('account_locked', metadata);
    const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
    throw new Error(`Account locked. Try again in ${lockTimeRemaining} minute(s).`);
  }

  if (!user.isActive) {
    await user.incrementLoginAttempts('account_inactive', metadata);
    throw new Error('Account is inactive');
  }

  if (user.password) {
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts('invalid_password', metadata);
      return null;
    }
  } else {
    await user.incrementLoginAttempts('oauth_required', metadata);
    throw new Error('Please use OAuth login');
  }

  if (user.loginAttempts > 0 || user.lockUntil) {
    await user.resetLoginAttempts();
  }

  user.lastLogin = new Date();
  await user.save();

  return { user: user.toJSON() };
};

/**
 * OAuth login placeholder
 */
const oauthLogin = async (oauthData) => {
  const { email, name, avatar, provider, oauthId } = oauthData;

  if (!email || !email.toLowerCase().endsWith('@nirmitee.io')) {
    logger.warn('OAuth login attempt from unauthorized domain:', { email });
    throw new Error('Only @nirmitee.io email addresses are allowed');
  }

  let user = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { oauthId, oauthProvider: provider }]
  }).populate('roleId', 'name description');

  if (!user) {
    const role = await getOrCreateRole('Employee');
    const nameParts = (name || email.split('@')[0]).trim().split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || 'User';

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
    if (!user.oauthProvider) {
      user.oauthProvider = provider;
      user.oauthId = oauthId;
      if (avatar) user.avatar = avatar;
    }
    user.lastLogin = new Date();
    await user.save();
  }

  if (!user.isActive) throw new Error('Account is inactive');

  return { user: user.toJSON() };
};

/**
 * Synchronize a user from Clerk data
 */
const syncClerkUser = async (clerkData) => {
  const { email, clerkId, name, avatar, roleName } = clerkData;

  if (!email || !email.toLowerCase().endsWith('@nirmitee.io')) {
    logger.warn('Clerk SSO attempt from unauthorized domain:', { email });
    throw new Error('Only @nirmitee.io email addresses are allowed');
  }

  const targetRole = await getOrCreateRole(roleName || 'Employee');

  let user = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { oauthId: clerkId, oauthProvider: 'clerk' }]
  }).populate('roleId', 'name description');

  if (!user) {
    const nameParts = (name || email.split('@')[0]).trim().split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    user = await User.create({
      email: email.toLowerCase(),
      firstName,
      lastName,
      displayName: name || `${firstName} ${lastName}`,
      avatar,
      oauthProvider: 'clerk',
      oauthId: clerkId,
      roleId: targetRole._id,
      isActive: true
    });
    logger.info('New user provisioned via Clerk:', { email, clerkId });
    user = await User.findById(user._id).populate('roleId', 'name description');
  } else {
    let needsSave = false;
    if (user.oauthProvider !== 'clerk') {
      user.oauthProvider = 'clerk';
      user.oauthId = clerkId;
      needsSave = true;
    }
    if (avatar && user.avatar !== avatar) {
      user.avatar = avatar;
      needsSave = true;
    }

    if (targetRole && user.roleId?._id.toString() !== targetRole._id.toString()) {
      const oldRole = user.roleId?.name || 'none';
      user.roleId = targetRole._id;
      needsSave = true;
      logger.info(`Synchronized user role for ${email}: ${oldRole} -> ${targetRole.name}`);
    }

    if (needsSave) {
      await user.save();
      user = await User.findById(user._id).populate('roleId', 'name description');
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
  try {
    let session;
    try {
      session = await clerk.verifyToken(sessionToken);
    } catch (err) {
      return { success: false, error: 'Invalid Clerk token', isTerminal: false };
    }

    if (!session) return { success: false, error: 'Invalid Clerk token', isTerminal: false };

    const clerkUser = await clerk.users.getUser(session.sub);
    const email = clerkUser.emailAddresses[0]?.emailAddress;

    // Delegate role mapping and organization management
    const appRole = await mapClerkUserToAppRole(clerkUser);
    await ensureDefaultOrganization(clerkUser, email);
    await revokeOtherSessions(clerkUser.id, session.sid);

    const user = await syncClerkUser({
      clerkId: clerkUser.id,
      email,
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
      avatar: clerkUser.imageUrl,
      roleName: appRole
    });

    return { success: true, user };
  } catch (error) {
    logger.error('Clerk verification failed:', error);
    return { success: false, error: error.message, isTerminal: error.message.includes('allowed') };
  }
};

const logout = async () => { };
const logoutAll = async () => { };

module.exports = {
  register,
  login,
  oauthLogin,
  syncClerkUser,
  verifyClerkToken,
  logout,
  logoutAll,
  revokeOtherSessions,
  generateTokens
};
