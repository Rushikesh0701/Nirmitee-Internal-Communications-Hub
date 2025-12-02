const { User, UserPoints, Recognition, Role } = require('../models');
const mongoose = require('mongoose');

/**
 * Get user profile by ID (MongoDB only)
 */
const getProfileById = async (userId) => {
  const user = await User.findById(userId)
    .populate('roleId', 'name description')
    .select('-password');

  if (!user) {
    throw new Error('User not found');
  }

  // Get user points
  const userPoints = await UserPoints.findOne({ userId: user._id });

  // Get recognition badges
  const recognitions = await Recognition.find({
    receiverId: user._id,
    badge: { $ne: null }
  }).select('badge');

  const badges = [...new Set(recognitions.map(r => r.badge).filter(Boolean))];

  return {
    _id: user._id,
    id: user._id.toString(),
    name: user.displayName || `${user.firstName} ${user.lastName}`,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatar: user.avatar,
    department: user.department,
    designation: user.position,
    bio: user.bio,
    badges,
    points: userPoints ? userPoints.totalPoints : 0,
    role: user.roleId?.name || 'Employee',
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

/**
 * Update user profile (MongoDB only)
 * @param {string} currentUserId - ID of the user making the request
 * @param {Object} updateData - Data to update (can include targetUserId for admin)
 */
const updateProfile = async (currentUserId, updateData) => {
  // If admin is editing another user's profile, use targetUserId
  const currentUser = await User.findById(currentUserId).populate('roleId', 'name description');
  const isAdmin = currentUser?.roleId?.name === 'Admin' || currentUser?.roleId?.name === 'ADMIN';
  
  const targetUserId = (isAdmin && updateData.targetUserId) ? updateData.targetUserId : currentUserId;
  const user = await User.findById(targetUserId).populate('roleId', 'name description');

  if (!user) {
    throw new Error('User not found');
  }

  // Non-admin users can only edit their own profile
  if (!isAdmin && targetUserId !== currentUserId) {
    throw new Error('Unauthorized: You can only edit your own profile');
  }

  // Extract update fields
  const { 
    targetUserId: _, // Remove from updateData
    designation, 
    department, 
    bio, 
    interests, 
    avatar,
    firstName,
    lastName,
    displayName,
    email,
    position,
    roleId,
    role, // Accept role name as well
    isActive
  } = updateData;

  // Update allowed fields
  if (designation !== undefined) user.position = designation;
  if (position !== undefined) user.position = position;
  if (department !== undefined) user.department = department;
  if (bio !== undefined) user.bio = bio;
  if (interests !== undefined) user.interests = interests;
  if (avatar !== undefined) user.avatar = avatar;
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (displayName !== undefined) user.displayName = displayName;
  
  // Only admin can update these sensitive fields
  if (isAdmin) {
    if (email !== undefined) user.email = email;
    
    // Handle role update - can be roleId (ObjectId) or role name (string)
    if (roleId !== undefined || role !== undefined) {
      if (roleId && mongoose.Types.ObjectId.isValid(roleId)) {
        // If it's a valid ObjectId, use it directly
        user.roleId = roleId;
      } else if (role) {
        // If it's a role name, find the role
        const roleRecord = await Role.findOne({ name: role });
        if (roleRecord) {
          user.roleId = roleRecord._id;
        }
      } else if (roleId) {
        // Try to find role by name if roleId is provided as string name
        const roleRecord = await Role.findOne({ name: roleId });
        if (roleRecord) {
          user.roleId = roleRecord._id;
        }
      }
    }
    
    if (isActive !== undefined) user.isActive = isActive;
  }

  await user.save();

  // Return updated user with populated role
  const updatedUser = await User.findById(user._id)
    .populate('roleId', 'name description')
    .select('-password');

  return {
    _id: updatedUser._id,
    id: updatedUser._id.toString(),
    name: updatedUser.displayName || `${updatedUser.firstName} ${updatedUser.lastName}`,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    email: updatedUser.email,
    avatar: updatedUser.avatar,
    department: updatedUser.department,
    designation: updatedUser.position,
    bio: updatedUser.bio,
    role: updatedUser.roleId?.name || 'Employee',
    roleId: updatedUser.roleId,
    isActive: updatedUser.isActive
  };
};

/**
 * Search employee directory (MongoDB only)
 */
const searchDirectory = async (options = {}) => {
  const { search, department, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const query = {
    isActive: true
  };

  // Build search query
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { displayName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { position: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } }
    ];
  }

  if (department) {
    query.department = department;
  }

  // Get total count
  const total = await User.countDocuments(query);

  // Get users with pagination
  const users = await User.find(query)
    .select('-password')
    .populate('roleId', 'name')
    .sort({ firstName: 1, lastName: 1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip))
    .lean();

  // Get points for all users
  const userIds = users.map(u => u._id);
  const points = await UserPoints.find({ userId: { $in: userIds } });
  const pointsMap = {};
  points.forEach(p => {
    pointsMap[p.userId.toString()] = p.totalPoints;
  });

  // Map users with points
  const usersWithPoints = users.map(user => ({
    _id: user._id,
    id: user._id.toString(),
    name: user.displayName || `${user.firstName} ${user.lastName}`,
    email: user.email,
    avatar: user.avatar,
    department: user.department,
    designation: user.position,
    role: user.roleId?.name || 'Employee',
    points: pointsMap[user._id.toString()] || 0,
    isActive: user.isActive
  }));

  return {
    users: usersWithPoints,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get user's recognition badges (MongoDB only)
 */
const getUserBadges = async (userId) => {
  const recognitions = await Recognition.aggregate([
    {
      $match: {
        receiverId: new mongoose.Types.ObjectId(userId),
        badge: { $ne: null }
      }
    },
    {
      $group: {
        _id: '$badge',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $project: {
        _id: 0,
        badge: '$_id',
        count: 1
      }
    }
  ]);

  return recognitions;
};

module.exports = {
  getProfileById,
  updateProfile,
  searchDirectory,
  getUserBadges
};
