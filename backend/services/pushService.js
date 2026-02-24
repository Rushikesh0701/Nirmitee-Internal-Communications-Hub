const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const { DeviceToken, NotificationLog, User } = require('../models');
const logger = require('../utils/logger');

// ============================================
// Firebase Admin SDK Initialization
// ============================================
let messagingInstance = null;

const initializeFirebase = () => {
    if (admin.apps.length > 0) {
        messagingInstance = admin.messaging();
        return;
    }

    try {
        let serviceAccount;

        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            // Try parsing as JSON string first, then as file path
            try {
                serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            } catch {
                // If parse fails, treat it as a file path
                serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT);
            }
        } else {
            // Default file path
            const path = require('path');
            serviceAccount = require(path.join(__dirname, '../config/firebase-service-account.json'));
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        messagingInstance = admin.messaging();
        logger.info('Firebase Admin SDK initialized');
    } catch (error) {
        logger.error('Firebase Admin SDK init failed — push notifications will be disabled', {
            error: error.message
        });
    }
};

// Initialize on module load
initializeFirebase();

// ============================================
// Helpers
// ============================================

const BATCH_SIZE = 500; // FCM multicast limit
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 1000; // 1 second

/**
 * Sleep helper for retry backoff
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Build a data-only FCM message (NO "notification" key)
 */
const buildDataPayload = ({ title, body, url, notificationId, module, type, actorId, image, priority }) => ({
    data: {
        title: title || '',
        body: body || '',
        url: url || '',
        notificationId: notificationId || '',
        module: module || '',
        type: type || '',
        actorId: actorId ? String(actorId) : '',
        image: image || '',
        priority: priority || 'normal',
        timestamp: new Date().toISOString()
    },
    android: {
        priority: priority === 'high' ? 'high' : 'normal',
        ttl: 86400000 // 24 hours
    },
    webpush: {
        headers: {
            TTL: '86400',
            Urgency: priority === 'high' ? 'high' : 'normal'
        }
    }
});

// ============================================
// Core Send Functions
// ============================================

/**
 * Send push notification to specific users
 * @param {Object} payload - { title, body, url, module, type, actorId, image, priority }
 * @param {string[]} userIds - Array of MongoDB user IDs
 * @param {Object} options - { idempotencyKey, scheduledFor }
 * @returns {Object} - { notificationId, delivery: { success, failure, invalidTokens } }
 */
const sendPushNotification = async (payload, userIds, options = {}) => {
    if (!messagingInstance) {
        logger.warn('Push notification skipped — Firebase not initialized');
        return { notificationId: null, delivery: { success: 0, failure: 0, invalidTokens: 0 } };
    }

    if (!userIds || userIds.length === 0) {
        return { notificationId: null, delivery: { success: 0, failure: 0, invalidTokens: 0 } };
    }

    // Idempotency check
    if (options.idempotencyKey) {
        const existing = await NotificationLog.findOne({ idempotencyKey: options.idempotencyKey });
        if (existing) {
            logger.info('Duplicate push notification prevented', { idempotencyKey: options.idempotencyKey });
            return {
                notificationId: existing.notificationId,
                delivery: existing.deliveryStatus,
                duplicate: true
            };
        }
    }

    const notificationId = uuidv4();
    payload.notificationId = notificationId;

    // Fetch valid tokens for the target users
    const deviceTokens = await DeviceToken.findValidTokens(userIds);
    const tokens = deviceTokens.map((dt) => dt.token);

    if (tokens.length === 0) {
        logger.info('No valid device tokens found for push', { userIds: userIds.length });

        // Still log the attempt
        await NotificationLog.create({
            notificationId,
            title: payload.title,
            body: payload.body,
            module: payload.module,
            type: payload.type,
            url: payload.url,
            actorId: payload.actorId,
            recipients: userIds,
            recipientCount: userIds.length,
            deliveryStatus: { success: 0, failure: 0, invalidTokens: 0 },
            status: 'sent',
            priority: payload.priority || 'normal',
            idempotencyKey: options.idempotencyKey,
            metadata: payload.metadata
        });

        return { notificationId, delivery: { success: 0, failure: 0, invalidTokens: 0 } };
    }

    const dataPayload = buildDataPayload(payload);
    let totalSuccess = 0;
    let totalFailure = 0;
    const invalidTokensList = [];

    // Send in batches of 500
    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
        const batch = tokens.slice(i, i + BATCH_SIZE);
        const result = await sendMulticastWithRetry(dataPayload, batch);

        totalSuccess += result.success;
        totalFailure += result.failure;
        invalidTokensList.push(...result.invalidTokens);
    }

    // Clean up invalid tokens
    if (invalidTokensList.length > 0) {
        await DeviceToken.invalidateTokens(invalidTokensList);
        logger.info('Invalidated expired FCM tokens', { count: invalidTokensList.length });
    }

    // Log the notification
    await NotificationLog.create({
        notificationId,
        title: payload.title,
        body: payload.body,
        module: payload.module,
        type: payload.type,
        url: payload.url,
        actorId: payload.actorId,
        recipients: userIds,
        recipientCount: userIds.length,
        deliveryStatus: {
            success: totalSuccess,
            failure: totalFailure,
            invalidTokens: invalidTokensList.length
        },
        status: 'sent',
        priority: payload.priority || 'normal',
        idempotencyKey: options.idempotencyKey,
        metadata: payload.metadata
    });

    logger.info('Push notification sent', {
        notificationId,
        module: payload.module,
        recipients: userIds.length,
        tokens: tokens.length,
        success: totalSuccess,
        failure: totalFailure
    });

    return {
        notificationId,
        delivery: {
            success: totalSuccess,
            failure: totalFailure,
            invalidTokens: invalidTokensList.length
        }
    };
};

