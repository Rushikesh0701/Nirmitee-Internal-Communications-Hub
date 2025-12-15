const {
  Recognition,
  SurveyModel,
  SurveyResponse,
  UserCourse,
  Course,
  Notification,
  User,
  UserPoints
} = require('../models');
const mongoose = require('mongoose');

/**
 * Get overview statistics
 */
const getOverview = async () => {
  const [
    totalRecognitions,
    totalSurveys,
    totalCourses,
    totalUsers,
    activeSurveys,
    completedCourses,
    pointsAggregation
  ] = await Promise.all([
    Recognition.countDocuments(),
    SurveyModel.countDocuments(),
    Course.countDocuments(),
    User.countDocuments({ isActive: true }),
    SurveyModel.countDocuments({ status: 'ACTIVE' }),
    UserCourse.countDocuments({ status: 'COMPLETED' }),
    UserPoints.aggregate([{ $group: { _id: null, total: { $sum: '$totalPoints' } } }])
  ]);

  const totalPointsAwarded = pointsAggregation.length > 0 ? pointsAggregation[0].total : 0;

  return {
    recognitions: {
      total: totalRecognitions
    },
    surveys: {
      total: totalSurveys,
      active: activeSurveys
    },
    courses: {
      total: totalCourses,
      completed: completedCourses
    },
    users: {
      total: totalUsers
    },
    points: {
      totalAwarded: totalPointsAwarded || 0
    }
  };
};

/**
 * Get engagement metrics by time range
 */
const getEngagementMetrics = async (range = 'daily') => {
  let dateFormat;
  const now = new Date();
  let startDate;

  switch (range) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      dateFormat = '%Y-%m-%d';
      break;
    case 'weekly':
      startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
      dateFormat = '%Y-W%V';
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
      dateFormat = '%Y-%m';
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFormat = '%Y-%m-%d';
  }

  const matchStage = {
    createdAt: { $gte: startDate }
  };

  const groupStage = {
    _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
    count: { $sum: 1 }
  };

  const projectStage = {
    date: '$_id',
    count: 1,
    _id: 0
  };

  const sortStage = { date: 1 };

  // Get recognitions over time
  const recognitionData = await Recognition.aggregate([
    { $match: matchStage },
    { $group: groupStage },
    { $project: projectStage },
    { $sort: sortStage }
  ]);

  // Get survey responses over time
  const surveyResponseData = await SurveyResponse.aggregate([
    { $match: matchStage },
    { $group: groupStage },
    { $project: projectStage },
    { $sort: sortStage }
  ]);

  // Get course enrollments over time
  const enrollmentData = await UserCourse.aggregate([
    { $match: matchStage },
    { $group: groupStage },
    { $project: projectStage },
    { $sort: sortStage }
  ]);

  return {
    recognitions: recognitionData,
    surveyResponses: surveyResponseData,
    enrollments: enrollmentData
  };
};

/**
 * Get survey analytics
 */
const getSurveyAnalytics = async () => {
  const surveys = await SurveyModel.aggregate([
    {
      $lookup: {
        from: 'surveyresponses',
        localField: '_id',
        foreignField: 'surveyId',
        as: 'responses'
      }
    },
    {
      $project: {
        id: '$_id',
        title: 1,
        status: 1,
        responseCount: { $size: '$responses' },
        createdAt: 1
      }
    },
    { $sort: { createdAt: -1 } }
  ]);

  const totalResponses = await SurveyResponse.countDocuments();
  const activeSurveys = await SurveyModel.countDocuments({ status: 'ACTIVE' });

  return {
    totalSurveys: surveys.length,
    activeSurveys,
    totalResponses,
    surveys: surveys.map(s => ({
      id: s.id,
      title: s.title,
      status: s.status,
      responseCount: s.responseCount || 0
    }))
  };
};

/**
 * Get recognition analytics
 */
