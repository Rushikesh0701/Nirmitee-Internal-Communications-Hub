const express = require('express');
const router = express.Router();
const discussionController = require('../controllers/discussionController');
const { authenticateToken } = require('../middleware/auth');

router.get('/tags', authenticateToken, discussionController.getAllTags);
router.get('/', authenticateToken, discussionController.getAllDiscussions);
router.get('/:id', authenticateToken, discussionController.getDiscussionById);
router.post('/', authenticateToken, discussionController.createDiscussion);
router.put('/:id', authenticateToken, discussionController.updateDiscussion);
router.delete('/:id', authenticateToken, discussionController.deleteDiscussion);
router.post('/:id/comments', authenticateToken, discussionController.addComment);

module.exports = router;

