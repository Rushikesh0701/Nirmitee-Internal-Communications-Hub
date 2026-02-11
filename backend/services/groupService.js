const { Group, GroupMember, GroupPost, GroupComment, User } = require('../models');
const notificationService = require('./notificationService');
const { getSequelizeUserIdSafe } = require('../utils/userMappingHelper');
const logger = require('../utils/logger');

/**
 * Extract mentions from text (format: @username or @firstName lastName)
 */
const extractMentions = (text) => {
  const mentionRegex = /@(\w+)/g;
  const matches = text.match(mentionRegex);
  if (!matches) return [];
  return matches.map(m => m.substring(1)); // Remove @ symbol
};

/**
 * Find user IDs from mentions
 */
const findMentionedUsers = async (mentions) => {
  if (!mentions || mentions.length === 0) return [];

  const users = await User.find({
    $or: [
      { firstName: { $in: mentions } },
      { lastName: { $in: mentions } },
      { displayName: { $in: mentions } },
      { email: { $in: mentions } }
    ]
  }).select('_id');

  return users.map(u => u._id);
};

/**
 * Create notification for mentions
 */
const createMentionNotifications = async (mentionedUserIds, postId, authorId, type = 'post') => {
  if (!mentionedUserIds || mentionedUserIds.length === 0) return;

  try {
    // Get author info
    const author = await User.findById(authorId).select('firstName lastName displayName');
    if (!author) return;

    const authorName = author.displayName || `${author.firstName} ${author.lastName}`;

    // Convert MongoDB user IDs to Sequelize user IDs for notifications
    const sequelizeUserIds = [];
    for (const mongoUserId of mentionedUserIds) {
      try {
        const seqUserId = await getSequelizeUserIdSafe(mongoUserId.toString());
        if (seqUserId) {
          sequelizeUserIds.push(seqUserId);
        }
      } catch (error) {
        logger.warn(`Could not map MongoDB user ${mongoUserId} to Sequelize`, { error: error.message });
      }
    }

    // Create notifications for mentioned users
    if (sequelizeUserIds.length > 0) {
      await notificationService.notifyMention(
        sequelizeUserIds,
        postId.toString(),
        authorName,
        type
      );
    }
  } catch (error) {
    logger.error('Error creating mention notifications', { error });
    // Don't fail the post/comment creation if notifications fail
  }
};

/**
 * Get all groups (public + user's private groups)
 */
