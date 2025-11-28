const { Recognition, RewardCatalog, Redemption, UserPoints, User } = require('../models/sequelize/index');
const { Op } = require('sequelize');
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
 * Get leaderboard
 */
const getLeaderboard = async (options = {}) => {
  const { limit = 50 } = options;

  const leaderboard = await UserPoints.findAll({
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'avatar']
      }
    ],
    order: [['totalPoints', 'DESC']],
    limit: parseInt(limit)
  });

  return leaderboard.map((entry, index) => ({
    rank: index + 1,
    userId: entry.userId,
    user: entry.user,
    points: entry.totalPoints
  }));
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
  getUserRedemptions
};

