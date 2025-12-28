const adminAnalyticsService = require('../services/adminAnalyticsService');

/**
 * GET /analytics/overview
 */
const getOverview = async (req, res, next) => {
  try {
    const overview = await adminAnalyticsService.getOverview();
    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /analytics/engagement
 */
const getEngagement = async (req, res, next) => {
  try {
    const { range = 'daily' } = req.query;
    const metrics = await adminAnalyticsService.getEngagementMetrics(range);
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /analytics/surveys
 */
const getSurveyAnalytics = async (req, res, next) => {
  try {
    const analytics = await adminAnalyticsService.getSurveyAnalytics();
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /analytics/recognitions
 */
const getRecognitionAnalytics = async (req, res, next) => {
  try {
    const analytics = await adminAnalyticsService.getRecognitionAnalytics();
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /analytics/blogs
 */
const getBlogAnalytics = async (req, res, next) => {
  try {
    const analytics = await adminAnalyticsService.getBlogAnalytics();
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /analytics/mau
 */
const getMAU = async (req, res, next) => {
  try {
    const mau = await adminAnalyticsService.getMAU();
    res.json({
      success: true,
      data: mau
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /analytics/posts-comments
 */
const getPostsAndCommentsCount = async (req, res, next) => {
  try {
    const count = await adminAnalyticsService.getPostsAndCommentsCount();
    res.json({
      success: true,
      data: count
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /analytics/sentiment
 */
const getSentimentAnalysis = async (req, res, next) => {
  try {
    const { contentType, startDate, endDate } = req.query;
    const analysis = await adminAnalyticsService.getSentimentAnalysis({ contentType, startDate, endDate });
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getEngagement,
  getSurveyAnalytics,
  getRecognitionAnalytics,
  getBlogAnalytics,
  getMAU,
  getPostsAndCommentsCount,
  getSentimentAnalysis
};

