const blogService = require('../services/blogService');
const { getMongoUserIdSafe } = require('../utils/userMappingHelper');
const { sendSuccess, sendError } = require('../utils/responseHelpers');
const logger = require('../utils/logger');

const getAllBlogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, tag, published, authorId, search } = req.query;

    // Convert published string to boolean, but only if it's explicitly provided
    let publishedBool = undefined;
    if (published !== undefined) {
      publishedBool = published === 'true' || published === true;
    }

    const blogs = await blogService.getAllBlogs({
      page: parseInt(page),
      limit: parseInt(limit),
      tag,
      published: publishedBool,
      authorId,
      search
    });

    return sendSuccess(res, blogs);
  } catch (error) {
    next(error);
  }
};

const getBlogById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate blog ID
    if (!id || id === 'undefined' || id === 'null') {
      return sendError(res, 'Invalid blog ID', 400);
    }

    // Validate MongoDB ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid blog ID format', 400);
    }

    const blog = await blogService.getBlogById(id, req.userId);
    return sendSuccess(res, blog);
  } catch (error) {
    if (error.message === 'Blog not found') {
      return sendError(res, error.message, 404);
    }
    next(error);
  }
};

const createBlog = async (req, res, next) => {
  try {
    const authorId = await getMongoUserIdSafe(req.userId);
    const blogData = { ...req.body, authorId };
    const blog = await blogService.createBlog(blogData);
    return sendSuccess(res, blog, null, 201);
  } catch (error) {
    // Handle specific validation errors
    if (error.message.includes('required') || error.message.includes('Invalid')) {
      return sendError(res, error.message, 400);
    }
    if (error.message.includes('authentication') ||
      error.message.includes('login') ||
      error.message.includes('Valid authentication required') ||
      error.message.includes('User not found')) {
      return sendError(res, 'Please login to create a blog. Authentication required.', 401);
    }
    // Log error for debugging
    logger.error('Error creating blog', { error: error.message });
    next(error);
  }
};

const updateBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Get MongoDB user ID
    const userId = await getMongoUserIdSafe(req.userId);
    if (!userId) {
      return sendError(res, 'User authentication required', 401);
    }
    const blog = await blogService.updateBlog(id, req.body, userId, req.user);
    return sendSuccess(res, blog);
  } catch (error) {
    // Handle specific errors
    if (error.message === 'Blog not found') {
      return sendError(res, error.message, 404);
    }
    if (error.message.includes('Unauthorized')) {
      return sendError(res, error.message, 403);
    }
    if (error.message.includes('authentication') || error.message.includes('User')) {
      return sendError(res, error.message, 401);
    }
    logger.error('Error updating blog', { error: error.message });
    next(error);
  }
};

const deleteBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    await blogService.deleteBlog(id, req.userId, req.user);
    return sendSuccess(res, null, 'Blog deleted successfully');
  } catch (error) {
    next(error);
  }
};

const likeBlog = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate blog ID
    if (!id || id === 'undefined' || id === 'null') {
      return sendError(res, 'Invalid blog ID', 400);
    }

    // Validate MongoDB ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid blog ID format', 400);
    }

    // Get user ID from request (set by auth middleware)
    const userId = await getMongoUserIdSafe(req.userId);
    if (!userId) {
      return sendError(res, 'User authentication required', 401);
    }

    const blog = await blogService.likeBlog(id, userId);
    return sendSuccess(res, blog);
  } catch (error) {
    if (error.message === 'Blog not found') {
      return sendError(res, error.message, 404);
    }
    if (error.message.includes('Invalid')) {
      return sendError(res, error.message, 400);
    }
    if (error.message.includes('authentication') || error.message.includes('User')) {
      return sendError(res, error.message, 401);
    }
    logger.error('Error liking blog', { error: error.message });
    next(error);
  }
};

const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, parentCommentId } = req.body;

    // Validate blog ID
    if (!id || id === 'undefined' || id === 'null') {
      return sendError(res, 'Invalid blog ID', 400);
    }

    // Validate MongoDB ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid blog ID format', 400);
    }

    // Validate content
    if (!content || !content.trim()) {
      return sendError(res, 'Comment content is required', 400);
    }

    // Validate parentCommentId if provided
    if (parentCommentId && !mongoose.Types.ObjectId.isValid(parentCommentId)) {
      return sendError(res, 'Invalid parent comment ID format', 400);
    }

    // Get user ID from request (set by auth middleware)
    const userId = await getMongoUserIdSafe(req.userId);
    if (!userId) {
      return sendError(res, 'User authentication required', 401);
    }

    const comment = await blogService.addComment(id, userId, content, parentCommentId || null);
    return sendSuccess(res, comment, 'Comment added successfully', 201);
  } catch (error) {
    if (error.message === 'Blog not found' || error.message === 'Comment not found' || error.message === 'Parent comment not found') {
      return sendError(res, error.message, 404);
    }
    if (error.message.includes('Invalid') || error.message.includes('required') || error.message.includes('does not belong')) {
      return sendError(res, error.message, 400);
    }
    if (error.message.includes('authentication') || error.message.includes('User')) {
      return sendError(res, error.message, 401);
    }
    logger.error('Error adding comment', { error: error.message });
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;

    // Validate IDs
    if (!id || id === 'undefined' || id === 'null') {
      return sendError(res, 'Invalid blog ID', 400);
    }

    if (!commentId || commentId === 'undefined' || commentId === 'null') {
      return sendError(res, 'Invalid comment ID', 400);
    }

    // Validate MongoDB ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid blog ID format', 400);
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return sendError(res, 'Invalid comment ID format', 400);
    }

    // Get user ID from request (set by auth middleware)
    const userId = await getMongoUserIdSafe(req.userId);
    if (!userId) {
      return sendError(res, 'User authentication required', 401);
    }

    await blogService.deleteComment(commentId, userId, req.user);
    return sendSuccess(res, null, 'Comment deleted successfully');
  } catch (error) {
    if (error.message === 'Comment not found') {
      return sendError(res, error.message, 404);
    }
    if (error.message.includes('Invalid')) {
      return sendError(res, error.message, 400);
    }
    if (error.message.includes('Unauthorized')) {
      return sendError(res, error.message, 403);
    }
    if (error.message.includes('authentication') || error.message.includes('User')) {
      return sendError(res, error.message, 401);
    }
    logger.error('Error deleting comment', { error: error.message });
    next(error);
  }
};

const getBlogAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = await getMongoUserIdSafe(req.userId);

    // Validate blog ID
    if (!id || id === 'undefined' || id === 'null') {
      return sendError(res, 'Invalid blog ID', 400);
    }

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid blog ID format', 400);
    }

    // Get blog to check ownership
    const blog = await blogService.getBlogById(id, userId);

    // Check if user is the author
    const blogAuthorId = blog.authorId?._id || blog.authorId;
    if (blogAuthorId?.toString() !== userId?.toString()) {
      return sendError(res, 'You can only view analytics for your own blogs', 403);
    }

    const analytics = await blogService.getBlogAnalytics(id);
    return sendSuccess(res, analytics);
  } catch (error) {
    if (error.message === 'Blog not found') {
      return sendError(res, error.message, 404);
    }
    if (error.message.includes('Invalid') || error.message.includes('can only view')) {
      return sendError(res, error.message, error.message.includes('can only view') ? 403 : 400);
    }
    next(error);
  }
};

module.exports = {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  likeBlog,
  addComment,
  deleteComment,
  getBlogAnalytics
};

