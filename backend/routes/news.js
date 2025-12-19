const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { authenticateToken } = require('../middleware/auth');
const { isModerator } = require('../middleware/rbac');

// Public routes (require authentication)
router.get('/', authenticateToken, newsController.getAllNews);
router.get('/check-updates', authenticateToken, newsController.checkUpdates);
router.get('/rss', authenticateToken, newsController.getRSSNews);
router.get('/:id', authenticateToken, newsController.getNewsById);

// Moderator-only routes (not supported - news comes from external sources)
router.post('/', authenticateToken, isModerator, newsController.createNews);
router.put('/:id', authenticateToken, isModerator, newsController.updateNews);
router.delete('/:id', authenticateToken, isModerator, newsController.deleteNews);

module.exports = router;
