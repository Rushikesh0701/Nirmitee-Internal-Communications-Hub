const { Discussion, DiscussionComment, User } = require('../models');
const notificationService = require('./notificationService');
const activityPointsService = require('./activityPointsService');
const logger = require('../utils/logger');

const getAllDiscussions = async (options = {}) => {
  const { page = 1, limit = 10, category, tag, pinned, search } = options;
  const skip = (page - 1) * limit;

  const query = {};
  if (category) query.category = category;
  if (tag) {
    query.tags = { $in: [tag] };
  }
  if (pinned !== undefined) query.isPinned = pinned;

  // Full-text search in title and content
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { title: { $regex: searchRegex } },
      { content: { $regex: searchRegex } }
    ];
  }

  const [discussions, total] = await Promise.all([
    Discussion.find(query)
      .populate('authorId', 'firstName lastName email avatar')
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(limit)
      .skip(skip),
    Discussion.countDocuments(query)
  ]);

  return {
    discussions,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

const getDiscussionById = async (id, userId) => {
  const mongoose = require('mongoose');

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid discussion ID format');
  }

  const discussion = await Discussion.findById(id)
    .populate('authorId', 'firstName lastName email avatar');

  if (!discussion) {
    throw new Error('Discussion not found');
  }

  // Get comments separately (only if id is a valid ObjectId)
  let comments = [];
  try {
    comments = await DiscussionComment.find({ discussionId: id })
      .populate('authorId', 'firstName lastName email avatar')
      .populate('parentCommentId', 'content authorId')
      .sort({ createdAt: 1 });
  } catch (error) {
    // If query fails due to invalid ID format, return empty comments array
    if (error.name === 'CastError') {
      comments = [];
    } else {
      throw error;
    }
  }

  // Convert to object and add comments
  const discussionObj = discussion.toObject();
  discussionObj.Comments = comments;

  if (userId) {
    await Discussion.findByIdAndUpdate(id, { $inc: { views: 1 } });
    discussionObj.views += 1;
  }

  return discussionObj;
};

const createDiscussion = async (discussionData) => {
  // Validate authorId is a valid MongoDB ObjectId
  const mongoose = require('mongoose');

  if (!discussionData.authorId) {
    throw new Error('authorId is required');
  }

  // Ensure authorId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(discussionData.authorId)) {
    throw new Error('Invalid authorId format. Must be a valid MongoDB ObjectId.');
  }

  // Convert to ObjectId if it's a string
  if (typeof discussionData.authorId === 'string') {
    discussionData.authorId = new mongoose.Types.ObjectId(discussionData.authorId);
  }

  const discussion = await Discussion.create(discussionData);

  if (!discussion || !discussion._id) {
    throw new Error('Failed to create discussion in database');
  }

  logger.info('Discussion created successfully', {
    id: discussion._id,
    title: discussion.title
  });

  // Send notifications to all users
  try {
    const users = await User.find({ isActive: true }).select('_id');
    const userIds = users.map(u => u._id);
    await notificationService.notifyDiscussionCreated(
      userIds,
      discussion.title,
      discussion._id.toString(),
      discussion.authorId.toString()
    );
  } catch (error) {
    logger.error('Error sending discussion notifications', { error });
  }

  // Award activity points for creating a discussion
  try {
    await activityPointsService.awardActivityPoints(discussion.authorId.toString(), 'DISCUSSION_CREATE', discussion._id.toString());
  } catch (error) {
    logger.error('Error awarding discussion create points', { error });
  }

  return await Discussion.findById(discussion._id)
    .populate('authorId', 'firstName lastName email avatar');
};

