const express = require('express');
const router = express.Router();
const pushNotificationController = require('../controllers/pushNotificationController');
const { authenticateToken } = require('../middleware/auth');
const { isModerator, isAdmin } = require('../middleware/rbac');
const { pushTokenLimiter, pushSendLimiter } = require('../middleware/rateLimiter');

// Token registration — any authenticated user
router.post(
    '/register-token',
    authenticateToken,
    pushTokenLimiter,
    pushNotificationController.registerToken
);

// Send push notification — admin or moderator only
router.post(
    '/send',
    authenticateToken,
    isModerator,
    pushSendLimiter,
    pushNotificationController.sendNotification
);

// Topic subscription — any authenticated user
router.post(
    '/subscribe',
    authenticateToken,
    pushNotificationController.subscribe
);

// Topic unsubscription — any authenticated user
router.post(
    '/unsubscribe',
    authenticateToken,
    pushNotificationController.unsubscribe
);

// Click tracking — any authenticated user
router.post(
    '/track-click',
    authenticateToken,
    pushNotificationController.trackClick
);

// Analytics — admin only
router.get(
    '/analytics',
    authenticateToken,
    isAdmin,
    pushNotificationController.getAnalytics
);

module.exports = router;
