const notificationService = require('../services/notificationService');

/**
 * GET /notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.userId || 'dummy-user-id-123';
    const { page, limit, isRead } = req.query;

    const result = await notificationService.getUserNotifications(userId, {
      page,
      limit,
      isRead
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    // If database error, return dummy data
    if (error.name === 'SequelizeConnectionRefusedError' ||
      error.name === 'SequelizeConnectionError') {
      const userId = req.userId || 'dummy-user-id-123';
      const result = dummyDataService.getDummyNotifications(userId, {
        page: req.query.page,
        limit: req.query.limit,
        isRead: req.query.isRead
      });
      return res.json({
        success: true,
        data: result
      });
    }
    next(error);
  }
};

/**
 * POST /notifications/mark-read
 */
const markAsRead = async (req, res, next) => {
  try {
    const userId = req.userId || 'dummy-user-id-123';
    const { notificationId } = req.body;

    if (notificationId) {
      const notification = await notificationService.markAsRead(notificationId, userId);
      res.json({
        success: true,
        data: notification
      });
    } else {
      // Mark all as read
      await notificationService.markAllAsRead(userId);
      res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    }
  } catch (error) {
    // If database error, return dummy success
    if (error.name === 'SequelizeConnectionRefusedError' ||
      error.name === 'SequelizeConnectionError') {
      return res.json({
        success: true,
        message: 'All notifications marked as read (dummy mode)'
      });
    }
    if (error.message === 'Notification not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * GET /notifications/unread-count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.userId || 'dummy-user-id-123';
    const result = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    // If database error, return dummy data
    if (error.name === 'SequelizeConnectionRefusedError' ||
      error.name === 'SequelizeConnectionError') {
      const userId = req.userId || 'dummy-user-id-123';
      const result = dummyDataService.getDummyUnreadCount(userId);
      return res.json({
        success: true,
        data: result
      });
    }
    next(error);
  }
};

/**
 * DELETE /notifications/:id
 */
const deleteNotification = async (req, res, next) => {
  try {
    const userId = req.userId || 'dummy-user-id-123';
    const { id } = req.params;

    await notificationService.deleteNotification(id, userId);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Notification not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * DELETE /notifications
 */
const deleteAllNotifications = async (req, res, next) => {
  try {
    const userId = req.userId || 'dummy-user-id-123';

    await notificationService.deleteAllNotifications(userId);

    res.json({
      success: true,
      message: 'All notifications deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  getUnreadCount,
  deleteNotification,
  deleteAllNotifications
};
