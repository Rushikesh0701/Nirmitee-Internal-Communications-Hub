const { Blog, User, BlogComment } = require('../models');
const { ROLES } = require('../constants/roles');
const mongoose = require('mongoose');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');

const getAllBlogs = async (options = {}) => {
  const { page = 1, limit = 10, tag, published, authorId, search } = options;
  const skip = (page - 1) * limit;

  const query = {};
  if (published !== undefined) query.isPublished = published;
  if (authorId) {
    // Convert authorId to ObjectId if it's a valid string
    if (mongoose.Types.ObjectId.isValid(authorId)) {
      query.authorId = new mongoose.Types.ObjectId(authorId);
    } else {
      query.authorId = authorId;
    }
  }
  if (tag) {
    query.tags = { $in: [tag] };
  }
  
  // Full-text search in title, content, and tags
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { title: { $regex: searchRegex } },
      { content: { $regex: searchRegex } },
      { tags: { $in: [searchRegex] } }
    ];
  }

  const [blogs, total] = await Promise.all([
    Blog.find(query)
      .populate('authorId', 'firstName lastName email avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip),
    Blog.countDocuments(query)
  ]);

  // Populate comment counts for all blogs
  const blogIds = blogs.map(blog => blog._id);
  const commentCounts = await BlogComment.aggregate([
    { $match: { blogId: { $in: blogIds } } },
    { $group: { _id: '$blogId', count: { $sum: 1 } } }
  ]);

  // Create a map of blogId -> commentCount
  const commentCountMap = commentCounts.reduce((acc, item) => {
    acc[item._id.toString()] = item.count;
    return acc;
  }, {});

  // Add commentCount to each blog
  const blogsWithComments = blogs.map(blog => {
    const blogObj = blog.toObject();
    blogObj.commentCount = commentCountMap[blog._id.toString()] || 0;
    return blogObj;
  });

  return {
    blogs: blogsWithComments,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

const getBlogById = async (id, userId) => {
  // Validate MongoDB ObjectId format
  const mongoose = require('mongoose');
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid blog ID format');
  }

  const blog = await Blog.findById(id)
    .populate('authorId', 'firstName lastName email avatar')
    .populate('likedBy', 'firstName lastName');

  if (!blog) {
    throw new Error('Blog not found');
  }

  await Blog.findByIdAndUpdate(id, { $inc: { views: 1 } });
  blog.views += 1;

  // Fetch comments for this blog (only top-level comments, replies will be nested)
  const comments = await BlogComment.find({
    blogId: id,
    parentCommentId: null // Only top-level comments
  })
    .populate('authorId', 'firstName lastName email avatar')
    .sort({ createdAt: -1 });

  // Fetch replies for each comment
  const commentsWithReplies = await Promise.all(
    comments.map(async (comment) => {
      const commentObj = comment.toObject();
      const replies = await BlogComment.find({ parentCommentId: comment._id })
        .populate('authorId', 'firstName lastName email avatar')
        .sort({ createdAt: 1 }); // Oldest first for replies
      commentObj.replies = replies || [];
      return commentObj;
    })
  );

  // Convert to plain object and ensure likedBy is an array
  const blogObj = blog.toObject();
  if (!blogObj.likedBy) {
    blogObj.likedBy = [];
  }
  // Ensure likes count matches likedBy array length (sync if needed)
  if (blogObj.likedBy.length !== blogObj.likes) {
    blogObj.likes = blogObj.likedBy.length;
    // Update the count in database to keep it in sync
    await Blog.findByIdAndUpdate(id, { likes: blogObj.likedBy.length });
  }

  // Add comments to blog object
  blogObj.comments = commentsWithReplies || [];

  return blogObj;
};

const createBlog = async (blogData) => {
  // Validate required fields
  if (!blogData.title || !blogData.title.trim()) {
    throw new Error('Blog title is required');
  }

  if (!blogData.excerpt || !blogData.excerpt.trim()) {
    throw new Error('Blog excerpt is required');
  }

  if (!blogData.content || !blogData.content.trim()) {
    throw new Error('Blog content is required');
  }

  if (!blogData.category || !blogData.category.trim()) {
    throw new Error('Blog category is required');
  }

  // Validate authorId is a valid MongoDB ObjectId
  const mongoose = require('mongoose');

  if (!blogData.authorId) {
    throw new Error('authorId is required');
  }

  // Ensure authorId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(blogData.authorId)) {
    throw new Error('Invalid authorId format. Must be a valid MongoDB ObjectId.');
  }

  // Convert to ObjectId if it's a string
  if (typeof blogData.authorId === 'string') {
    blogData.authorId = new mongoose.Types.ObjectId(blogData.authorId);
  }

  // Handle publishing logic
  const now = new Date();
  if (blogData.isPublished === true) {
    // If publishing, set publishedAt if not provided
    if (!blogData.publishedAt) {
      blogData.publishedAt = now;
    }
  } else {
    // If not publishing, ensure isPublished is false and clear publishedAt
    blogData.isPublished = false;
    blogData.publishedAt = undefined;
  }

  // Create blog and verify it was saved
  const blog = await Blog.create(blogData);

  if (!blog || !blog._id) {
    throw new Error('Failed to create blog in database');
  }

  logger.info('Blog created successfully', {
    id: blog._id,
    title: blog.title,
    authorId: blog.authorId
  });

  // Send notifications if blog is published
  if (blog.isPublished) {
    try {
      const users = await User.find({ isActive: true }).select('_id');
      const userIds = users.map(u => u._id);
      await notificationService.notifyBlogPublished(
        userIds,
        blog.title,
        blog._id.toString(),
        blog.authorId.toString()
      );
    } catch (error) {
      logger.error('Error sending blog notifications', { error });
    }
  }

  return await Blog.findById(blog._id)
    .populate('authorId', 'firstName lastName email avatar');
};

