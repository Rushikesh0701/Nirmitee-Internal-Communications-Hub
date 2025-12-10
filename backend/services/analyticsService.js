const { Analytics, Blog, Discussion, User, SurveyModel, Course } = require('../models');

const getDashboardStats = async (user, userRole) => {
  // Check role - prefer passed userRole, fallback to extracting from user object
  const role = userRole || user.roleId?.name || user.role || user.Role?.name;
  if (!['Admin', 'Moderator'].includes(role)) {
    throw new Error('Unauthorized to view analytics');
  }

  const [
    totalBlogs,
    totalDiscussions,
    totalUsers,
    totalSurveys,
    totalCourses,
    recentBlogs
  ] = await Promise.all([
    Blog.countDocuments(),
    Discussion.countDocuments(),
    User.countDocuments({ isActive: true }),
    SurveyModel.countDocuments({ isActive: true }),
    Course.countDocuments({ isPublished: true }),
    Blog.find()
      .populate('authorId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5)
  ]);

  return {
    overview: {
      totalNews: 0, // News model removed
      totalBlogs,
      totalDiscussions,
      totalUsers,
      totalSurveys,
      totalCourses
    },
    recentContent: {
      news: [], // News model removed
      blogs: recentBlogs
    }
  };
};

const getContentAnalytics = async (options, user, userRole) => {
  // Check role - prefer passed userRole, fallback to extracting from user object
  const role = userRole || user.roleId?.name || user.role || user.Role?.name;
  if (!['Admin', 'Moderator'].includes(role)) {
    throw new Error('Unauthorized');
  }

  const { entityType, startDate, endDate } = options;
  const dateQuery = {};
  
  // Default to last 30 days if no dates provided
  if (startDate && endDate) {
    dateQuery.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  } else {
    const end = new Date();
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    dateQuery.createdAt = {
      $gte: start,
      $lte: end
    };
  }

  let analytics = {};

  // Helper function to get time-series data
  const getTimeSeriesData = async (Model, dateField = 'createdAt') => {
    const timeSeries = await Model.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: `$${dateField}` }
          },
          count: { $sum: 1 },
          totalViews: { $sum: '$views' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return timeSeries.map(item => ({
      date: item._id,
      count: item.count,
      views: item.totalViews || 0
    }));
  };

  // Get overall stats (News model removed)
  if (!entityType || entityType === 'news') {
    analytics.news = {
      count: 0,
      totalViews: 0,
      timeSeries: []
    };
  }

  if (!entityType || entityType === 'blog') {
    const [blogStats, blogTimeSeries] = await Promise.all([
      Blog.aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalViews: { $sum: '$views' }
          }
        }
      ]),
      getTimeSeriesData(Blog)
    ]);
    analytics.blogs = {
      ...(blogStats[0] || { count: 0, totalViews: 0 }),
      timeSeries: blogTimeSeries
    };
  }

  if (!entityType || entityType === 'discussion') {
    const [discussionStats, discussionTimeSeries] = await Promise.all([
      Discussion.aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalViews: { $sum: '$views' }
          }
        }
      ]),
      getTimeSeriesData(Discussion)
    ]);
    analytics.discussions = {
      ...(discussionStats[0] || { count: 0, totalViews: 0 }),
      timeSeries: discussionTimeSeries
    };
  }

  // Get combined time-series for all content types (News model removed)
  if (!entityType) {
    const [blogSeries, discussionSeries] = await Promise.all([
      getTimeSeriesData(Blog),
      getTimeSeriesData(Discussion)
    ]);

    // Combine all time-series data
    const dateMap = new Map();
    
    // Add all dates from all series
    [...blogSeries, ...discussionSeries].forEach(item => {
      if (!dateMap.has(item.date)) {
        dateMap.set(item.date, { date: item.date, news: 0, blogs: 0, discussions: 0 });
      }
    });
    
    blogSeries.forEach(item => {
      if (dateMap.has(item.date)) {
        dateMap.get(item.date).blogs = item.count;
      }
    });
    
    discussionSeries.forEach(item => {
      if (dateMap.has(item.date)) {
        dateMap.get(item.date).discussions = item.count;
      }
    });

    analytics.combinedTimeSeries = Array.from(dateMap.values()).sort((a, b) => 
      a.date.localeCompare(b.date)
    );
  }

  return analytics;
};

const getUserEngagement = async (options, user, userRole) => {
  // Check role - prefer passed userRole, fallback to extracting from user object
  const role = userRole || user.roleId?.name || user.role || user.Role?.name;
  if (!['Admin', 'Moderator'].includes(role)) {
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
