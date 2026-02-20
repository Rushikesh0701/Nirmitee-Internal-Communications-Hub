const express = require('express');
const router = express.Router();
const pollController = require('../controllers/pollController');
const { authenticateToken } = require('../middleware/auth');
const { isModerator } = require('../middleware/rbac');

// Authenticated routes
router.get('/', authenticateToken, pollController.getPolls);
router.get('/:id', authenticateToken, pollController.getPollById);
router.post('/', authenticateToken, pollController.createPoll);
router.post('/:id/vote', authenticateToken, pollController.votePoll);
router.put('/:id/close', authenticateToken, pollController.closePoll);

// Admin only
router.delete('/:id', authenticateToken, isModerator, pollController.deletePoll);

module.exports = router;