const updateBlog = async (id, updateData, userId, user) => {
  const blog = await Blog.findById(id);
  if (!blog) {
    throw new Error('Blog not found');
  }

  // Convert userId to ObjectId if it's a string
  const userObjectId = typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  // Get blog authorId (could be ObjectId or populated object)
  const blogAuthorId = blog.authorId?._id || blog.authorId;

  // Check if user is the author
  const isAuthor = blogAuthorId && userObjectId && blogAuthorId.toString() === userObjectId.toString();

  // Check if user is admin or moderator (handle both user object structures)
  const userRole = user?.roleId?.name || user?.Role?.name || user?.role;
  const isAdminOrModerator = ['Admin', 'Moderator', 'ADMIN'].includes(userRole);

  if (!isAuthor && !isAdminOrModerator) {
    throw new Error('Unauthorized to update this blog');
  }

  // Validate required fields if they are being updated
  if (updateData.title !== undefined && (!updateData.title || !updateData.title.trim())) {
    throw new Error('Blog title is required');
  }

  if (updateData.excerpt !== undefined && (!updateData.excerpt || !updateData.excerpt.trim())) {
    throw new Error('Blog excerpt is required');
  }

  if (updateData.content !== undefined && (!updateData.content || !updateData.content.trim())) {
    throw new Error('Blog content is required');
  }

  if (updateData.category !== undefined && (!updateData.category || !updateData.category.trim())) {
    throw new Error('Blog category is required');
  }

  // Handle publishing logic
  const now = new Date();
  if (updateData.isPublished !== undefined) {
    if (updateData.isPublished === true) {
      // If publishing, set publishedAt if not already set or if explicitly provided
      if (!blog.publishedAt || updateData.publishedAt) {
        updateData.publishedAt = updateData.publishedAt || now;
      }
    } else {
      // If unpublishing, clear publishedAt
      updateData.publishedAt = null;
    }
  }

  // Update blog fields
  Object.assign(blog, updateData);
  await blog.save();

  // Verify update was saved
  if (!blog._id) {
    throw new Error('Failed to update blog in database');
  }

  logger.info('Blog updated successfully', {
    id: blog._id,
    title: blog.title
  });

  return await Blog.findById(blog._id)
    .populate('authorId', 'firstName lastName email avatar');
};

