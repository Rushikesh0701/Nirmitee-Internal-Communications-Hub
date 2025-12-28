const { Recognition, RewardCatalog, Redemption, UserPoints, User } = require('../models');
const notificationService = require('./notificationService');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Helper function to get user name from user object
 */
const getUserName = (user) => {
  if (!user) return null;
  return user.displayName ||
    (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null) ||
    user.firstName ||
    user.email?.split('@')[0] ||
    'Unknown';
};

/**
 * Helper function to transform recognition with sender/receiver aliases
 */
const transformRecognition = (recognition) => {
  if (!recognition) return recognition;

  const recognitionObj = recognition.toObject ? recognition.toObject() : recognition;

  // Add sender alias with name field
  if (recognitionObj.senderId) {
    recognitionObj.sender = {
      ...recognitionObj.senderId,
      id: recognitionObj.senderId._id || recognitionObj.senderId.id,
      name: getUserName(recognitionObj.senderId)
    };
  }

  // Add receiver alias with name field
  if (recognitionObj.receiverId) {
    recognitionObj.receiver = {
      ...recognitionObj.receiverId,
      id: recognitionObj.receiverId._id || recognitionObj.receiverId.id,
      name: getUserName(recognitionObj.receiverId)
    };
  }

  return recognitionObj;
};

/**
 * Send a recognition and award points
 */
const sendRecognition = async (recognitionData) => {
  const { senderId, receiverId, message, badge, points = 0 } = recognitionData;

  // Create recognition
  const recognition = await Recognition.create({
    senderId,
    receiverId,
    message,
    badge,
    points
  });

  // Award points to receiver
  if (points > 0) {
    await awardPoints(receiverId, points);
  }

  // Fetch with associations
  const fullRecognition = await Recognition.findById(recognition._id)
    .populate('senderId', '_id firstName lastName displayName email avatar')
    .populate('receiverId', '_id firstName lastName displayName email avatar');

  // Send notification to receiver
  try {
    const senderName = getUserName(fullRecognition.senderId) || 'Someone';
    await notificationService.notifyRecognition(receiverId, senderName, points);
  } catch (error) {
    logger.error('Error sending recognition notification', { error });
    // Don't fail the recognition if notification fails
  }

  // Transform to add sender/receiver aliases for frontend compatibility
  return transformRecognition(fullRecognition);
};

/**
 * Get recognition feed with pagination
 */
const getRecognitionFeed = async (options = {}) => {
  const { page = 1, limit = 10, receiverId } = options;
  const skip = (page - 1) * limit;

  const query = {};
  if (receiverId) {
    query.receiverId = receiverId;
  }

  const [recognitions, totalCount] = await Promise.all([
    Recognition.find(query)
      .populate('senderId', '_id firstName lastName displayName email avatar')
      .populate('receiverId', '_id firstName lastName displayName email avatar')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit)),
    Recognition.countDocuments(query)
  ]);

  // Transform recognitions to add sender/receiver aliases
  const transformedRecognitions = recognitions.map(transformRecognition);

  return {
    recognitions: transformedRecognitions,
    pagination: {
      total: totalCount,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(totalCount / limit)
    }
  };
};

/**
 * Award points to a user
 */
const awardPoints = async (userId, points) => {
  const userPoints = await UserPoints.findOneAndUpdate(
    { userId },
    {
      $inc: { totalPoints: points },
      $setOnInsert: { userId }
    },
    { new: true, upsert: true }
  );

  return userPoints;
};

/**
 * Get user's total points
 */
const getUserPoints = async (userId) => {
  const userPoints = await UserPoints.findOne({ userId });

  return userPoints ? userPoints.totalPoints : 0;
};

/**
 * Get rewards catalog
 */
const getRewardsCatalog = async (options = {}) => {
  const { isActive = true } = options;

  const query = {};
  if (isActive !== undefined) {
    query.isActive = isActive;
  }

  return await RewardCatalog.find(query).sort({ points: 1 });
};

/**
 * Redeem a reward
 */
const redeemReward = async (userId, rewardId) => {
  // Get reward details
  const reward = await RewardCatalog.findById(rewardId);
  if (!reward) {
    throw new Error('Reward not found');
  }

  if (!reward.isActive) {
    throw new Error('Reward is not available');
  }

  // Check user's available points
  const userPoints = await getUserPoints(userId);
  if (userPoints < reward.points) {
    throw new Error('Insufficient points');
  }

  // Create redemption request
  const redemption = await Redemption.create({
    userId,
    rewardId,
    pointsSpent: reward.points,
    status: 'PENDING'
  });

  // Deduct points immediately (or wait for approval based on business logic)
  // For now, deducting immediately
  const userPointsRecord = await UserPoints.findOne({ userId });
  if (userPointsRecord) {
    userPointsRecord.totalPoints -= reward.points;
    await userPointsRecord.save();
  }

  return await Redemption.findById(redemption._id)
    .populate('userId', 'firstName lastName email')
    .populate('rewardId', 'title description points image');
};

