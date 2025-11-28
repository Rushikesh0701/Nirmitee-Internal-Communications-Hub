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

module.exports = router;

