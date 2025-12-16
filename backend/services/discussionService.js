const { Discussion, DiscussionComment, User } = require('../models');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');

const getAllDiscussions = async (options = {}) => {
  const { page = 1, limit = 10, category, tag, pinned } = options;
  const skip = (page - 1) * limit;

  const query = {};
  if (category) query.category = category;
  if (tag) {
    query.tags = { $in: [tag] };
  }
  if (pinned !== undefined) query.isPinned = pinned;

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
  const discussion = await Discussion.findById(id)
    .populate('authorId', 'firstName lastName email avatar');

  if (!discussion) {
    throw new Error('Discussion not found');
  }

  // Get comments separately
  const comments = await DiscussionComment.find({ discussionId: id })
    .populate('authorId', 'firstName lastName email avatar')
    .populate('parentCommentId', 'content authorId')
    .sort({ createdAt: 1 });

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

  return await DiscussionComment.findById(comment._id)
    .populate('authorId', 'firstName lastName email avatar')
    .populate('parentCommentId', 'content authorId');
};

module.exports = {
  getAllDiscussions,
  getDiscussionById,
  createDiscussion,
  updateDiscussion,
  deleteDiscussion,
  addComment
};