const updateDiscussion = async (id, updateData, userId, user) => {
  const discussion = await Discussion.findById(id);
  if (!discussion) {
    throw new Error('Discussion not found');
  }

  // Check user role (handle multiple possible user object structures)
  const userRole = user?.roleId?.name || user?.Role?.name || user?.role;
  const isAdminOrModerator = ['Admin', 'Moderator', 'ADMIN', 'MODERATOR'].includes(userRole);

  if (discussion.isLocked && !isAdminOrModerator) {
    throw new Error('Discussion is locked');
  }

  const isAuthor = discussion.authorId.toString() === userId.toString();

  if (!isAuthor && !isAdminOrModerator) {
    throw new Error('Unauthorized');
  }

  Object.assign(discussion, updateData);
  await discussion.save();
  return await Discussion.findById(discussion._id)
    .populate('authorId', 'firstName lastName email avatar');
};

const deleteDiscussion = async (id, userId, user) => {
  const discussion = await Discussion.findById(id);
  if (!discussion) {
    throw new Error('Discussion not found');
  }

  // Check user role (handle multiple possible user object structures)
  const userRole = user?.roleId?.name || user?.Role?.name || user?.role;
  const isAdminOrModerator = ['Admin', 'Moderator', 'ADMIN', 'MODERATOR'].includes(userRole);

  const isAuthor = discussion.authorId.toString() === userId.toString();

  if (!isAuthor && !isAdminOrModerator) {
    throw new Error('Unauthorized');
  }

  await Discussion.findByIdAndDelete(id);
};

const addComment = async (commentData) => {
  // Validate authorId is a valid MongoDB ObjectId
  const mongoose = require('mongoose');

  if (!commentData.authorId) {
    throw new Error('authorId is required');
  }

  // Ensure authorId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(commentData.authorId)) {
    throw new Error('Invalid authorId format. Must be a valid MongoDB ObjectId.');
  }

  // Convert to ObjectId if it's a string
  if (typeof commentData.authorId === 'string') {
    commentData.authorId = new mongoose.Types.ObjectId(commentData.authorId);
  }

  // Validate discussionId is a valid MongoDB ObjectId
  if (!commentData.discussionId) {
    throw new Error('discussionId is required');
  }

  // Ensure discussionId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(commentData.discussionId)) {
    throw new Error('Invalid discussionId format. Must be a valid MongoDB ObjectId.');
  }

  // Convert to ObjectId if it's a string
  if (typeof commentData.discussionId === 'string') {
    commentData.discussionId = new mongoose.Types.ObjectId(commentData.discussionId);
  }

  // Verify discussion exists
  const discussion = await Discussion.findById(commentData.discussionId);
  if (!discussion) {
    throw new Error('Discussion not found');
  }

  // Handle parentCommentId if provided (for replies)
  if (commentData.parentCommentId) {
    // Validate parentCommentId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(commentData.parentCommentId)) {
      throw new Error('Invalid parentCommentId format. Must be a valid MongoDB ObjectId.');
    }

    // Convert to ObjectId if it's a string
    if (typeof commentData.parentCommentId === 'string') {
      commentData.parentCommentId = new mongoose.Types.ObjectId(commentData.parentCommentId);
    }

    // Verify parent comment exists
    const parentComment = await DiscussionComment.findById(commentData.parentCommentId);
    if (!parentComment) {
      throw new Error('Parent comment not found');
    }
  }

  const comment = await DiscussionComment.create(commentData);

  if (!comment || !comment._id) {
    throw new Error('Failed to create comment in database');
  }

  // Update comment count
  await Discussion.findByIdAndUpdate(commentData.discussionId, { $inc: { commentCount: 1 } });

  // Send notification to discussion author (if commenter is not the author)
  try {
    const discussion = await Discussion.findById(commentData.discussionId).select('authorId title');
    if (discussion) {
      const discussionAuthorId = discussion.authorId?._id || discussion.authorId;
      if (discussionAuthorId && discussionAuthorId.toString() !== commentData.authorId.toString()) {
        const commenter = await User.findById(commentData.authorId).select('firstName lastName displayName');
        const commenterName = commenter?.displayName || `${commenter?.firstName || ''} ${commenter?.lastName || ''}`.trim() || 'Someone';
        await notificationService.notifyDiscussionComment(
          discussionAuthorId,
          commenterName,
          discussion.title,
          discussion._id.toString(),
          comment._id.toString()
        );
      }
    }
  } catch (error) {
    logger.error('Error sending discussion comment notification', { error });
  }

  logger.info('Comment created successfully', {
    id: comment._id,
    discussionId: commentData.discussionId,
    parentCommentId: commentData.parentCommentId || null
  });
  // Award activity points for replying to a discussion
  try {
    await activityPointsService.awardActivityPoints(commentData.authorId.toString(), 'DISCUSSION_REPLY', commentData.discussionId.toString());
  } catch (error) {
    logger.error('Error awarding discussion reply points', { error });
  }

  return await DiscussionComment.findById(comment._id)
    .populate('authorId', 'firstName lastName email avatar')
    .populate('parentCommentId', 'content authorId');
};

