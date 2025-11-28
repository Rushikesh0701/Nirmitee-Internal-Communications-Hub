const profileService = require('../services/profileService');
const logger = require('../utils/logger');

/**
 * GET /profile/:id
 */
const getProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const profile = await profileService.getProfileById(id);

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * PUT /profile/update
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const updatedProfile = await profileService.updateProfile(userId, req.body);

    res.json({
      success: true,
      data: updatedProfile
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    // Log error for debugging
    logger.error('Profile update error', { error: error.message });
    
    next(error);
  }
};

/**
 * GET /directory
 */
const getDirectory = async (req, res, next) => {
  try {
    const { search, department, page, limit } = req.query;
    const result = await profileService.searchDirectory({
      search,
      department,
      page,
      limit
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
 * GET /profile/:id/badges
 */
const getUserBadges = async (req, res, next) => {
  try {
    const { id } = req.params;
    const badges = await profileService.getUserBadges(id);

    res.json({
      success: true,
      data: badges
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getDirectory,
  getUserBadges
};

