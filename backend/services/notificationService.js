const { Notification, User } = require('../models');
const logger = require('../utils/logger');
const { sendNotificationEmail, sendBulkNotificationEmails } = require('./emailService');

// Lazy-load pushService to avoid circular dependency on startup
let _pushService = null;
const getPushService = () => {
  if (!_pushService) {
    try {
      _pushService = require('./pushService');
    } catch (err) {
      logger.warn('Push service not available', { error: err.message });
    }
  }
  return _pushService;
};

/**
 * Helper: fire push notification (non-blocking, never throws)
 */
const firePush = async (payload, userIds) => {
  try {
    const push = getPushService();
    if (push && userIds && userIds.length > 0) {
      await push.sendPushNotification(payload, userIds);
    }
  } catch (error) {
    logger.error('Push notification failed (non-blocking)', { error: error.message, module: payload.module });
  }
};

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

  // Send email notification
  try {
    const user = await User.findById(userId).select('email');
    if (user && user.email) {
      const appUrl = process.env.FRONTEND_URL || '';
      await sendNotificationEmail(user.email, type, content, metadata || {}, appUrl);
    }
  } catch (error) {
    // Log error but don't fail notification creation if email fails
    logger.error('Failed to send email notification', { userId, type, error: error.message });
  }

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

  // Send email notifications
  try {
    const appUrl = process.env.FRONTEND_URL || '';
    await sendBulkNotificationEmails(userIds, type, content, metadata || {}, appUrl);
  } catch (error) {
    // Log error but don't fail notification creation if email fails
    logger.error('Failed to send bulk email notifications', { userIds: userIds.length, type, error: error.message });
  }

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

  // Push notification
  firePush({
    title: 'You were mentioned',
    body: content,
    url: `/${postType}s/${postId}`,
    module: postType === 'discussion' ? 'discussions' : 'activity',
    type: 'MENTION'
  }, mentionedUserIds);
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

  firePush({
    title: 'You\'ve been recognized! 🎉',
    body: content,
    url: '/recognitions',
    module: 'recognition',
    type: 'RECOGNITION'
  }, [receiverId]);
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

  firePush({
    title: `New post in ${groupName}`,
    body: content,
    url: `/groups`,
    module: 'groups',
    type: 'GROUP_POST'
  }, groupMemberIds);
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

  firePush({
    title: 'New Survey Available 📋',
    body: content,
    url: `/surveys/${surveyId}`,
    module: 'surveys',
    type: 'SURVEY_PUBLISHED'
  }, userIds);
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

  firePush({
    title: 'New Announcement 📢',
    body: content,
    url: `/announcements`,
    module: 'announcements',
    type: 'ANNOUNCEMENT',
    priority: 'high'
  }, userIds);
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

  firePush({
    title: 'New Blog Post ✍️',
    body: content,
    url: `/blogs/${blogId}`,
    module: 'blogs',
    type: 'BLOG_PUBLISHED'
  }, filteredUserIds);
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

  firePush({
    title: 'New Discussion 💬',
    body: content,
    url: `/discussions/${discussionId}`,
    module: 'discussions',
    type: 'DISCUSSION_CREATED'
  }, filteredUserIds);
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

  firePush({
    title: 'New Group Created 👥',
    body: content,
    url: `/groups`,
    module: 'groups',
    type: 'GROUP_CREATED'
  }, filteredUserIds);
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

  firePush({
    title: `New post in ${groupName}`,
    body: content,
    url: `/groups`,
    module: 'groups',
    type: 'GROUP_POST'
  }, filteredMemberIds);
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

  firePush({
    title: 'New Comment on Your Blog 💬',
    body: content,
    url: `/blogs/${blogId}`,
    module: 'blogs',
    type: 'COMMENT'
  }, [blogAuthorId]);
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

  firePush({
    title: 'New Comment on Your Discussion 💬',
    body: content,
    url: `/discussions/${discussionId}`,
    module: 'discussions',
    type: 'COMMENT'
  }, [discussionAuthorId]);
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

  firePush({
    title: `${likerName} liked your ${contentType} ❤️`,
    body: content,
    url: `/${contentType}s/${contentId}`,
    module: 'activity',
    type: 'LIKE'
  }, [contentAuthorId]);
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
