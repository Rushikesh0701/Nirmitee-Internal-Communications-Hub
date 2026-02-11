const discussionService = require('../services/discussionService');
const { getMongoUserIdSafe } = require('../utils/userMappingHelper');
const { sendSuccess, sendError } = require('../utils/responseHelpers');

const getAllDiscussions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, tag, pinned, search } = req.query;
    const discussions = await discussionService.getAllDiscussions({
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      tag,
      pinned: pinned === 'true',
      search
    });

    return sendSuccess(res, discussions);
  } catch (error) {
    next(error);
  }
};

const getDiscussionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const discussion = await discussionService.getDiscussionById(id, req.userId);
    return sendSuccess(res, discussion);
  } catch (error) {
    // Handle service errors
    if (error.message === 'Discussion not found' || error.message === 'Invalid discussion ID format') {
      return sendError(res, error.message, 404);
    }

    // Handle CastError for invalid IDs
    if (error.name === 'CastError' || error.message.includes('Cast to ObjectId')) {
      return sendError(res, 'Invalid discussion ID format', 400);
    }

    next(error);
  }
};

const createDiscussion = async (req, res, next) => {
  try {
    const authorId = await getMongoUserIdSafe(req.userId);
    const discussionData = { ...req.body, authorId };
    const discussion = await discussionService.createDiscussion(discussionData);
    return sendSuccess(res, discussion, null, 201);
  } catch (error) {
    if (error.message.includes('authentication') || error.message.includes('login')) {
      return sendError(res, error.message, 401);
    }
    next(error);
  }
};

const updateDiscussion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const discussion = await discussionService.updateDiscussion(id, req.body, req.userId, req.user);
    return sendSuccess(res, discussion);
  } catch (error) {
    // Handle CastError for invalid discussion IDs
    if (error.name === 'CastError' || error.message.includes('Cast to ObjectId')) {
      return sendError(res, 'Invalid discussion ID format', 400);
    }
    if (error.message === 'Discussion not found') {
      return sendError(res, error.message, 404);
    }
    next(error);
  }
};

const deleteDiscussion = async (req, res, next) => {
  try {
    const { id } = req.params;

    await discussionService.deleteDiscussion(id, req.userId, req.user);
    return sendSuccess(res, null, 'Discussion deleted successfully');
  } catch (error) {
    // Handle CastError for invalid discussion IDs
    if (error.name === 'CastError' || error.message.includes('Cast to ObjectId')) {
      return sendError(res, 'Invalid discussion ID format', 400);
    }
    if (error.message === 'Discussion not found') {
      return sendError(res, error.message, 404);
    }
    next(error);
  }
};

const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const authorId = await getMongoUserIdSafe(req.userId);
    const commentData = { ...req.body, discussionId: id, authorId };
    const comment = await discussionService.addComment(commentData);
    return sendSuccess(res, comment, null, 201);
  } catch (error) {
    if (error.message.includes('authentication') || error.message.includes('login')) {
      return sendError(res, error.message, 401);
    }
    // Handle CastError for invalid discussion IDs
    if (error.name === 'CastError' || error.message.includes('Cast to ObjectId')) {
      return sendError(res, 'Invalid discussion ID format', 400);
    }
    if (error.message === 'Discussion not found' || error.message === 'Parent comment not found') {
      return sendError(res, error.message, 404);
    }
    next(error);
  }
};

const getAllTags = async (req, res, next) => {
  try {
    const tags = await discussionService.getAllTags();
    return sendSuccess(res, { tags });
  } catch (error) {
    next(error);
  }
};

const getDiscussionAnalytics = async (req, res, next) => {
  try {
    const analytics = await discussionService.getDiscussionAnalytics();
    return sendSuccess(res, analytics);
  } catch (error) {
    next(error);
  }
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

