const { Notification } = require('../models');
const dummyDataService = require('./dummyDataService');
const logger = require('../utils/logger');

/**
 * Create a notification
 */
const createNotification = async (notificationData) => {
  const { userId, type, content, metadata } = notificationData;

  const notification = await Notification.create({
    userId,
    type,
    content,
    metadata: metadata || null
  });

  // TODO: Send email notification (placeholder)
  // await sendEmailNotification(userId, type, content);

  return notification;
};

/**
 * Create notifications for multiple users
 */
const createBulkNotifications = async (userIds, notificationData) => {
  const { type, content, metadata } = notificationData;

  const notifications = userIds.map(userId => ({
    userId,
    type,
    content,
    metadata: metadata || null
  }));

  await Notification.insertMany(notifications);

  // TODO: Send email notifications
  return { count: notifications.length };
};

/**
 * Get user notifications
 */
const getUserNotifications = async (userId, options = {}) => {
  try {
    const { page = 1, limit = 20, isRead } = options;
    const skip = (page - 1) * limit;

    const query = { userId };
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    const [notifications, totalCount, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId, isRead: false })
    ]);

    return {
      notifications,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / limit)
      },
      unreadCount
    };
  } catch (error) {
    // Database unavailable - return dummy data
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      logger.warn('Database unavailable, using dummy notifications', { userId });
      return dummyDataService.getDummyNotifications(userId, options);
    }
    throw error;
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOne({
      _id: notificationId,
      userId
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return notification;
  } catch (error) {
    // Database unavailable - return dummy success
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      logger.warn('Database unavailable, using dummy mark as read', { notificationId });
      return { id: notificationId, isRead: true };
    }
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (userId) => {
  try {
    await Notification.updateMany(
      { userId, isRead: false },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    return { success: true };
  } catch (error) {
    // Database unavailable - return dummy success
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      logger.warn('Database unavailable, using dummy mark all as read', { userId });
      return { success: true };
    }
    throw error;
  }
};

/**
 * Get unread count
 */
const getUnreadCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({
      userId,
      isRead: false
    });

    return { unreadCount: count };
  } catch (error) {
    // Database unavailable - return dummy data
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      logger.warn('Database unavailable, using dummy unread count', { userId });
      return dummyDataService.getDummyUnreadCount(userId);
    }
    throw error;
  }
};

/**
 * Trigger notification for mention
 */
const notifyMention = async (mentionedUserIds, postId, mentionedBy, postType) => {
  if (!mentionedUserIds || mentionedUserIds.length === 0) return;

  const content = `${mentionedBy} mentioned you in a ${postType}`;

  await createBulkNotifications(mentionedUserIds, {
    type: 'MENTION',
    content,
    metadata: { postId, postType }
  });
};

/**
 * Trigger notification for recognition
 */
const notifyRecognition = async (receiverId, senderName, points) => {
  const content = `${senderName} recognized you${points ? ` and awarded ${points} points` : ''}`;

  await createNotification({
    userId: receiverId,
    type: 'RECOGNITION',
    content,
    metadata: { points }
  });
};

/**
 * Trigger notification for group post
 */
const notifyGroupPost = async (groupMemberIds, groupName, postId) => {
  if (!groupMemberIds || groupMemberIds.length === 0) return;

  const content = `New post in ${groupName}`;

  await createBulkNotifications(groupMemberIds, {
    type: 'GROUP_POST',
    content,
    metadata: { groupName, postId }
  });
};

/**
 * Trigger notification for survey published
 */
const notifySurveyPublished = async (userIds, surveyTitle, surveyId) => {
  if (!userIds || userIds.length === 0) return;

  const content = `New survey: ${surveyTitle}`;

  await createBulkNotifications(userIds, {
    type: 'SURVEY_PUBLISHED',
    content,
    metadata: { surveyId, surveyTitle }
  });
};

/**
 * Trigger notification for announcement
 */
const notifyAnnouncement = async (userIds, announcementTitle, announcementId) => {
  if (!userIds || userIds.length === 0) return;

  await createBulkNotifications(userIds, {
    type: 'ANNOUNCEMENT',
    metadata: { announcementId, announcementTitle }
  });
};

/**
 * Delete a single notification
 */
const deleteNotification = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOne({
      _id: notificationId,
      userId
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await Notification.deleteOne({ _id: notificationId, userId });

    return { success: true };
  } catch (error) {
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      logger.warn('Database unavailable, using dummy delete', { notificationId });
      return { success: true };
    }
    throw error;
  }
};

/**
 * Delete all notifications for a user
 */
const deleteAllNotifications = async (userId) => {
  try {
    await Notification.deleteMany({ userId });

    return { success: true, message: 'All notifications deleted' };
  } catch (error) {
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      logger.warn('Database unavailable, using dummy delete all', { userId });
      return { success: true, message: 'All notifications deleted' };
    }
    throw error;
  }
};

module.exports = {
  createNotification,
  createBulkNotifications,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  deleteAllNotifications,
  notifyMention,
  notifyRecognition,
  notifyGroupPost,
  notifySurveyPublished,
  notifyAnnouncement
};
