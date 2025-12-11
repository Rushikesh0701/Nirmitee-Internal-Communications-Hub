const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, notificationController.getNotifications);
router.get('/unread-count', authenticateToken, notificationController.getUnreadCount);
router.post('/mark-read', authenticateToken, notificationController.markAsRead);
router.delete('/:id', authenticateToken, notificationController.deleteNotification);
router.delete('/', authenticateToken, notificationController.deleteAllNotifications);

module.exports = router;
