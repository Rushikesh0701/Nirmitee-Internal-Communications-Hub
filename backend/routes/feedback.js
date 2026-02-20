const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticateToken } = require('../middleware/auth');
const { isModerator } = require('../middleware/rbac');

// Authenticated routes (all users)
router.post('/', authenticateToken, feedbackController.submitFeedback);
router.get('/', authenticateToken, feedbackController.getFeedbackList);

// Admin/Moderator only
router.get('/stats', authenticateToken, isModerator, feedbackController.getFeedbackStats);
router.get('/:id', authenticateToken, isModerator, feedbackController.getFeedbackById);
router.put('/:id/status', authenticateToken, isModerator, feedbackController.updateFeedbackStatus);

module.exports = router;
