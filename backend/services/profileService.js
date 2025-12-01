const { User, UserPoints, Recognition } = require('../models');
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
 */
const updateProfile = async (userId, updateData) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  const { designation, department, bio, interests, avatar } = updateData;

  if (designation !== undefined) user.position = designation;
  if (department !== undefined) user.department = department;
  if (bio !== undefined) user.bio = bio;
  if (avatar !== undefined) user.avatar = avatar;

  await user.save();

  return {
    _id: user._id,
    id: user._id.toString(),
    name: user.displayName || `${user.firstName} ${user.lastName}`,
    email: user.email,
    avatar: user.avatar,
    department: user.department,
    designation: user.position,
    bio: user.bio,
    role: user.roleId?.name || 'Employee',
    isActive: user.isActive
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
