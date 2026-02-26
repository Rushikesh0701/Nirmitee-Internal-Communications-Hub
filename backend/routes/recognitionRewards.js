const express = require('express');
const router = express.Router();
const recognitionRewardController = require('../controllers/recognitionRewardController');
const { authenticateToken } = require('../middleware/auth');

// Recognition endpoints
router.post('/send', authenticateToken, recognitionRewardController.sendRecognition);
router.get('/feed', authenticateToken, recognitionRewardController.getRecognitionFeed);
router.get('/points', authenticateToken, recognitionRewardController.getUserPoints);
router.get('/redemptions', authenticateToken, recognitionRewardController.getUserRedemptions);

// Rewards endpoints
router.get('/catalog', authenticateToken, recognitionRewardController.getRewardsCatalog);
router.post('/redeem', authenticateToken, recognitionRewardController.redeemReward);

// Leaderboard endpoint
router.get('/leaderboard', authenticateToken, recognitionRewardController.getLeaderboard);

// Recognition summary
router.get('/summary/monthly', authenticateToken, recognitionRewardController.getMonthlyRecognitionSummary);

// Activity summary (gamification)
router.get('/activity-summary', authenticateToken, recognitionRewardController.getActivitySummary);

// Admin: Activity dashboard (all users)
router.get('/admin/activity-dashboard', authenticateToken, (req, res, next) => {
    const role = req.userRole;
    if (!['Admin', 'Moderator', 'ADMIN', 'MODERATOR'].includes(role)) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
}, recognitionRewardController.getAdminActivityDashboard);

module.exports = router;

