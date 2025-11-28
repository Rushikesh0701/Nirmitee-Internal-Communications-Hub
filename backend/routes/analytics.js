const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const adminAnalyticsController = require('../controllers/adminAnalyticsController');
const { authenticateToken } = require('../middleware/auth');
const { isModerator } = require('../middleware/rbac');

// Existing routes
router.get('/dashboard', authenticateToken, isModerator, analyticsController.getDashboardStats);
router.get('/content', authenticateToken, isModerator, analyticsController.getContentAnalytics);
router.get('/user-engagement', authenticateToken, isModerator, analyticsController.getUserEngagement);
router.post('/track', authenticateToken, analyticsController.trackEvent);

// New admin analytics routes
router.get('/overview', authenticateToken, isModerator, adminAnalyticsController.getOverview);
router.get('/engagement', authenticateToken, isModerator, adminAnalyticsController.getEngagement);
router.get('/surveys', authenticateToken, isModerator, adminAnalyticsController.getSurveyAnalytics);
router.get('/recognitions', authenticateToken, isModerator, adminAnalyticsController.getRecognitionAnalytics);
router.get('/blogs', authenticateToken, isModerator, adminAnalyticsController.getBlogAnalytics);
router.get('/mau', authenticateToken, isModerator, adminAnalyticsController.getMAU);

module.exports = router;

