const pushService = require('../services/pushService');
const logger = require('../utils/logger');

/**
 * POST /push-notifications/register-token
 * Register or update a device FCM token
 */
const registerToken = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { token, browser, platform, appVersion } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'FCM token is required'
            });
        }

        const result = await pushService.registerToken(userId, {
            token,
            browser: browser || 'unknown',
            platform: platform || 'unknown',
            appVersion: appVersion || '1.0.0'
        });

        res.json({
            success: true,
            message: 'Device token registered',
            data: { id: result._id }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /push-notifications/send
 * Send a push notification (admin/moderator only)
 * Supports: single user, multi user, broadcast, role-based, scheduled
 */
const sendNotification = async (req, res, next) => {
    try {
        const {
            title, body, url, module, type, image, priority,
            userIds, broadcast, role, scheduledFor, idempotencyKey
        } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Notification title is required'
            });
        }

        if (!module) {
            return res.status(400).json({
                success: false,
                message: 'Module is required'
            });
        }

        const payload = {
            title,
            body: body || '',
            url: url || '',
            module,
            type: type || 'SYSTEM',
            actorId: req.userId,
            image: image || '',
            priority: priority || 'normal'
        };

        const options = {};
        if (idempotencyKey) options.idempotencyKey = idempotencyKey;

        let result;

        // Scheduled send
        if (scheduledFor) {
            const { NotificationLog } = require('../models');
            const { v4: uuidv4 } = require('uuid');

            const notificationId = uuidv4();
            await NotificationLog.create({
                notificationId,
                ...payload,
                recipients: userIds || [],
                recipientCount: broadcast ? 0 : (userIds?.length || 0),
                status: 'scheduled',
                scheduledFor: new Date(scheduledFor),
                idempotencyKey,
                metadata: { broadcast, role }
            });

            return res.json({
                success: true,
                message: `Push notification scheduled for ${scheduledFor}`,
                data: { notificationId }
            });
        }

        // Broadcast to all users
        if (broadcast) {
            result = await pushService.sendBroadcast(payload, options);
        }
        // Role-based targeting
        else if (role) {
            result = await pushService.sendToRole(payload, role, options);
        }
        // Specific user(s)
        else if (userIds && userIds.length > 0) {
            result = await pushService.sendPushNotification(payload, userIds, options);
        }
        else {
            return res.status(400).json({
                success: false,
                message: 'Specify userIds, broadcast: true, or role for targeting'
            });
        }

        res.json({
            success: true,
            message: 'Push notification sent',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /push-notifications/subscribe
 * Subscribe to a notification topic
 */
const subscribe = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { topic } = req.body;

        const validTopics = ['announcements', 'surveys', 'learning', 'recognition', 'broadcast'];
        if (!topic || !validTopics.includes(topic)) {
            return res.status(400).json({
                success: false,
                message: `Invalid topic. Must be one of: ${validTopics.join(', ')}`
            });
        }

        await pushService.subscribeToTopic(userId, topic);

        res.json({
            success: true,
            message: `Subscribed to ${topic}`
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /push-notifications/unsubscribe
 * Unsubscribe from a notification topic
 */
const unsubscribe = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { topic } = req.body;

        if (!topic) {
            return res.status(400).json({
                success: false,
                message: 'Topic is required'
            });
        }

        await pushService.unsubscribeFromTopic(userId, topic);

        res.json({
            success: true,
            message: `Unsubscribed from ${topic}`
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /push-notifications/track-click
 * Track a notification click (called from Service Worker)
 */
const trackClick = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { notificationId } = req.body;

        if (!notificationId) {
            return res.status(400).json({
                success: false,
                message: 'notificationId is required'
            });
        }

        await pushService.trackClick(notificationId, userId);

        res.json({
            success: true,
            message: 'Click tracked'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /push-notifications/analytics
 * Get push notification analytics (admin only)
 */
const getAnalytics = async (req, res, next) => {
    try {
        const { page, limit, module, startDate, endDate } = req.query;

        const result = await pushService.getAnalytics({
            page,
            limit,
            module,
            startDate,
            endDate
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registerToken,
    sendNotification,
    subscribe,
    unsubscribe,
    trackClick,
    getAnalytics
};