/**
 * Send multicast with exponential backoff retry
 */
const sendMulticastWithRetry = async (dataPayload, tokens, attempt = 0) => {
    try {
        const message = { ...dataPayload, tokens };
        const response = await messagingInstance.sendEachForMulticast(message);

        let success = response.successCount;
        let failure = response.failureCount;
        const invalidTokens = [];
        const retryableTokens = [];

        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                const errorCode = resp.error?.code;

                // Token is invalid/expired — mark for removal
                if (
                    errorCode === 'messaging/registration-token-not-registered' ||
                    errorCode === 'messaging/invalid-registration-token'
                ) {
                    invalidTokens.push(tokens[idx]);
                }
                // Retryable server errors
                else if (
                    errorCode === 'messaging/internal-error' ||
                    errorCode === 'messaging/server-unavailable'
                ) {
                    retryableTokens.push(tokens[idx]);
                }
            }
        });

        // Retry failed tokens with backoff
        if (retryableTokens.length > 0 && attempt < MAX_RETRIES) {
            const delay = BASE_RETRY_DELAY * Math.pow(2, attempt);
            logger.info(`Retrying ${retryableTokens.length} tokens after ${delay}ms (attempt ${attempt + 1})`);
            await sleep(delay);

            const retryResult = await sendMulticastWithRetry(dataPayload, retryableTokens, attempt + 1);
            success += retryResult.success;
            failure = failure - retryableTokens.length + retryResult.failure;
            invalidTokens.push(...retryResult.invalidTokens);
        }

        return { success, failure, invalidTokens };
    } catch (error) {
        logger.error('FCM multicast failed', { error: error.message, tokenCount: tokens.length, attempt });

        if (attempt < MAX_RETRIES) {
            const delay = BASE_RETRY_DELAY * Math.pow(2, attempt);
            await sleep(delay);
            return sendMulticastWithRetry(dataPayload, tokens, attempt + 1);
        }

        return { success: 0, failure: tokens.length, invalidTokens: [] };
    }
};

// ============================================
// Broadcast & Role-Based Send
// ============================================

/**
 * Send push notification to ALL users with valid tokens
 */
const sendBroadcast = async (payload, options = {}) => {
    const allTokenDocs = await DeviceToken.find({ isValid: true }).distinct('userId');
    return sendPushNotification(payload, allTokenDocs, options);
};

/**
 * Send push notification to users with a specific role
 */
const sendToRole = async (payload, roleName, options = {}) => {
    const { Role } = require('../models');
    const role = await Role.findOne({ name: new RegExp(`^${roleName}$`, 'i') });
    if (!role) {
        logger.warn('Role not found for push notification', { roleName });
        return { notificationId: null, delivery: { success: 0, failure: 0, invalidTokens: 0 } };
    }

    const users = await User.find({ roleId: role._id, isActive: true }).select('_id');
    const userIds = users.map((u) => u._id);
    return sendPushNotification(payload, userIds, options);
};

/**
 * Send push notification to all users subscribed to a topic
 */
const sendToTopic = async (payload, topic, options = {}) => {
    const tokenDocs = await DeviceToken.findTokensByTopic(topic);
    const userIds = [...new Set(tokenDocs.map((dt) => dt.userId.toString()))];
    return sendPushNotification(payload, userIds, options);
};

