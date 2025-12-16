const { Notification } = require('../models');
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
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId, userId) => {
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
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (userId) => {
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
};

/**
 * Get unread count
 */
const getUnreadCount = async (userId) => {
  const count = await Notification.countDocuments({
    userId,
    isRead: false
  });

  return { unreadCount: count };
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
  if (!announcementTitle) {
    logger.warn('notifyAnnouncement called without title');
    return;
  }

  const content = `New announcement: ${announcementTitle}`;

  await createBulkNotifications(userIds, {
    type: 'ANNOUNCEMENT',
    content,
    metadata: { announcementId, announcementTitle }
  });
};

/**
 * Delete a single notification
 */
const deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    userId
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  await Notification.deleteOne({ _id: notificationId, userId });

  return { success: true };
};

/**
 * Delete all notifications for a user
 */
const deleteAllNotifications = async (userId) => {
  await Notification.deleteMany({ userId });

  return { success: true, message: 'All notifications deleted' };
};

/**
 * Trigger notification for new blog published
 */
const notifyBlogPublished = async (userIds, blogTitle, blogId, authorId) => {
  if (!userIds || userIds.length === 0) return;

  // Exclude the author from notifications
  const filteredUserIds = userIds.filter(id => id.toString() !== authorId?.toString());
  if (filteredUserIds.length === 0) return;

  const content = `New blog published: ${blogTitle}`;

  await createBulkNotifications(filteredUserIds, {
    type: 'SYSTEM',
    content,
    metadata: { blogId, blogTitle, contentType: 'blog' }
  });
};

/**
 * Trigger notification for new discussion started
 */
const notifyDiscussionCreated = async (userIds, discussionTitle, discussionId, authorId) => {
  if (!userIds || userIds.length === 0) return;

  // Exclude the author from notifications
  const filteredUserIds = userIds.filter(id => id.toString() !== authorId?.toString());
  if (filteredUserIds.length === 0) return;

  const content = `New discussion: ${discussionTitle}`;

  await createBulkNotifications(filteredUserIds, {
    type: 'SYSTEM',
    content,
    metadata: { discussionId, discussionTitle, contentType: 'discussion' }
  });
};

/**
 * Trigger notification for new public group created
 */
const notifyGroupCreated = async (userIds, groupName, groupId, creatorId) => {
  if (!userIds || userIds.length === 0) return;

  // Exclude the creator from notifications
  const filteredUserIds = userIds.filter(id => id.toString() !== creatorId?.toString());
  if (filteredUserIds.length === 0) return;

  const content = `New group created: ${groupName}`;

  await createBulkNotifications(filteredUserIds, {
    type: 'GROUP_POST',
    content,
    metadata: { groupId, groupName, contentType: 'group' }
  });
};

/**
 * Trigger notification for new group post (to all group members except author)
 */
const notifyNewGroupPost = async (memberIds, groupName, postId, authorId) => {
  if (!memberIds || memberIds.length === 0) return;

  // Exclude the author from notifications
  const filteredMemberIds = memberIds.filter(id => id.toString() !== authorId?.toString());
  if (filteredMemberIds.length === 0) return;

  const content = `New post in ${groupName}`;

  await createBulkNotifications(filteredMemberIds, {
    type: 'GROUP_POST',
    content,
    metadata: { groupName, postId }
  });
};

/**
 * Trigger notification for blog comment
 */
const notifyBlogComment = async (blogAuthorId, commenterName, blogTitle, blogId, commentId) => {
  if (!blogAuthorId) return;

  const content = `${commenterName} commented on your blog: ${blogTitle}`;

  await createNotification({
    userId: blogAuthorId,
    type: 'COMMENT',
    content,
    metadata: { blogId, blogTitle, commentId, contentType: 'blog' }
  });
};

/**
 * Trigger notification for discussion comment
 */
const notifyDiscussionComment = async (discussionAuthorId, commenterName, discussionTitle, discussionId, commentId) => {
  if (!discussionAuthorId) return;

  const content = `${commenterName} commented on your discussion: ${discussionTitle}`;

  await createNotification({
    userId: discussionAuthorId,
    type: 'COMMENT',
    content,
    metadata: { discussionId, discussionTitle, commentId, contentType: 'discussion' }
  });
};

/**
 * Trigger notification for likes
 */
const notifyLike = async (contentAuthorId, likerName, contentTitle, contentId, contentType) => {
  if (!contentAuthorId) return;

  const content = `${likerName} liked your ${contentType}: ${contentTitle}`;

  await createNotification({
    userId: contentAuthorId,
    type: 'LIKE',
    content,
    metadata: { contentId, contentTitle, contentType }
  });
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
  notifyAnnouncement,
  notifyBlogPublished,
  notifyDiscussionCreated,
  notifyGroupCreated,
  notifyNewGroupPost,
  notifyBlogComment,
  notifyDiscussionComment,
  notifyLike
};
