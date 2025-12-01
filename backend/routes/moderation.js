const express = require('express');
const router = express.Router();
const moderationController = require('../controllers/moderationController');
const { authenticateToken } = require('../middleware/auth');
const { isModerator } = require('../middleware/rbac');

// All moderation routes require Moderator or Admin role

// Blog moderation
router.get('/blogs', authenticateToken, isModerator, moderationController.getPendingBlogs);
router.put('/blogs/:id/approve', authenticateToken, isModerator, moderationController.approveBlog);
router.put('/blogs/:id/reject', authenticateToken, isModerator, moderationController.rejectBlog);

// Announcement moderation
router.get('/announcements', authenticateToken, isModerator, moderationController.getPendingAnnouncements);
router.put('/announcements/:id/approve', authenticateToken, isModerator, moderationController.approveAnnouncement);
router.put('/announcements/:id/reject', authenticateToken, isModerator, moderationController.rejectAnnouncement);

// Moderation statistics
router.get('/stats', authenticateToken, isModerator, moderationController.getModerationStats);

module.exports = router;
