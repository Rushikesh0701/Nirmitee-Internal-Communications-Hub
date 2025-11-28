const { RewardCatalog } = require('../models/sequelize');

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

    const reward = await RewardCatalog.findByPk(id);
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

    const reward = await RewardCatalog.findByPk(id);
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    await reward.destroy();

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
    const rewards = await RewardCatalog.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: rewards
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReward,
  updateReward,
  deleteReward,
  getAllRewards
};