const getAllGroups = async (userId, options = {}) => {
  const { page = 1, limit = 10, search, isPublic } = options;
  const skip = (page - 1) * limit;

  // Get user's group memberships
  const userMemberships = userId
    ? await GroupMember.find({ userId }).select('groupId')
    : [];
  const userGroupIds = userMemberships.map(m => m.groupId);

  // Build query
  const query = {};

  if (isPublic !== undefined) {
    query.isPublic = isPublic === 'true';
  } else {
    // Show public groups OR private groups user is member of
    query.$or = [
      { isPublic: true },
      { _id: { $in: userGroupIds } }
    ];
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const [groups, total] = await Promise.all([
    Group.find(query)
      .populate('createdBy', 'firstName lastName email avatar')
      .populate('moderators', 'firstName lastName email avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip),
    Group.countDocuments(query)
  ]);

  // Check membership status for each group
  const groupsWithMembership = await Promise.all(
    groups.map(async (group) => {
      const groupObj = group.toObject();
      if (userId) {
        const membership = await GroupMember.findOne({
          groupId: group._id,
          userId
        });
        groupObj.isMember = !!membership;
        groupObj.memberRole = membership?.role || null;
      } else {
        groupObj.isMember = false;
        groupObj.memberRole = null;
      }
      return groupObj;
    })
  );

  return {
    groups: groupsWithMembership,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get group by ID with membership check
 */
const getGroupById = async (groupId, userId) => {
  const mongoose = require('mongoose');
  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    throw new Error('Invalid group ID format');
  }

  const group = await Group.findById(groupId)
    .populate('createdBy', 'firstName lastName email avatar')
    .populate('moderators', 'firstName lastName email avatar');

  if (!group) {
    throw new Error('Group not found');
  }

  const groupObj = group.toObject();

  // Check if user is member
  if (userId) {
    const membership = await GroupMember.findOne({
      groupId: group._id,
      userId
    });
    groupObj.isMember = !!membership;
    groupObj.memberRole = membership?.role || null;
  } else {
    groupObj.isMember = false;
    groupObj.memberRole = null;
  }

  // Check access permission
  if (!group.isPublic && !groupObj.isMember) {
    throw new Error('Access denied: Private group');
  }

  return groupObj;
};

/**
 * Create a new group
 */
const createGroup = async (groupData, userId) => {
  const group = await Group.create({
    ...groupData,
    createdBy: userId
  });

  // Add creator as admin member
  await GroupMember.create({
    groupId: group._id,
    userId,
    role: 'admin'
  });

  // Update member count
  await Group.findByIdAndUpdate(group._id, { $inc: { memberCount: 1 } });

  // Send notifications if public group is created
  if (group.isPublic) {
    try {
      const users = await User.find({ isActive: true }).select('_id');
      const userIds = users.map(u => u._id);
      await notificationService.notifyGroupCreated(
        userIds,
        group.name,
        group._id.toString(),
        userId.toString()
      );
    } catch (error) {
      logger.error('Error sending group creation notifications', { error });
    }
  }

  return await Group.findById(group._id)
    .populate('createdBy', 'firstName lastName email avatar')
    .populate('moderators', 'firstName lastName email avatar');
};

/**
 * Update group (Admin/Moderator only)
 */
const updateGroup = async (groupId, updateData, userId, userRole) => {
  const group = await Group.findById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  // Check permissions
  const membership = await GroupMember.findOne({ groupId, userId });
  const isAdmin = userRole === 'Admin';
  const isModerator = ['Admin', 'Moderator'].includes(userRole);
  const isGroupAdmin = membership?.role === 'admin';
  const isGroupModerator = membership?.role === 'moderator';
  const isCreator = group.createdBy.toString() === userId.toString();

  if (!isAdmin && !isModerator && !isGroupAdmin && !isGroupModerator && !isCreator) {
    throw new Error('Unauthorized: Only admins and moderators can update groups');
  }

  Object.assign(group, updateData);
  await group.save();

  return await Group.findById(group._id)
    .populate('createdBy', 'firstName lastName email avatar')
    .populate('moderators', 'firstName lastName email avatar');
};

/**
 * Delete group (Admin/Moderator only)
 */
const deleteGroup = async (groupId, userId, userRole) => {
  const group = await Group.findById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  // Check permissions
  const membership = await GroupMember.findOne({ groupId, userId });
  const isAdmin = userRole === 'Admin';
  const isModerator = ['Admin', 'Moderator'].includes(userRole);
  const isGroupAdmin = membership?.role === 'admin';
  const isCreator = group.createdBy.toString() === userId.toString();

  if (!isAdmin && !isModerator && !isGroupAdmin && !isCreator) {
    throw new Error('Unauthorized: Only admins and moderators can delete groups');
  }

  // Delete all related data
  await Promise.all([
    GroupMember.deleteMany({ groupId }),
    GroupPost.deleteMany({ groupId }),
    Group.deleteOne({ _id: groupId })
  ]);
};

/**
 * Join a group
 */
const joinGroup = async (groupId, userId) => {
  const group = await Group.findById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  if (!group.isPublic) {
    throw new Error('Cannot join private group');
  }

  // Check if already a member
  const existingMember = await GroupMember.findOne({ groupId, userId });
  if (existingMember) {
    throw new Error('Already a member of this group');
  }

  // Add member
  await GroupMember.create({
    groupId,
    userId,
    role: 'member'
  });

  // Update member count
  await Group.findByIdAndUpdate(groupId, { $inc: { memberCount: 1 } });

  return { success: true, message: 'Joined group successfully' };
};

/**
 * Leave a group
 */
const leaveGroup = async (groupId, userId) => {
  const membership = await GroupMember.findOne({ groupId, userId });
  if (!membership) {
    throw new Error('Not a member of this group');
  }

  // Prevent admin from leaving if they're the creator
  const group = await Group.findById(groupId);
  if (membership.role === 'admin' && group.createdBy.toString() === userId.toString()) {
    throw new Error('Group creator cannot leave the group');
  }

  await GroupMember.deleteOne({ groupId, userId });
  await Group.findByIdAndUpdate(groupId, { $inc: { memberCount: -1 } });

  return { success: true, message: 'Left group successfully' };
};

/**
 * Get posts for a group
 */
const getGroupPosts = async (groupId, userId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  // Check access
  const group = await Group.findById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  if (!group.isPublic) {
    if (!userId) {
      throw new Error('Access denied: Private group');
    }
    const membership = await GroupMember.findOne({ groupId, userId });
    if (!membership) {
      throw new Error('Access denied: Not a member');
    }
  }

  const [posts, total] = await Promise.all([
    GroupPost.find({ groupId })
      .populate('authorId', 'firstName lastName email avatar')
      .populate('mentions', 'firstName lastName email avatar')
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(limit)
      .skip(skip),
    GroupPost.countDocuments({ groupId })
  ]);

  // Check if user liked each post
  const postsWithLikes = posts.map(post => {
    const postObj = post.toObject();
    if (userId) {
      postObj.isLiked = post.likedBy.some(id => id.toString() === userId.toString());
    } else {
      postObj.isLiked = false;
    }
    return postObj;
  });

  return {
    posts: postsWithLikes,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Create a post in a group
 */
const createGroupPost = async (postData, userId) => {
  const { groupId, content, images = [] } = postData;

  // Check access
  const group = await Group.findById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  if (!group.isPublic) {
    const membership = await GroupMember.findOne({ groupId, userId });
    if (!membership) {
      throw new Error('Access denied: Not a member of this group');
    }
  }

  // Extract mentions
  const mentionTexts = extractMentions(content);
  const mentionedUserIds = await findMentionedUsers(mentionTexts);

  // Create post
  const post = await GroupPost.create({
    groupId,
    authorId: userId,
    content,
    images,
    mentions: mentionedUserIds
  });

  // Update post count
  await Group.findByIdAndUpdate(groupId, { $inc: { postCount: 1 } });

  // Create mention notifications for @mentions
  if (mentionedUserIds.length > 0) {
    await createMentionNotifications(mentionedUserIds, post._id, userId, 'post');
  }

  // Notify all group members about the new post
  try {
    const groupMembers = await GroupMember.find({ groupId }).select('userId');
    const memberIds = groupMembers.map(m => m.userId);
    await notificationService.notifyNewGroupPost(
      memberIds,
      group.name,
      post._id.toString(),
      userId.toString()
    );
  } catch (error) {
    logger.error('Error sending group post notifications', { error });
  }

  return await GroupPost.findById(post._id)
    .populate('authorId', 'firstName lastName email avatar')
    .populate('mentions', 'firstName lastName email avatar');
};

/**
 * Update a post
 */
const updateGroupPost = async (postId, updateData, userId, userRole) => {
  const post = await GroupPost.findById(postId);
  if (!post) {
    throw new Error('Post not found');
  }

  const isAuthor = post.authorId.toString() === userId.toString();
  const isModerator = ['Admin', 'Moderator'].includes(userRole);

  if (!isAuthor && !isModerator) {
    throw new Error('Unauthorized');
  }

  // Extract mentions if content changed
  if (updateData.content) {
    const mentionTexts = extractMentions(updateData.content);
    updateData.mentions = await findMentionedUsers(mentionTexts);

    // Create notifications for new mentions
    if (updateData.mentions.length > 0) {
      await createMentionNotifications(updateData.mentions, postId, userId, 'post');
    }
  }

  updateData.isEdited = true;
  Object.assign(post, updateData);
  await post.save();

  return await GroupPost.findById(post._id)
    .populate('authorId', 'firstName lastName email avatar')
    .populate('mentions', 'firstName lastName email avatar');
};

/**
 * Delete a post
 */
const deleteGroupPost = async (postId, userId, userRole) => {
  const post = await GroupPost.findById(postId);
  if (!post) {
    throw new Error('Post not found');
  }

  const isAuthor = post.authorId.toString() === userId.toString();
  const isModerator = ['Admin', 'Moderator'].includes(userRole);

  if (!isAuthor && !isModerator) {
    throw new Error('Unauthorized');
  }

  // Delete all comments
  await GroupComment.deleteMany({ postId });

  // Delete post
  await GroupPost.deleteOne({ _id: postId });

  // Update post count
  await Group.findByIdAndUpdate(post.groupId, { $inc: { postCount: -1 } });
};

/**
 * Like/Unlike a post
 */
const togglePostLike = async (postId, userId) => {
  const post = await GroupPost.findById(postId);
  if (!post) {
    throw new Error('Post not found');
  }

  const isLiked = post.likedBy.some(id => id.toString() === userId.toString());

  if (isLiked) {
    post.likedBy = post.likedBy.filter(id => id.toString() !== userId.toString());
    post.likes = Math.max(0, post.likes - 1);
  } else {
    post.likedBy.push(userId);
    post.likes += 1;
  }

  await post.save();
  return { isLiked: !isLiked, likes: post.likes };
};

/**
 * Get comments for a post
 */
const getPostComments = async (postId, options = {}) => {
  const { page = 1, limit = 50 } = options;
  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    GroupComment.find({ postId })
      .populate('authorId', 'firstName lastName email avatar')
      .populate('mentions', 'firstName lastName email avatar')
      .populate('parentCommentId')
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip(skip),
    GroupComment.countDocuments({ postId })
  ]);

  return {
    comments,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Create a comment
 */
const createComment = async (commentData, userId) => {
  const mongoose = require('mongoose');
  const { postId, content, parentCommentId } = commentData;

  // Validate postId is a valid MongoDB ObjectId
  if (!postId) {
    throw new Error('postId is required');
  }

  // Check if it's a dummy ID
  if (typeof postId === 'string' && postId === 'undefined') {
    throw new Error('Cannot add comments to dummy posts. Please use a valid post.');
  }

  // Ensure postId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    throw new Error('Invalid postId format. Must be a valid MongoDB ObjectId.');
  }

  // Verify post exists
  const post = await GroupPost.findById(postId);
  if (!post) {
    throw new Error('Post not found');
  }

  // Extract mentions
  const mentionTexts = extractMentions(content);
  const mentionedUserIds = await findMentionedUsers(mentionTexts);

  // Create comment
  const comment = await GroupComment.create({
    postId,
    authorId: userId,
    content,
    mentions: mentionedUserIds,
    parentCommentId: parentCommentId || null
  });

  // Update comment count
  await GroupPost.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

  // Create mention notifications
  if (mentionedUserIds.length > 0) {
    await createMentionNotifications(mentionedUserIds, comment._id, userId, 'comment');
  }

  return await GroupComment.findById(comment._id)
    .populate('authorId', 'firstName lastName email avatar')
    .populate('mentions', 'firstName lastName email avatar')
    .populate('parentCommentId');
};

/**
 * Update a comment
 */
const updateComment = async (commentId, updateData, userId, userRole) => {
  const comment = await GroupComment.findById(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }

  const isAuthor = comment.authorId.toString() === userId.toString();
  const isModerator = ['Admin', 'Moderator'].includes(userRole);

  if (!isAuthor && !isModerator) {
    throw new Error('Unauthorized');
  }

  // Extract mentions if content changed
  if (updateData.content) {
    const mentionTexts = extractMentions(updateData.content);
    updateData.mentions = await findMentionedUsers(mentionTexts);

    // Create notifications for new mentions
    if (updateData.mentions.length > 0) {
      await createMentionNotifications(updateData.mentions, commentId, userId, 'comment');
    }
  }

  updateData.isEdited = true;
  Object.assign(comment, updateData);
  await comment.save();

  return await GroupComment.findById(comment._id)
    .populate('authorId', 'firstName lastName email avatar')
    .populate('mentions', 'firstName lastName email avatar')
    .populate('parentCommentId');
};

/**
 * Delete a comment
 */
const deleteComment = async (commentId, userId, userRole) => {
  const comment = await GroupComment.findById(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }

  const isAuthor = comment.authorId.toString() === userId.toString();
  const isModerator = ['Admin', 'Moderator'].includes(userRole);

  if (!isAuthor && !isModerator) {
    throw new Error('Unauthorized');
  }

  // Delete comment
  await GroupComment.deleteOne({ _id: commentId });

  // Update comment count
  await GroupPost.findByIdAndUpdate(comment.postId, { $inc: { commentCount: -1 } });
};

/**
 * Like/Unlike a comment
 */
const toggleCommentLike = async (commentId, userId) => {
  const comment = await GroupComment.findById(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }

  const isLiked = comment.likedBy.some(id => id.toString() === userId.toString());

  if (isLiked) {
    comment.likedBy = comment.likedBy.filter(id => id.toString() !== userId.toString());
    comment.likes = Math.max(0, comment.likes - 1);
  } else {
    comment.likedBy.push(userId);
    comment.likes += 1;
  }

  await comment.save();
  return { isLiked: !isLiked, likes: comment.likes };
};

/**
 * Get analytics for a specific group
 */
const getGroupAnalytics = async (groupId, userId) => {
  const mongoose = require('mongoose');

  // Validate MongoDB ObjectId format
  if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
    throw new Error('Invalid group ID format');
  }

  const group = await Group.findById(groupId)
    .populate('createdBy', 'firstName lastName email avatar')
    .lean();

  if (!group) {
    throw new Error('Group not found');
  }

  // Get member count
  const memberCount = await GroupMember.countDocuments({ groupId });

  // Get post statistics
  const [totalPosts, postsThisMonth] = await Promise.all([
    GroupPost.countDocuments({ groupId }),
    GroupPost.countDocuments({
      groupId,
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    })
  ]);

  // Get comment statistics
  const groupPostIds = await GroupPost.find({ groupId }).select('_id').lean();
  const postIds = groupPostIds.map(p => p._id);

  const [totalComments, commentsThisMonth] = await Promise.all([
    GroupComment.countDocuments({ postId: { $in: postIds } }),
    GroupComment.countDocuments({
      postId: { $in: postIds },
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    })
  ]);

  // Get posts over time (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const postsOverTime = await GroupPost.aggregate([
    { $match: { groupId: new mongoose.Types.ObjectId(groupId), createdAt: { $gte: thirtyDaysAgo } } },
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
  const commentsOverTime = await GroupComment.aggregate([
    { $match: { postId: { $in: postIds }, createdAt: { $gte: thirtyDaysAgo } } },
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

  // Get top posts by likes
  const topPostsByLikes = await GroupPost.find({ groupId })
    .select('content likes commentCount authorId createdAt')
    .populate('authorId', 'firstName lastName email')
    .sort({ likes: -1 })
    .limit(5)
    .lean();

  // Get top posts by comments
  const topPostsByComments = await GroupPost.find({ groupId })
    .select('content likes commentCount authorId createdAt')
    .populate('authorId', 'firstName lastName email')
    .sort({ commentCount: -1 })
    .limit(5)
    .lean();

  // Get most active members (by posts)
  const topPosters = await GroupPost.aggregate([
    { $match: { groupId: new mongoose.Types.ObjectId(groupId) } },
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
        postCount: '$count',
        _id: 0
      }
    }
  ]);

  // Get most active commenters
  const topCommenters = await GroupComment.aggregate([
    { $match: { postId: { $in: postIds } } },
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

  // Calculate engagement metrics
  const averagePostsPerMember = memberCount > 0 ? (totalPosts / memberCount).toFixed(2) : 0;
  const averageCommentsPerPost = totalPosts > 0 ? (totalComments / totalPosts).toFixed(2) : 0;

  return {
    group: {
      id: group._id,
      name: group.name,
      description: group.description,
      createdBy: group.createdBy,
      createdAt: group.createdAt,
      isPublic: group.isPublic
    },
    metrics: {
      memberCount,
      totalPosts,
      postsThisMonth,
      totalComments,
      commentsThisMonth,
      averagePostsPerMember: parseFloat(averagePostsPerMember),
      averageCommentsPerPost: parseFloat(averageCommentsPerPost)
    },
    trends: {
      postsOverTime,
      commentsOverTime
    },
    topContent: {
      postsByLikes: topPostsByLikes,
      postsByComments: topPostsByComments
    },
    topMembers: {
      topPosters,
      topCommenters
    }
  };
};

module.exports = {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  getGroupPosts,
  createGroupPost,
  updateGroupPost,
  deleteGroupPost,
  togglePostLike,
  getPostComments,
  createComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
  getGroupAnalytics
};