/**
 * Get leaderboard with time period filter
 */
const getLeaderboard = async (options = {}) => {
  const { limit = 50, period = 'all-time' } = options;

  // Calculate date range based on period
  const now = new Date();
  let dateFilter = {};

  switch (period) {
    case 'monthly':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { createdAt: { $gte: monthStart } };
      break;
    case 'weekly':
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: weekStart } };
      break;
    case 'all-time':
    default:
      // No filter for all-time
      break;
  }

  // Get recognitions for the period
  const leaderboard = await Recognition.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$receiverId',
        count: { $sum: 1 },
        totalPoints: { $sum: '$points' }
      }
    },
    { $sort: { totalPoints: -1 } },
    { $limit: parseInt(limit) },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        userId: '$_id',
        user: {
          id: '$user._id',
          name: '$user.name',
          email: '$user.email',
          avatar: '$user.avatar'
        },
        recognitionCount: '$count',
        points: '$totalPoints',
        period: { $literal: period }
      }
    }
  ]);

  return leaderboard.map((entry, index) => ({
    ...entry,
    rank: index + 1
  }));
};

/**
 * Get monthly recognition summary
 */
const getMonthlyRecognitionSummary = async (year, month) => {
  // Default to current month if not specified
  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month !== undefined ? month : now.getMonth();

  const monthStart = new Date(targetYear, targetMonth, 1);
  const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

  const dateFilter = {
    createdAt: {
      $gte: monthStart,
      $lte: monthEnd
    }
  };

  // Total recognitions this month
  const totalRecognitions = await Recognition.countDocuments(dateFilter);

  // Total points awarded
  const pointsAggregation = await Recognition.aggregate([
    { $match: dateFilter },
    { $group: { _id: null, total: { $sum: '$points' } } }
  ]);
  const totalPointsAwarded = pointsAggregation.length > 0 ? pointsAggregation[0].total : 0;

  // Top givers
  const topGivers = await Recognition.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$senderId',
        count: { $sum: 1 },
        totalPoints: { $sum: '$points' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        user: {
          id: '$user._id',
          name: '$user.name',
          email: '$user.email',
          avatar: '$user.avatar'
        },
        recognitionsGiven: '$count',
        pointsAwarded: '$totalPoints'
      }
    }
  ]);

  // Top receivers
  const topReceivers = await Recognition.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$receiverId',
        count: { $sum: 1 },
        totalPoints: { $sum: '$points' }
      }
    },
    { $sort: { totalPoints: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        user: {
          id: '$user._id',
          name: '$user.name',
          email: '$user.email',
          avatar: '$user.avatar'
        },
        recognitionsReceived: '$count',
        pointsEarned: '$totalPoints'
      }
    }
  ]);

  // Badge distribution
  const badgeDistribution = await Recognition.aggregate([
    {
      $match: {
        ...dateFilter,
        badge: { $ne: null }
      }
    },
    {
      $group: {
        _id: '$badge',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    {
      $project: {
        badge: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);

  return {
    period: {
      year: targetYear,
      month: targetMonth + 1, // 1-indexed for display
      monthName: new Date(targetYear, targetMonth).toLocaleString('default', { month: 'long' })
    },
    summary: {
      totalRecognitions,
      totalPointsAwarded,
      averagePointsPerRecognition: totalRecognitions > 0 ? (totalPointsAwarded / totalRecognitions).toFixed(2) : 0
    },
    topGivers,
    topReceivers,
    badgeDistribution
  };
};

/**
 * Get user's redemption history
 */
const getUserRedemptions = async (userId, options = {}) => {
  const { page = 1, limit = 20, status } = options;
  const skip = (page - 1) * limit;

  const query = { userId };
  if (status) {
    query.status = status.toUpperCase();
  }

  const [redemptions, totalCount] = await Promise.all([
    Redemption.find(query)
      .populate('rewardId', 'title description points image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Redemption.countDocuments(query)
  ]);

  return {
    redemptions,
    pagination: {
      total: totalCount,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(totalCount / parseInt(limit))
    }
  };
};

module.exports = {
  sendRecognition,
  getRecognitionFeed,
  awardPoints,
  getUserPoints,
  getRewardsCatalog,
  redeemReward,
  getLeaderboard,
  getUserRedemptions,
  getMonthlyRecognitionSummary
};
