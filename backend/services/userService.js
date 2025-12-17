const { User, Role } = require('../models');
const { ROLES } = require('../constants/roles');

const getAllUsers = async (options, currentUser) => {
  const { page = 1, limit = 10, role, department, search } = options;
  const skip = (page - 1) * limit;

  // Check permissions
  if (!['Admin', 'Moderator'].includes(currentUser.roleId?.name || currentUser.Role?.name)) {
    throw new Error('Unauthorized');
  }

  const query = { isActive: true };

  if (role) {
    const roleRecord = await Role.findOne({ name: role });
    if (roleRecord) query.roleId = roleRecord._id;
  }

  if (department) query.department = department;

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .populate('roleId', 'name description')
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip),
    User.countDocuments(query)
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

const getUserById = async (id, currentUser) => {
  const user = await User.findById(id)
    .populate('roleId', 'name description')
    .select('-password');

  if (!user) {
    throw new Error('User not found');
  }

  // Users can view their own profile, Admins/Moderators can view any
  if (user._id.toString() !== currentUser._id.toString() && !['Admin', 'Moderator'].includes(currentUser.roleId?.name || currentUser.Role?.name)) {
    throw new Error('Unauthorized');
  }

  return user;
};

const updateUser = async (id, updateData, currentUser) => {
  const user = await User.findById(id);
  if (!user) {
    throw new Error('User not found');
  }

  // Users can update their own profile (except role), Admins can update anyone
  if (user._id.toString() !== currentUser._id.toString() && (currentUser.roleId?.name || currentUser.Role?.name) !== ROLES.ADMIN) {
    throw new Error('Unauthorized');
  }

  // Remove roleId from updateData if user is not admin
  if ((currentUser.roleId?.name || currentUser.Role?.name) !== ROLES.ADMIN && updateData.roleId) {
    delete updateData.roleId;
  }

  Object.assign(user, updateData);
  await user.save();
  return await User.findById(user._id)
    .populate('roleId', 'name description')
    .select('-password');
};

const updateUserRole = async (id, roleId, currentUser) => {
  if ((currentUser.roleId?.name || currentUser.Role?.name) !== ROLES.ADMIN) {
    throw new Error('Unauthorized');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new Error('User not found');
  }

  user.roleId = roleId;
  await user.save();
  return await User.findById(user._id)
    .populate('roleId', 'name description')
    .select('-password');
};

/**
 * Search users for mentions (public for authenticated users)
 */
const searchUsersForMentions = async (searchQuery, limit = 10) => {
  const query = { isActive: true };

  if (searchQuery) {
    query.$or = [
      { firstName: { $regex: searchQuery, $options: 'i' } },
      { lastName: { $regex: searchQuery, $options: 'i' } },
      { displayName: { $regex: searchQuery, $options: 'i' } },
      { email: { $regex: searchQuery, $options: 'i' } }
    ];
  }

  const users = await User.find(query)
    .select('firstName lastName displayName email avatar')
    .limit(limit)
    .sort({ firstName: 1, lastName: 1 });

  return users;
};

/**
 * Soft delete a user (marks as deleted, can be restored)
 */
const softDeleteUser = async (id, currentUser) => {
  if ((currentUser.roleId?.name || currentUser.Role?.name) !== ROLES.ADMIN) {
    throw new Error('Unauthorized');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new Error('User not found');
  }

  // Prevent deleting yourself
  if (user._id.toString() === currentUser._id.toString()) {
    throw new Error('You cannot delete your own account');
  }

  // Soft delete: mark as inactive and set deletedAt
  user.isActive = false;
  user.deletedAt = new Date();
  user.deletedBy = currentUser._id;
  await user.save();

  return user;
};

/**
 * Restore a soft-deleted user (undo deletion)
 */
const restoreUser = async (id, currentUser) => {
  if ((currentUser.roleId?.name || currentUser.Role?.name) !== ROLES.ADMIN) {
    throw new Error('Unauthorized');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new Error('User not found');
  }

  if (!user.deletedAt) {
    throw new Error('User is not deleted');
  }

  // Restore user
  user.isActive = true;
  user.deletedAt = undefined;
  user.deletedBy = undefined;
  await user.save();

  return user;
};

/**
 * Permanently delete a user (cannot be undone)
 */
const permanentDeleteUser = async (id, currentUser) => {
  if ((currentUser.roleId?.name || currentUser.Role?.name) !== ROLES.ADMIN) {
    throw new Error('Unauthorized');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new Error('User not found');
  }

  // Prevent deleting yourself
  if (user._id.toString() === currentUser._id.toString()) {
    throw new Error('You cannot delete your own account');
  }

  // Permanently delete
  await User.findByIdAndDelete(id);

  return { message: 'User permanently deleted' };
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserRole,
  searchUsersForMentions,
  softDeleteUser,
  restoreUser,
  permanentDeleteUser
};