const deleteBlog = async (id, userId, user) => {
  const blog = await Blog.findById(id);
  if (!blog) {
    throw new Error('Blog not found');
  }

  const isAuthor = blog.authorId.toString() === userId.toString();
  const isAdminOrModerator = ['Admin', 'Moderator'].includes(user.Role?.name);

  if (!isAuthor && !isAdminOrModerator) {
    throw new Error('Unauthorized to delete this blog');
  }

  await Blog.findByIdAndDelete(id);
};

const likeBlog = async (id, userId) => {
  // Validate MongoDB ObjectId format
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid blog ID format');
  }

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID format');
  }

  const blog = await Blog.findById(id);
  if (!blog) {
    throw new Error('Blog not found');
  }

  // Convert userId to ObjectId if it's a string
  const userObjectId = typeof userId === 'string'
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  // Check if user has already liked this blog
  const hasLiked = blog.likedBy && blog.likedBy.some(
    likedUserId => likedUserId.toString() === userObjectId.toString()
  );

  let updatedBlog;
  if (hasLiked) {
    // Unlike: remove user from likedBy array and decrement likes
    updatedBlog = await Blog.findByIdAndUpdate(
      id,
      {
        $pull: { likedBy: userObjectId },
        $inc: { likes: -1 }
      },
      { new: true }
    ).populate('authorId', 'firstName lastName email avatar')
      .populate('likedBy', 'firstName lastName');
  } else {
    // Like: add user to likedBy array and increment likes
    updatedBlog = await Blog.findByIdAndUpdate(
      id,
      {
        $addToSet: { likedBy: userObjectId },
        $inc: { likes: 1 }
      },
      { new: true }
    ).populate('authorId', 'firstName lastName email avatar')
      .populate('likedBy', 'firstName lastName');
  }

  // Ensure likedBy is an array
  const blogObj = updatedBlog.toObject();
  if (!blogObj.likedBy) {
    blogObj.likedBy = [];
  }
  // Ensure likes count matches likedBy array length
  if (blogObj.likedBy.length !== blogObj.likes) {
    blogObj.likes = blogObj.likedBy.length;
    // Update the count in database
    await Blog.findByIdAndUpdate(id, { likes: blogObj.likedBy.length });
  }

  // Send notification to blog author if liked (not unliked) and liker is not the author
  if (!hasLiked) {
    const blogAuthorId = blog.authorId?._id || blog.authorId;
    if (blogAuthorId && blogAuthorId.toString() !== userId.toString()) {
      try {
        const liker = await User.findById(userId).select('firstName lastName displayName');
        const likerName = liker?.displayName || `${liker?.firstName || ''} ${liker?.lastName || ''}`.trim() || 'Someone';
        await notificationService.notifyLike(
          blogAuthorId,
          likerName,
          blog.title,
          blog._id.toString(),
          'blog'
        );
      } catch (error) {
        logger.error('Error sending like notification', { error });
      }
    }
  }

  return blogObj;
};

const addComment = async (blogId, userId, content, parentCommentId = null) => {
  // Validate MongoDB ObjectId format
  if (!blogId || !mongoose.Types.ObjectId.isValid(blogId)) {
    throw new Error('Invalid blog ID format');
  }

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID format');
  }

  if (!content || !content.trim()) {
    throw new Error('Comment content is required');
  }

  // Verify blog exists
  const blog = await Blog.findById(blogId);
  if (!blog) {
    throw new Error('Blog not found');
  }

  // If parentCommentId is provided, validate it
  if (parentCommentId) {
    if (!mongoose.Types.ObjectId.isValid(parentCommentId)) {
      throw new Error('Invalid parent comment ID format');
    }
    const parentComment = await BlogComment.findById(parentCommentId);
    if (!parentComment) {
      throw new Error('Parent comment not found');
    }
    // Ensure parent comment belongs to the same blog
    if (parentComment.blogId.toString() !== blogId.toString()) {
      throw new Error('Parent comment does not belong to this blog');
    }
  }

  // Convert userId to ObjectId if it's a string
  const userObjectId = typeof userId === 'string'
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  // Create comment
  const commentData = {
    blogId: new mongoose.Types.ObjectId(blogId),
    authorId: userObjectId,
    content: content.trim()
  };

  if (parentCommentId) {
    commentData.parentCommentId = new mongoose.Types.ObjectId(parentCommentId);
  }

  const comment = await BlogComment.create(commentData);

  // Populate author information
  await comment.populate('authorId', 'firstName lastName email avatar');

  // Send notification to blog author (if commenter is not the author)
  const blogAuthorId = blog.authorId?._id || blog.authorId;
  if (blogAuthorId && blogAuthorId.toString() !== userId.toString()) {
    try {
      const commenter = await User.findById(userId).select('firstName lastName displayName');
      const commenterName = commenter?.displayName || `${commenter?.firstName || ''} ${commenter?.lastName || ''}`.trim() || 'Someone';
      await notificationService.notifyBlogComment(
        blogAuthorId,
        commenterName,
        blog.title,
        blog._id.toString(),
        comment._id.toString()
      );
    } catch (error) {
      logger.error('Error sending blog comment notification', { error });
    }
  }

  return comment.toObject();
};

