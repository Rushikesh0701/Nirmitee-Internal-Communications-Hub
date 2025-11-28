const express = require('express');
const router = express.Router();
const rssController = require('../controllers/rssController');
const { authenticateToken } = require('../middleware/auth');
const { isModerator } = require('../middleware/rbac');

// Feed management routes (Admin/Moderator only)
router.get('/feeds', authenticateToken, rssController.getAllFeeds);
router.get('/feeds/:id', authenticateToken, rssController.getFeedById);
router.post('/feeds', authenticateToken, isModerator, rssController.createFeed);
router.put('/feeds/:id', authenticateToken, isModerator, rssController.updateFeed);
router.delete('/feeds/:id', authenticateToken, isModerator, rssController.deleteFeed);
router.get('/feeds/:id/fetch', authenticateToken, isModerator, rssController.fetchFeedItems);

// Article routes (authenticated users)
router.get('/articles', authenticateToken, rssController.getAllArticles);
router.get('/articles/grouped', authenticateToken, rssController.getArticlesGroupedByCategory);
router.get('/articles/category/:category', authenticateToken, rssController.getArticlesByCategory);

// Subscription routes (authenticated users)
router.get('/subscriptions', authenticateToken, rssController.getUserSubscriptions);
router.put('/subscriptions', authenticateToken, rssController.updateUserSubscriptions);

// Legacy routes for backward compatibility (require authentication)
router.get('/', authenticateToken, rssController.getAllFeeds);
router.get('/:id', authenticateToken, rssController.getFeedById);
router.get('/:id/fetch', authenticateToken, rssController.fetchFeedItems);

module.exports = router;
