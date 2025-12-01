const { Recognition, RewardCatalog, Redemption, UserPoints, User } = require('../models');
const notificationService = require('./notificationService');

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
  const fullRecognition = await Recognition.findByPk(recognition.id, {
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'name', 'email', 'avatar']
      },
      {
        model: User,
        as: 'receiver',
        attributes: ['id', 'name', 'email', 'avatar']
      }
    ]
  });

  // Send notification to receiver
  try {
    const senderName = fullRecognition.sender?.name || 'Someone';
    await notificationService.notifyRecognition(receiverId, senderName, points);
  } catch (error) {
    console.error('Error sending recognition notification:', error);
    // Don't fail the recognition if notification fails
  }

  return fullRecognition;
};

/**
 * Get recognition feed with pagination
 */
const getRecognitionFeed = async (options = {}) => {
  const { page = 1, limit = 10, receiverId } = options;
  const offset = (page - 1) * limit;

  const where = {};
  if (receiverId) {
    where.receiverId = receiverId;
  }

  const { count, rows } = await Recognition.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'name', 'email', 'avatar']
      },
      {
        model: User,
        as: 'receiver',
        attributes: ['id', 'name', 'email', 'avatar']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  return {
    recognitions: rows,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(count / limit)
    }
  };
};

/**
 * Award points to a user
 */
const awardPoints = async (userId, points) => {
  const [userPoints, created] = await UserPoints.findOrCreate({
    where: { userId },
    defaults: { totalPoints: 0 }
  });

  userPoints.totalPoints += points;
  await userPoints.save();
  return userPoints;
};

/**
 * Get user's total points
 */
const getUserPoints = async (userId) => {
  const userPoints = await UserPoints.findOne({
    where: { userId }
  });

  return userPoints ? userPoints.totalPoints : 0;
};

/**
 * Get rewards catalog
 */
const getRewardsCatalog = async (options = {}) => {
  const { isActive = true } = options;

  const where = {};
  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  return await RewardCatalog.findAll({
    where,
    order: [['points', 'ASC']]
  });
};

/**
 * Redeem a reward
 */
const redeemReward = async (userId, rewardId) => {
  // Get reward details
  const reward = await RewardCatalog.findByPk(rewardId);
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
    status: 'PENDING'
  });

  // Deduct points immediately (or wait for approval based on business logic)
  // For now, deducting immediately
  const userPointsRecord = await UserPoints.findOne({ where: { userId } });
  if (userPointsRecord) {
    userPointsRecord.totalPoints -= reward.points;
    await userPointsRecord.save();
  }

  return await Redemption.findByPk(redemption.id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      },
      {
        model: RewardCatalog,
        as: 'reward',
        attributes: ['id', 'title', 'description', 'points', 'image']
      }
    ]
  });
};

/**
 * Get leaderboard with time period filter
 */
const getLeaderboard = async (options = {}) => {
  const { limit = 50, period = 'all-time' } = options;
  const { Op } = require('sequelize');

  // Calculate date range based on period
  const now = new Date();
  let dateFilter = {};

  switch (period) {
    case 'monthly':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = {
        createdAt: {
          [Op.gte]: monthStart
        }
      };
      break;
    case 'weekly':
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = {
        createdAt: {
          [Op.gte]: weekStart
        }
      };
      break;
    case 'all-time':
    default:
      // No filter for all-time
      break;
  }

  // Get recognitions for the period
  const recognitions = await Recognition.findAll({
    where: dateFilter,
    attributes: [
      'receiverId',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
      [require('sequelize').fn('SUM', require('sequelize').col('points')), 'totalPoints']
    ],
    group: ['receiverId'],
    order: [[require('sequelize').literal('totalPoints'), 'DESC']],
    limit: parseInt(limit),
    include: [
      {
        model: User,
        as: 'receiver',
        attributes: ['id', 'name', 'email', 'avatar']
      }
    ]
  });

  return recognitions.map((entry, index) => ({
    rank: index + 1,
    userId: entry.receiverId,
    user: entry.receiver,
    recognitionCount: parseInt(entry.dataValues.count),
    points: parseInt(entry.dataValues.totalPoints) || 0,
    period
  }));
};

/**
 * Get monthly recognition summary
 */
const getMonthlyRecognitionSummary = async (year, month) => {
  const { Op } = require('sequelize');

  // Default to current month if not specified
  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month !== undefined ? month : now.getMonth();

  const monthStart = new Date(targetYear, targetMonth, 1);
  const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

  const dateFilter = {
    createdAt: {
      [Op.between]: [monthStart, monthEnd]
    }
  };

  // Total recognitions this month
  const totalRecognitions = await Recognition.count({ where: dateFilter });

  // Total points awarded
  const totalPointsAwarded = await Recognition.sum('points', { where: dateFilter }) || 0;

  // Top givers
  const topGivers = await Recognition.findAll({
    where: dateFilter,
    attributes: [
      'senderId',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
      [require('sequelize').fn('SUM', require('sequelize').col('points')), 'totalPoints']
    ],
    group: ['senderId'],
    order: [[require('sequelize').literal('count'), 'DESC']],
    limit: 10,
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'name', 'email', 'avatar']
      }
    ]
  });

  // Top receivers
  const topReceivers = await Recognition.findAll({
    where: dateFilter,
    attributes: [
      'receiverId',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
      [require('sequelize').fn('SUM', require('sequelize').col('points')), 'totalPoints']
    ],
    group: ['receiverId'],
    order: [[require('sequelize').literal('totalPoints'), 'DESC']],
    limit: 10,
    include: [
      {
        model: User,
        as: 'receiver',
        attributes: ['id', 'name', 'email', 'avatar']
      }
    ]
  });

  // Badge distribution
  const badgeDistribution = await Recognition.findAll({
    where: {
      ...dateFilter,
      badge: { [Op.ne]: null }
    },
    attributes: [
      'badge',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: ['badge'],
    order: [[require('sequelize').literal('count'), 'DESC']]
  });

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
    topGivers: topGivers.map(g => ({
      user: g.sender,
      recognitionsGiven: parseInt(g.dataValues.count),
      pointsAwarded: parseInt(g.dataValues.totalPoints) || 0
    })),
    topReceivers: topReceivers.map(r => ({
      user: r.receiver,
      recognitionsReceived: parseInt(r.dataValues.count),
      pointsEarned: parseInt(r.dataValues.totalPoints) || 0
    })),
    badgeDistribution: badgeDistribution.map(b => ({
      badge: b.badge,
      count: parseInt(b.dataValues.count)
    }))
  };
};

/**
 * Get user's redemption history
 */
const getUserRedemptions = async (userId) => {
  return await Redemption.findAll({
    where: { userId },
    include: [
      {
        model: RewardCatalog,
        as: 'reward',
        attributes: ['id', 'title', 'description', 'points', 'image']
      }
    ],
    order: [['createdAt', 'DESC']]
  });
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
