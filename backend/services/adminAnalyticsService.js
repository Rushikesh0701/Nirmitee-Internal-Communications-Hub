const {
  Recognition,
  SurveyModel,
  SurveyResponse,
  UserCourse,
  Course,
  Notification,
  User,
  UserPoints,
  Blog,
  BlogComment,
  GroupPost,
  GroupComment,
  Discussion,
  DiscussionComment
} = require('../models');
const mongoose = require('mongoose');
const Sentiment = require('sentiment');

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
  try {
    // Get total blogs count (only published)
    const totalBlogs = await Blog.countDocuments({ isPublished: true });

    // Get total views (sum of all blog views)
    const viewsAggregation = await Blog.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);
    const totalViews = viewsAggregation.length > 0 ? viewsAggregation[0].totalViews : 0;

    // Get total comments count
    const totalComments = await BlogComment.countDocuments();

    // Calculate average engagement (views + comments per blog)
    const averageEngagement = totalBlogs > 0 
      ? ((totalViews + totalComments) / totalBlogs).toFixed(2)
      : 0;

    // Get top blogs by views
    const topBlogsByViews = await Blog.find({ isPublished: true })
      .select('title views likes commentCount authorId')
      .populate('authorId', 'firstName lastName email')
      .sort({ views: -1 })
      .limit(5)
      .lean();

    // Get top blogs by comments
    const blogsWithCommentCounts = await Blog.aggregate([
      { $match: { isPublished: true } },
      {
        $lookup: {
          from: 'blogcomments',
          localField: '_id',
          foreignField: 'blogId',
          as: 'comments'
        }
      },
      {
        $project: {
          title: 1,
          views: 1,
          likes: 1,
          authorId: 1,
          commentCount: { $size: '$comments' }
        }
      },
      { $sort: { commentCount: -1 } },
      { $limit: 5 }
    ]);

    // Populate author info for top blogs by comments
    const topBlogsByComments = await Promise.all(
      blogsWithCommentCounts.map(async (blog) => {
        if (blog.authorId) {
          const author = await User.findById(blog.authorId).select('firstName lastName email').lean();
          blog.author = author;
        }
        return blog;
      })
    );

    return {
      totalBlogs,
      totalViews,
      totalComments,
      averageEngagement: parseFloat(averageEngagement),
      topBlogsByViews: topBlogsByViews.map(blog => ({
        title: blog.title,
        views: blog.views || 0,
        likes: blog.likes || 0,
        author: blog.authorId
      })),
      topBlogsByComments: topBlogsByComments.map(blog => ({
        title: blog.title,
        views: blog.views || 0,
        commentCount: blog.commentCount || 0,
        author: blog.author
      }))
    };
  } catch (error) {
    // Return placeholder on error
    return {
      totalBlogs: 0,
      totalViews: 0,
      totalComments: 0,
      averageEngagement: 0,
      topBlogsByViews: [],
      topBlogsByComments: []
    };
  }
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
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get total posts count (GroupPost + Discussion)
    const [totalGroupPosts, totalDiscussions, groupPostsThisMonth, discussionsThisMonth] = await Promise.all([
      GroupPost.countDocuments(),
      Discussion.countDocuments(),
      GroupPost.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Discussion.countDocuments({ createdAt: { $gte: startOfMonth } })
    ]);

    const totalPosts = totalGroupPosts + totalDiscussions;
    const postsThisMonth = groupPostsThisMonth + discussionsThisMonth;

    // Get total comments count (GroupComment + DiscussionComment + BlogComment)
    const [totalGroupComments, totalDiscussionComments, totalBlogComments, groupCommentsThisMonth, discussionCommentsThisMonth, blogCommentsThisMonth] = await Promise.all([
      GroupComment.countDocuments(),
      DiscussionComment.countDocuments(),
      BlogComment.countDocuments(),
      GroupComment.countDocuments({ createdAt: { $gte: startOfMonth } }),
      DiscussionComment.countDocuments({ createdAt: { $gte: startOfMonth } }),
      BlogComment.countDocuments({ createdAt: { $gte: startOfMonth } })
    ]);

    const totalComments = totalGroupComments + totalDiscussionComments + totalBlogComments;
    const commentsThisMonth = groupCommentsThisMonth + discussionCommentsThisMonth + blogCommentsThisMonth;

    return {
      posts: {
        total: totalPosts,
        thisMonth: postsThisMonth,
        groupPosts: totalGroupPosts,
        discussions: totalDiscussions
      },
      comments: {
        total: totalComments,
        thisMonth: commentsThisMonth,
        groupComments: totalGroupComments,
        discussionComments: totalDiscussionComments,
        blogComments: totalBlogComments
      }
    };
  } catch (error) {
    // Return placeholder on error
    return {
      posts: {
        total: 0,
        thisMonth: 0,
        groupPosts: 0,
        discussions: 0
      },
      comments: {
        total: 0,
        thisMonth: 0,
        groupComments: 0,
        discussionComments: 0,
        blogComments: 0
      }
    };
  }
};

