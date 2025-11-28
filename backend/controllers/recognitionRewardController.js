const recognitionRewardService = require('../services/recognitionRewardService');

/**
 * POST /recognitions/send
 */
const sendRecognition = async (req, res, next) => {
  try {
    const { receiverId, message, badge, points } = req.body;
    const senderId = req.userId;

    if (!receiverId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and message are required'
      });
    }

    const recognition = await recognitionRewardService.sendRecognition({
      senderId,
      receiverId,
      message,
      badge,
      points: points || 0
    });

    res.status(201).json({
      success: true,
      data: recognition
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /recognitions/feed
 */
const getRecognitionFeed = async (req, res, next) => {
  try {
    const { page, limit, receiverId } = req.query;
    const result = await recognitionRewardService.getRecognitionFeed({
      page,
      limit,
      receiverId
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /rewards/catalog
 */
const getRewardsCatalog = async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const catalog = await recognitionRewardService.getRewardsCatalog({
      isActive: isActive !== undefined ? isActive === 'true' : true
    });

    res.json({
      success: true,
      data: catalog
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /rewards/redeem
 */
const redeemReward = async (req, res, next) => {
  try {
    const { rewardId } = req.body;
    const userId = req.userId;

    if (!rewardId) {
      return res.status(400).json({
        success: false,
        message: 'Reward ID is required'
      });
    }

    const redemption = await recognitionRewardService.redeemReward(userId, rewardId);

    res.status(201).json({
      success: true,
      data: redemption
    });
  } catch (error) {
    if (error.message === 'Reward not found' || error.message === 'Reward is not available') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message === 'Insufficient points') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * GET /leaderboard
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const leaderboard = await recognitionRewardService.getLeaderboard({ limit });

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /recognitions/points
 */
const getUserPoints = async (req, res, next) => {
  try {
    const userId = req.userId;
    const points = await recognitionRewardService.getUserPoints(userId);

    res.json({
      success: true,
      data: { userId, points }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /recognitions/redemptions
 */
const getUserRedemptions = async (req, res, next) => {
  try {
    const userId = req.userId;
    const redemptions = await recognitionRewardService.getUserRedemptions(userId);

    res.json({
      success: true,
      data: redemptions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendRecognition,
  getRecognitionFeed,
  getRewardsCatalog,
  redeemReward,
  getLeaderboard,
  getUserPoints,
  getUserRedemptions
};

