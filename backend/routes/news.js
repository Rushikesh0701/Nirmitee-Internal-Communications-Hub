const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { authenticateToken } = require('../middleware/auth');
const { isModerator } = require('../middleware/rbac');

// RSS routes (must come before /:id to avoid being captured as an ID)
router.get('/rss', authenticateToken, newsController.getNewsFromRSS);
router.get('/sync-rss', authenticateToken, newsController.syncRSSFeeds);

// Public routes (require authentication)
router.get('/', authenticateToken, newsController.getAllNews);
router.get('/:id', authenticateToken, newsController.getNewsById);

// Moderator-only routes
router.post('/', authenticateToken, isModerator, newsController.createNews);
router.put('/:id', authenticateToken, isModerator, newsController.updateNews);
router.delete('/:id', authenticateToken, isModerator, newsController.deleteNews);

module.exports = router;

