const { Analytics, News, Blog, Discussion, User, Survey, Course } = require('../models');

const getDashboardStats = async (user) => {
  if (!['Admin', 'Moderator'].includes(user.Role?.name)) {
    throw new Error('Unauthorized to view analytics');
  }

  const [
    totalNews,
    totalBlogs,
    totalDiscussions,
    totalUsers,
    totalSurveys,
    totalCourses,
    recentNews,
    recentBlogs
  ] = await Promise.all([
    News.countDocuments(),
    Blog.countDocuments(),
    Discussion.countDocuments(),
    User.countDocuments({ isActive: true }),
    Survey.countDocuments({ isActive: true }),
    Course.countDocuments({ isPublished: true }),
    News.find()
      .populate('authorId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5),
    Blog.find()
      .populate('authorId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5)
  ]);

  return {
    overview: {
      totalNews,
      totalBlogs,
      totalDiscussions,
      totalUsers,
      totalSurveys,
      totalCourses
    },
    recentContent: {
      news: recentNews,
      blogs: recentBlogs
    }
  };
};

const getContentAnalytics = async (options, user) => {
  if (!['Admin', 'Moderator'].includes(user.Role?.name)) {
    throw new Error('Unauthorized');
  }

  const { entityType, startDate, endDate } = options;
  const dateQuery = {};
  
  if (startDate && endDate) {
    dateQuery.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  let analytics = {};

  if (!entityType || entityType === 'news') {
    const newsStats = await News.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalViews: { $sum: '$views' }
        }
      }
    ]);
    analytics.news = newsStats[0] || { count: 0, totalViews: 0 };
  }

  if (!entityType || entityType === 'blog') {
    const blogStats = await Blog.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalViews: { $sum: '$views' }
        }
      }
    ]);
    analytics.blogs = blogStats[0] || { count: 0, totalViews: 0 };
  }

  if (!entityType || entityType === 'discussion') {
    const discussionStats = await Discussion.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalViews: { $sum: '$views' }
        }
      }
    ]);
    analytics.discussions = discussionStats[0] || { count: 0, totalViews: 0 };
  }

  return analytics;
};

const getUserEngagement = async (options, user) => {
  if (!['Admin', 'Moderator'].includes(user.Role?.name)) {
    throw new Error('Unauthorized');
  }

  const { startDate, endDate } = options;
  const dateQuery = {};
  
  if (startDate && endDate) {
    dateQuery.timestamp = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const events = await Analytics.aggregate([
    { $match: dateQuery },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 }
      }
    }
  ]);

  return { events };
};

const trackEvent = async (eventData) => {
  const { userId, eventType, entityType, entityId, metadata } = eventData;
  
  await Analytics.create({
    userId,
    eventType,
    entityType,
    entityId,
    metadata,
    timestamp: new Date()
  });
};

module.exports = {
  getDashboardStats,
  getContentAnalytics,
  getUserEngagement,
  trackEvent
};