/**
 * Get sentiment analysis for feedback/surveys/blogs
 * 
 * Uses the 'sentiment' library for text analysis
 * Supports: survey responses, blog comments, and discussion comments
 */
const getSentimentAnalysis = async (options = {}) => {
  const { contentType = 'survey', startDate, endDate } = options;
  const logger = require('../utils/logger');
  const sentiment = new Sentiment();

  try {
    // Calculate date range
    const periodStart = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const periodEnd = endDate ? new Date(endDate) : new Date();

    // Date query for filtering
    const dateQuery = {
      createdAt: {
        $gte: periodStart,
        $lte: periodEnd
      }
    };

    let texts = [];
    let totalItems = 0;

    // Fetch text content based on contentType
    if (contentType === 'survey') {
      // Get survey responses - extract text from answer fields
      const responses = await SurveyResponse.find(dateQuery)
        .populate('surveyId', 'title')
        .lean();

      totalItems = responses.length;
      responses.forEach(response => {
        response.responses.forEach(resp => {
          // Extract text from answer field (for text-based questions)
          if (resp.answer && typeof resp.answer === 'string' && resp.answer.trim().length > 0) {
            texts.push(resp.answer.trim());
          }
        });
      });
    } else if (contentType === 'blog') {
      // Get blog comments
      const comments = await BlogComment.find(dateQuery)
        .select('content createdAt')
        .lean();

      totalItems = comments.length;
      texts = comments
        .map(comment => comment.content?.trim())
        .filter(text => text && text.length > 0);
    } else if (contentType === 'discussion') {
      // Get discussion comments
      const comments = await DiscussionComment.find(dateQuery)
        .select('content createdAt')
        .lean();

      totalItems = comments.length;
      texts = comments
        .map(comment => comment.content?.trim())
        .filter(text => text && text.length > 0);
    } else {
      // Default: analyze all content types
      const [surveyResponses, blogComments, discussionComments] = await Promise.all([
        SurveyResponse.find(dateQuery).lean(),
        BlogComment.find(dateQuery).select('content').lean(),
        DiscussionComment.find(dateQuery).select('content').lean()
      ]);

      totalItems = surveyResponses.length + blogComments.length + discussionComments.length;

      // Extract text from survey responses
      surveyResponses.forEach(response => {
        response.responses?.forEach(resp => {
          if (resp.answer && typeof resp.answer === 'string' && resp.answer.trim().length > 0) {
            texts.push(resp.answer.trim());
          }
        });
      });

      // Extract text from blog comments
      blogComments.forEach(comment => {
        if (comment.content?.trim()) {
          texts.push(comment.content.trim());
        }
      });

      // Extract text from discussion comments
      discussionComments.forEach(comment => {
        if (comment.content?.trim()) {
          texts.push(comment.content.trim());
        }
      });
    }

    // If no text found, return empty results
    if (texts.length === 0) {
      logger.info('No text content found for sentiment analysis', { contentType, periodStart, periodEnd, totalItems });
      return {
        contentType,
        period: {
          startDate: periodStart,
          endDate: periodEnd
        },
        overall: {
          sentiment: 'NEUTRAL',
          score: 0.0,
          confidence: 0.0
        },
        distribution: {
          positive: 0,
          neutral: 100,
          negative: 0
        },
        topKeywords: [],
        trends: [],
        totalItems: 0,
        analyzedItems: 0,
        implementationStatus: 'IMPLEMENTED',
        message: 'No text content found in the specified date range.'
      };
    }

    // Analyze sentiment for each text
    const sentimentResults = texts.map(text => {
      const result = sentiment.analyze(text);
      // Convert score to -1 to 1 scale (sentiment library uses -5 to 5)
      const normalizedScore = Math.max(-1, Math.min(1, result.score / 5));
      
      // Determine sentiment category
      let sentimentCategory = 'NEUTRAL';
      if (normalizedScore > 0.1) {
        sentimentCategory = 'POSITIVE';
      } else if (normalizedScore < -0.1) {
        sentimentCategory = 'NEGATIVE';
      }

      return {
        text: text.substring(0, 100), // Store first 100 chars for reference
        score: normalizedScore,
        sentiment: sentimentCategory,
        comparative: result.comparative,
        tokens: result.tokens?.length || 0
      };
    });

    // Calculate overall metrics
    const totalScore = sentimentResults.reduce((sum, r) => sum + r.score, 0);
    const averageScore = totalScore / sentimentResults.length;
    const averageConfidence = sentimentResults.reduce((sum, r) => sum + Math.abs(r.score), 0) / sentimentResults.length;

    // Determine overall sentiment
    let overallSentiment = 'NEUTRAL';
    if (averageScore > 0.1) {
      overallSentiment = 'POSITIVE';
    } else if (averageScore < -0.1) {
      overallSentiment = 'NEGATIVE';
    }

    // Calculate distribution
    const positiveCount = sentimentResults.filter(r => r.sentiment === 'POSITIVE').length;
    const negativeCount = sentimentResults.filter(r => r.sentiment === 'NEGATIVE').length;
    const neutralCount = sentimentResults.filter(r => r.sentiment === 'NEUTRAL').length;
    const total = sentimentResults.length;

    const distribution = {
      positive: total > 0 ? Math.round((positiveCount / total) * 100) : 0,
      neutral: total > 0 ? Math.round((neutralCount / total) * 100) : 0,
      negative: total > 0 ? Math.round((negativeCount / total) * 100) : 0
    };

    // Extract top keywords (simple frequency-based)
    const keywordMap = new Map();
    sentimentResults.forEach(result => {
      const words = result.text.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3) { // Only words longer than 3 chars
          keywordMap.set(word, (keywordMap.get(word) || 0) + 1);
        }
      });
    });

    const topKeywords = Array.from(keywordMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    logger.info('Sentiment analysis completed', {
      contentType,
      totalItems,
      analyzedItems: texts.length,
      overallSentiment,
      averageScore
    });

    return {
      contentType,
      period: {
        startDate: periodStart,
        endDate: periodEnd
      },
      overall: {
        sentiment: overallSentiment,
        score: parseFloat(averageScore.toFixed(3)),
        confidence: parseFloat(averageConfidence.toFixed(3))
      },
      distribution,
      topKeywords,
      trends: [], // Can be enhanced with time-series data
      totalItems,
      analyzedItems: texts.length,
      implementationStatus: 'IMPLEMENTED',
      message: `Analyzed ${texts.length} text items from ${totalItems} total items.`
    };
  } catch (error) {
    logger.error('Error in sentiment analysis', { error: error.message, stack: error.stack, options });
    // Return error response
    return {
      contentType,
      period: {
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: endDate || new Date()
      },
      overall: {
        sentiment: 'NEUTRAL',
        score: 0.0,
        confidence: 0.0
      },
      distribution: {
        positive: 0,
        neutral: 100,
        negative: 0
      },
      topKeywords: [],
      trends: [],
      totalItems: 0,
      analyzedItems: 0,
      implementationStatus: 'ERROR',
      error: error.message
    };
  }
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