const getRecognitionAnalytics = async () => {
  const totalRecognitions = await Recognition.countDocuments();

  const pointsAggregation = await Recognition.aggregate([
    { $group: { _id: null, total: { $sum: '$points' } } }
  ]);
  const totalPointsAwarded = pointsAggregation.length > 0 ? pointsAggregation[0].total : 0;

  // Top receivers
  const topReceivers = await Recognition.aggregate([
    {
      $group: {
        _id: '$receiverId',
        count: { $sum: 1 },
        totalPoints: { $sum: '$points' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'receiver'
      }
    },
    { $unwind: '$receiver' },
    {
      $project: {
        receiver: {
          id: '$receiver._id',
          name: '$receiver.name',
          email: '$receiver.email',
          avatar: '$receiver.avatar'
        },
        count: 1,
        totalPoints: 1
      }
    }
  ]);

  // Badge distribution
  const badgeDistribution = await Recognition.aggregate([
    {
      $match: {
        badge: { $ne: null }
      }
    },
    {
      $group: {
        _id: '$badge',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    {
      $project: {
        badge: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);

  return {
    totalRecognitions,
    totalPointsAwarded,
    topReceivers: topReceivers.map(r => ({
      user: r.receiver,
      recognitionCount: r.count,
      totalPoints: r.totalPoints || 0
    })),
    badgeDistribution
  };
};

/**
 * Get blog engagement analytics
 */
const getBlogAnalytics = async () => {
  // This would need Blog model
  // For now, return placeholder structure
  return {
    totalBlogs: 0,
    totalViews: 0,
    totalComments: 0,
    averageEngagement: 0
  };
};

/**
 * Get MAU (Monthly Active Users)
 */
const getMAU = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Count users who have logged in this month
  const mau = await User.countDocuments({
    lastLogin: { $gte: startOfMonth },
    isActive: true
  });

  // Get previous month for comparison
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const previousMAU = await User.countDocuments({
    lastLogin: {
      $gte: previousMonthStart,
      $lte: previousMonthEnd
    },
    isActive: true
  });

  return {
    current: mau,
    previous: previousMAU,
    change: mau - previousMAU,
    changePercent: previousMAU > 0 ? ((mau - previousMAU) / previousMAU * 100).toFixed(2) : 0
  };
};

/**
 * Get posts and comments count
 */
const getPostsAndCommentsCount = async () => {
  // This would need GroupPost, Discussion, DiscussionComment models
  // For now, return placeholder
  return {
    posts: {
      total: 0,
      thisMonth: 0
    },
    comments: {
      total: 0,
      thisMonth: 0
    }
  };
};

/**
 * Get sentiment analysis for feedback/surveys/blogs
 * PLACEHOLDER: Structure for AI-based sentiment analysis
 */
const getSentimentAnalysis = async (options = {}) => {
  const { contentType = 'survey', startDate, endDate } = options;

  // Placeholder structure - in production, this would call an AI service
  // like Google Cloud Natural Language API, AWS Comprehend, or custom ML model

  return {
    contentType,
    period: {
      startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: endDate || new Date()
    },
    overall: {
      sentiment: 'POSITIVE', // POSITIVE, NEGATIVE, NEUTRAL, MIXED
      score: 0.75, // -1 to 1 scale
      confidence: 0.85 // 0 to 1 scale
    },
    distribution: {
      positive: 65, // percentage
      neutral: 25,
      negative: 10
    },
    topKeywords: [
      { word: 'great', frequency: 45, sentiment: 'positive' },
      { word: 'helpful', frequency: 32, sentiment: 'positive' },
      { word: 'improve', frequency: 28, sentiment: 'neutral' }
    ],
    trends: [
      {
        date: '2025-01-01',
        positiveScore: 0.7,
        neutralScore: 0.2,
        negativeScore: 0.1
      }
    ],
    // Placeholder for future implementation
    aiServiceStatus: 'NOT_IMPLEMENTED',
    message: 'Sentiment analysis is a placeholder. Implement with AI service like Google NLP, AWS Comprehend, or custom model.'
  };
};

module.exports = {
  getOverview,
  getEngagementMetrics,
  getSurveyAnalytics,
  getRecognitionAnalytics,
  getBlogAnalytics,
  getMAU,
  getPostsAndCommentsCount,
  getSentimentAnalysis
};
