const analyticsService = require('../services/analyticsService');

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await analyticsService.getDashboardStats(req.user);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

const getContentAnalytics = async (req, res, next) => {
  try {
    const { entityType, startDate, endDate } = req.query;
    const analytics = await analyticsService.getContentAnalytics({
      entityType,
      startDate,
      endDate
    }, req.user);
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

const getUserEngagement = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const engagement = await analyticsService.getUserEngagement({
      startDate,
      endDate
    }, req.user);
    res.json({ success: true, data: engagement });
  } catch (error) {
    next(error);
  }
};

const trackEvent = async (req, res, next) => {
  try {
    const eventData = {
      ...req.body,
      userId: req.userId
    };
    await analyticsService.trackEvent(eventData);
    res.json({ success: true, message: 'Event tracked' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getContentAnalytics,
  getUserEngagement,
  trackEvent
};

