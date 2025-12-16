const discussionService = require('../services/discussionService');
const { getMongoUserIdSafe } = require('../utils/userMappingHelper');
const { sendSuccess, sendError } = require('../utils/responseHelpers');
const { handleDatabaseError } = require('../utils/errorHandlers');

const getAllDiscussions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, tag, pinned } = req.query;
    const discussions = await discussionService.getAllDiscussions({
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      tag,
      pinned: pinned === 'true'
    });
    
    if (!discussions || !discussions.discussions || discussions.discussions.length === 0) {
      const dummyDiscussions = dummyDataService.getDummyDiscussions({
        page: parseInt(page),
        limit: parseInt(limit),
        category
      });
      return sendSuccess(res, dummyDiscussions);
    }
    
    return sendSuccess(res, discussions);
  } catch (error) {
    try {
      const dummyDiscussions = handleDatabaseError(
        error,
        (params) => dummyDataService.getDummyDiscussions({
          page: parseInt(params.page) || 1,
          limit: parseInt(params.limit) || 10,
          category: params.category
        }),
        req.query
      );
      return sendSuccess(res, dummyDiscussions);
    } catch {
      next(error);
    }
  }
};

const getDiscussionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const discussion = await discussionService.getDiscussionById(id, req.userId);
    return sendSuccess(res, discussion);
  } catch (error) {
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
    next(error);
  }
};

const deleteDiscussion = async (req, res, next) => {
  try {
    const { id } = req.params;
    await discussionService.deleteDiscussion(id, req.userId, req.user);
    return sendSuccess(res, null, 'Discussion deleted successfully');
  } catch (error) {
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
    next(error);
  }
};

module.exports = {
  getAllDiscussions,
  getDiscussionById,
  createDiscussion,
  updateDiscussion,
  deleteDiscussion,
  addComment
};