// ============================================
// Token Management
// ============================================

/**
 * Register or update a device token
 */
const registerToken = async (userId, tokenData) => {
    const { token, browser, platform, appVersion } = tokenData;

    const result = await DeviceToken.findOneAndUpdate(
        { userId, token },
        {
            $set: {
                device: { browser, platform, appVersion },
                lastActive: new Date(),
                isValid: true
            },
            $addToSet: { topics: 'broadcast' }
        },
        { upsert: true, new: true }
    );

    logger.debug('Device token registered', { userId, browser, platform });
    return result;
};

/**
 * Subscribe user's tokens to a topic
 */
const subscribeToTopic = async (userId, topic) => {
    await DeviceToken.updateMany(
        { userId, isValid: true },
        { $addToSet: { topics: topic } }
    );
    logger.debug('User subscribed to topic', { userId, topic });
};

/**
 * Unsubscribe user's tokens from a topic
 */
const unsubscribeFromTopic = async (userId, topic) => {
    await DeviceToken.updateMany(
        { userId, isValid: true },
        { $pull: { topics: topic } }
    );
    logger.debug('User unsubscribed from topic', { userId, topic });
};

// ============================================
// Click Tracking
// ============================================

/**
 * Record a click on a push notification
 */
const trackClick = async (notificationId, userId) => {
    const log = await NotificationLog.findOneAndUpdate(
        { notificationId },
        {
            $inc: { totalClicks: 1 },
            $push: { clickedBy: { userId, clickedAt: new Date() } }
        },
        { new: true }
    );

    if (!log) {
        logger.warn('Notification log not found for click tracking', { notificationId });
    }

    return log;
};

// ============================================
// Scheduled Notifications
// ============================================

/**
 * Process scheduled notifications that are due
 */
const processScheduledNotifications = async () => {
    const now = new Date();
    const pendingLogs = await NotificationLog.find({
        status: 'scheduled',
        scheduledFor: { $lte: now }
    });

    if (pendingLogs.length === 0) return;

    logger.info(`Processing ${pendingLogs.length} scheduled push notifications`);

    for (const log of pendingLogs) {
        try {
            const payload = {
                title: log.title,
                body: log.body,
                url: log.url,
                module: log.module,
                type: log.type,
                actorId: log.actorId,
                priority: log.priority,
                metadata: log.metadata
            };

            const result = await sendPushNotification(payload, log.recipients, {
                idempotencyKey: `scheduled-${log.notificationId}`
            });

            log.status = 'sent';
            log.deliveryStatus = result.delivery;
            log.sentAt = new Date();
            await log.save();
        } catch (error) {
            logger.error('Failed to process scheduled notification', {
                notificationId: log.notificationId,
                error: error.message
            });
            log.status = 'failed';
            await log.save();
        }
    }
};

// ============================================
// Analytics
// ============================================

/**
 * Get push notification analytics
 */
const getAnalytics = async (options = {}) => {
    const { page = 1, limit = 20, module: mod, startDate, endDate } = options;
    const skip = (page - 1) * limit;

    const query = {};
    if (mod) query.module = mod;
    if (startDate || endDate) {
        query.sentAt = {};
        if (startDate) query.sentAt.$gte = new Date(startDate);
        if (endDate) query.sentAt.$lte = new Date(endDate);
    }

    const [logs, totalCount, aggregateStats] = await Promise.all([
        NotificationLog.find(query)
            .sort({ sentAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('-clickedBy'),
        NotificationLog.countDocuments(query),
        NotificationLog.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalSent: { $sum: 1 },
                    totalRecipients: { $sum: '$recipientCount' },
                    totalSuccessful: { $sum: '$deliveryStatus.success' },
                    totalFailed: { $sum: '$deliveryStatus.failure' },
                    totalClicks: { $sum: '$totalClicks' }
                }
            }
        ])
    ]);

    const stats = aggregateStats[0] || {
        totalSent: 0,
        totalRecipients: 0,
        totalSuccessful: 0,
        totalFailed: 0,
        totalClicks: 0
    };

    return {
        logs,
        stats,
        pagination: {
            total: totalCount,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(totalCount / limit)
        }
    };
};

module.exports = {
    sendPushNotification,
    sendBroadcast,
    sendToRole,
    sendToTopic,
    registerToken,
    subscribeToTopic,
    unsubscribeFromTopic,
    trackClick,
    processScheduledNotifications,
    getAnalytics
};
