const express = require('express');
const router = express.Router();
const adminRewardController = require('../controllers/adminRewardController');
const { authenticateToken } = require('../middleware/auth');
const { isModerator } = require('../middleware/rbac');

// Rewards catalog management
router.get('/rewards', authenticateToken, isModerator, adminRewardController.getAllRewards);
router.post('/rewards', authenticateToken, isModerator, adminRewardController.createReward);
router.put('/rewards/:id', authenticateToken, isModerator, adminRewardController.updateReward);
router.delete('/rewards/:id', authenticateToken, isModerator, adminRewardController.deleteReward);

module.exports = router;

