const { RewardCatalog, Redemption, User, UserPoints } = require('../models');

/**
 * POST /admin/rewards - Create reward
 */
const createReward = async (req, res, next) => {
  try {
    const { title, description, points, image } = req.body;

    if (!title || !points) {
      return res.status(400).json({
        success: false,
        message: 'Title and points are required'
      });
    }

    const reward = await RewardCatalog.create({
      title,
      description,
      points: parseInt(points),
      image
    });

    res.status(201).json({
      success: true,
      data: reward
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /admin/rewards/:id - Update reward
 */
const updateReward = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, points, image, isActive } = req.body;

    const reward = await RewardCatalog.findById(id);
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    if (title) reward.title = title;
    if (description !== undefined) reward.description = description;
    if (points) reward.points = parseInt(points);
    if (image !== undefined) reward.image = image;
    if (isActive !== undefined) reward.isActive = isActive;

    await reward.save();

    res.json({
      success: true,
      data: reward
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /admin/rewards/:id - Delete reward
 */
const deleteReward = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reward = await RewardCatalog.findById(id);
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    await RewardCatalog.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Reward deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /admin/rewards - Get all rewards (admin view)
 */
const getAllRewards = async (req, res, next) => {
  try {
    const rewards = await RewardCatalog.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: rewards
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /admin/redemptions - Get all redemption requests
 */
const getAllRedemptions = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) {
      query.status = status.toUpperCase();
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [redemptions, totalCount] = await Promise.all([
      Redemption.find(query)
        .populate('user', 'id name email avatar')
        .populate('reward', 'id title description points image')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Redemption.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        redemptions,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /admin/redemptions/:id/approve - Approve a redemption
 */
const approveRedemption = async (req, res, next) => {
  try {
    const { id } = req.params;

    const redemption = await Redemption.findById(id);
    if (!redemption) {
      return res.status(404).json({
        success: false,
        message: 'Redemption not found'
      });
    }

    if (redemption.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Redemption is already ${redemption.status.toLowerCase()}`
      });
    }

    redemption.status = 'APPROVED';
    await redemption.save();

    const fullRedemption = await Redemption.findById(id)
      .populate('user', 'id name email')
      .populate('reward', 'id title points');

    res.json({
      success: true,
      data: fullRedemption,
      message: 'Redemption approved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /admin/redemptions/:id/reject - Reject a redemption and refund points
 */
const rejectRedemption = async (req, res, next) => {
  try {
    const { id } = req.params;

    const redemption = await Redemption.findById(id).populate('reward');

    if (!redemption) {
      return res.status(404).json({
        success: false,
        message: 'Redemption not found'
      });
    }

    if (redemption.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Redemption is already ${redemption.status.toLowerCase()}`
      });
    }

    // Refund points to user
    const userPoints = await UserPoints.findOne({ userId: redemption.userId });
    if (userPoints) {
      userPoints.totalPoints += redemption.reward.points;
      await userPoints.save();
    }

    redemption.status = 'REJECTED';
    await redemption.save();

    const fullRedemption = await Redemption.findById(id)
      .populate('user', 'id name email')
      .populate('reward', 'id title points');

    res.json({
      success: true,
      data: fullRedemption,
      message: 'Redemption rejected and points refunded'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReward,
  updateReward,
  deleteReward,
  getAllRewards,
  getAllRedemptions,
  approveRedemption,
  rejectRedemption
};

