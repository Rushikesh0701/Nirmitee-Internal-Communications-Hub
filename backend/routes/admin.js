const express = require('express');
const router = express.Router();
const adminRewardController = require('../controllers/adminRewardController');
const rssController = require('../controllers/rssController');
const rssCategoryController = require('../controllers/rssCategoryController');
const { authenticateToken } = require('../middleware/auth');
const { isModerator } = require('../middleware/rbac');

// RSS Categories management
router.get('/rss-categories', authenticateToken, isModerator, rssCategoryController.getAllCategories);
router.post('/rss-categories', authenticateToken, isModerator, rssCategoryController.createCategory);
router.put('/rss-categories/:id', authenticateToken, isModerator, rssCategoryController.updateCategory);
router.delete('/rss-categories/:id', authenticateToken, isModerator, rssCategoryController.deleteCategory);

// RSS Sources management
router.get('/rss', authenticateToken, isModerator, rssController.getAllRssSources);
router.post('/rss', authenticateToken, isModerator, rssController.createRssSource);
router.put('/rss/:id', authenticateToken, isModerator, rssController.updateRssSource);
router.delete('/rss/:id', authenticateToken, isModerator, rssController.deleteRssSource);
router.patch('/rss/:id/toggle', authenticateToken, isModerator, rssController.toggleRssSource);

// Rewards catalog management
router.get('/rewards', authenticateToken, isModerator, adminRewardController.getAllRewards);
router.post('/rewards', authenticateToken, isModerator, adminRewardController.createReward);
router.put('/rewards/:id', authenticateToken, isModerator, adminRewardController.updateReward);
router.delete('/rewards/:id', authenticateToken, isModerator, adminRewardController.deleteReward);

// Redemption management
router.get('/redemptions', authenticateToken, isModerator, adminRewardController.getAllRedemptions);
router.put('/redemptions/:id/approve', authenticateToken, isModerator, adminRewardController.approveRedemption);
router.put('/redemptions/:id/reject', authenticateToken, isModerator, adminRewardController.rejectRedemption);

module.exports = router;