const deleteComment = async (commentId, userId, user) => {
  // Validate MongoDB ObjectId format
  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
    throw new Error('Invalid comment ID format');
  }

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID format');
  }

  const comment = await BlogComment.findById(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }

  // Check if user is the author or an admin/moderator
  const isAuthor = comment.authorId.toString() === userId.toString();
  const isAdminOrModerator = user?.Role?.name === 'Admin' || user?.Role?.name === 'Moderator' || user?.role === 'ADMIN';

  if (!isAuthor && !isAdminOrModerator) {
    throw new Error('Unauthorized to delete this comment');
  }

  await BlogComment.findByIdAndDelete(commentId);
};

/**
 * Get analytics for a specific blog
 */
const getBlogAnalytics = async (blogId) => {
  // Validate MongoDB ObjectId format
  if (!blogId || !mongoose.Types.ObjectId.isValid(blogId)) {
    throw new Error('Invalid blog ID format');
  }

  const blog = await Blog.findById(blogId)
    .populate('authorId', 'firstName lastName email avatar')
    .lean();

  if (!blog) {
    throw new Error('Blog not found');
  }

  // Get comment statistics
  const [totalComments, topLevelComments, replies] = await Promise.all([
    BlogComment.countDocuments({ blogId }),
    BlogComment.countDocuments({ blogId, parentCommentId: null }),
    BlogComment.countDocuments({ blogId, parentCommentId: { $ne: null } })
  ]);

  // Get engagement metrics over time (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const viewsOverTime = await Blog.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(blogId) } },
    {
      $project: {
        views: 1,
        createdAt: 1
      }
    }
  ]);

  // Get comments over time
  const commentsOverTime = await BlogComment.aggregate([
    { $match: { blogId: new mongoose.Types.ObjectId(blogId), createdAt: { $gte: thirtyDaysAgo } } },
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

  // Calculate engagement rate (likes + comments / views)
  const engagementRate = blog.views > 0
    ? ((blog.likes + totalComments) / blog.views * 100).toFixed(2)
    : 0;

  // Get top commenters
  const topCommenters = await BlogComment.aggregate([
    { $match: { blogId: new mongoose.Types.ObjectId(blogId) } },
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
    blog: {
      id: blog._id,
      title: blog.title,
      author: blog.authorId,
      createdAt: blog.createdAt,
      publishedAt: blog.publishedAt,
      isPublished: blog.isPublished
    },
    metrics: {
      views: blog.views || 0,
      likes: blog.likes || 0,
      totalComments,
      topLevelComments,
      replies,
      engagementRate: parseFloat(engagementRate)
    },
    engagement: {
      commentsOverTime,
      topCommenters
    },
    summary: {
      averageCommentsPerDay: commentsOverTime.length > 0
        ? (totalComments / 30).toFixed(2)
        : 0,
      likesToViewsRatio: blog.views > 0
        ? ((blog.likes || 0) / blog.views * 100).toFixed(2)
        : 0,
      commentsToViewsRatio: blog.views > 0
        ? (totalComments / blog.views * 100).toFixed(2)
        : 0
    }
  };
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
