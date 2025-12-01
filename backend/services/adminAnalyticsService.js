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
    totalPointsAwarded
  ] = await Promise.all([
    Recognition.count(),
    Survey.count(),
    Course.count(),
    User.count({ where: { isActive: true } }),
    Survey.count({ where: { status: 'ACTIVE' } }),
    UserCourse.count({ where: { status: 'COMPLETED' } }),
    UserPoints.sum('totalPoints')
  ]);

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
  let dateFormat, groupBy;
  const now = new Date();
  let startDate;

  switch (range) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      dateFormat = 'YYYY-MM-DD';
      groupBy = Sequelize.fn('DATE', Sequelize.col('createdAt'));
      break;
    case 'weekly':
      startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
      dateFormat = 'YYYY-"W"WW';
      groupBy = Sequelize.fn('TO_CHAR', Sequelize.col('createdAt'), 'YYYY-"W"WW');
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
      dateFormat = 'YYYY-MM';
      groupBy = Sequelize.fn('TO_CHAR', Sequelize.col('createdAt'), 'YYYY-MM');
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFormat = 'YYYY-MM-DD';
      groupBy = Sequelize.fn('DATE', Sequelize.col('createdAt'));
  }

  const where = {
    createdAt: {
      [Op.gte]: startDate
    }
  };

  // Get recognitions over time
  const recognitionData = await Recognition.findAll({
    where,
    attributes: [
      [groupBy, 'date'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    group: ['date'],
    order: [['date', 'ASC']],
    raw: true
  });

  // Get survey responses over time
  const surveyResponseData = await SurveyResponse.findAll({
    where,
    attributes: [
      [groupBy, 'date'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    group: ['date'],
    order: [['date', 'ASC']],
    raw: true
  });

  // Get course enrollments over time
  const enrollmentData = await UserCourse.findAll({
    where,
    attributes: [
      [groupBy, 'date'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    group: ['date'],
    order: [['date', 'ASC']],
    raw: true
  });

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
  const surveys = await Survey.findAll({
    include: [
      {
        model: SurveyResponse,
        as: 'responses',
        attributes: []
      }
    ],
    attributes: [
      'id',
      'title',
      'status',
      [Sequelize.fn('COUNT', Sequelize.col('responses.id')), 'responseCount']
    ],
    group: ['Survey.id'],
    order: [['createdAt', 'DESC']]
  });

  const totalResponses = await SurveyResponse.count();
  const activeSurveys = await Survey.count({ where: { status: 'ACTIVE' } });

  return {
    totalSurveys: surveys.length,
    activeSurveys,
    totalResponses,
    surveys: surveys.map(s => ({
      id: s.id,
      title: s.title,
      status: s.status,
      responseCount: parseInt(s.dataValues.responseCount) || 0
    }))
  };
};

/**
 * Get recognition analytics
 */
const getRecognitionAnalytics = async () => {
  const totalRecognitions = await Recognition.count();
  const totalPointsAwarded = await Recognition.sum('points') || 0;

  // Top receivers
  const topReceivers = await Recognition.findAll({
    attributes: [
      'receiverId',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
      [Sequelize.fn('SUM', Sequelize.col('points')), 'totalPoints']
    ],
    group: ['receiverId'],
    order: [[Sequelize.literal('count'), 'DESC']],
    limit: 10,
    include: [
      {
        model: User,
        as: 'receiver',
        attributes: ['id', 'name', 'email', 'avatar']
      }
    ]
  });

  // Badge distribution
  const badgeDistribution = await Recognition.findAll({
    attributes: [
      'badge',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    where: {
      badge: { [Op.ne]: null }
    },
    group: ['badge'],
    order: [[Sequelize.literal('count'), 'DESC']]
  });

  return {
    totalRecognitions,
    totalPointsAwarded,
    topReceivers: topReceivers.map(r => ({
      user: r.receiver,
      recognitionCount: parseInt(r.dataValues.count),
      totalPoints: parseInt(r.dataValues.totalPoints) || 0
    })),
    badgeDistribution: badgeDistribution.map(b => ({
      badge: b.badge,
      count: parseInt(b.dataValues.count)
    }))
  };
};

/**
 * Get blog engagement analytics
 */
const getBlogAnalytics = async () => {
  // This would need Blog model from Sequelize
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
  const mau = await User.count({
    where: {
      lastLogin: {
        [Op.gte]: startOfMonth
      },
      isActive: true
    }
  });

  // Get previous month for comparison
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const previousMAU = await User.count({
    where: {
      lastLogin: {
        [Op.between]: [previousMonthStart, previousMonthEnd]
      },
      isActive: true
    }
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
        date: '2024-01-01',
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