const getAllTags = async () => {
  try {
    // Get all unique tags from all discussions
    const tags = await Discussion.distinct('tags');
    // Filter out null/undefined/empty tags and sort
    return tags.filter(tag => tag && tag.trim()).sort();
  } catch (error) {
    logger.error('Error fetching discussion tags', { error });
    throw error;
  }
};

/**
 * Get analytics for all discussions
 */
const getDiscussionAnalytics = async () => {
  const mongoose = require('mongoose');

  // Get total discussions count
  const totalDiscussions = await Discussion.countDocuments();

  // Get total comments count
  const totalComments = await DiscussionComment.countDocuments();

  // Get total views (sum of all discussion views)
  const viewsAggregation = await Discussion.aggregate([
    { $group: { _id: null, totalViews: { $sum: '$views' } } }
  ]);
  const totalViews = viewsAggregation.length > 0 ? viewsAggregation[0].totalViews : 0;

  // Calculate average engagement
  const averageEngagement = totalDiscussions > 0
    ? ((totalViews + totalComments) / totalDiscussions).toFixed(2)
    : 0;

  // Get discussions over time (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const discussionsOverTime = await Discussion.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        date: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);

  // Get comments over time
  const commentsOverTime = await DiscussionComment.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        date: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);

  // Get top discussions by views
  const topDiscussionsByViews = await Discussion.find()
    .select('title views commentCount authorId category tags createdAt')
    .populate('authorId', 'firstName lastName email')
    .sort({ views: -1 })
    .limit(5)
    .lean();

  // Get top discussions by comments
  const topDiscussionsByComments = await Discussion.find()
    .select('title views commentCount authorId category tags createdAt')
    .populate('authorId', 'firstName lastName email')
    .sort({ commentCount: -1 })
    .limit(5)
    .lean();

  // Get category distribution
  const categoryDistribution = await Discussion.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    {
      $project: {
        category: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);

  // Get most active commenters
  const topCommenters = await DiscussionComment.aggregate([
    {
      $group: {
        _id: '$authorId',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        user: {
          id: '$user._id',
          firstName: '$user.firstName',
          lastName: '$user.lastName',
          email: '$user.email',
          avatar: '$user.avatar'
        },
        commentCount: '$count',
        _id: 0
      }
    }
  ]);

  return {
    overview: {
      totalDiscussions,
      totalComments,
      totalViews,
      averageEngagement: parseFloat(averageEngagement)
    },
    trends: {
      discussionsOverTime,
      commentsOverTime
    },
    topDiscussions: {
      byViews: topDiscussionsByViews,
      byComments: topDiscussionsByComments
    },
    categoryDistribution,
    topCommenters
  };
};

module.exports = {
  getAllDiscussions,
  getDiscussionById,
  createDiscussion,
  updateDiscussion,
  deleteDiscussion,
  addComment,
  getAllTags,
  getDiscussionAnalytics
};
