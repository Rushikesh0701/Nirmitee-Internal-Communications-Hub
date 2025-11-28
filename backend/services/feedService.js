const { Announcement, Blog, Recognition, GroupPost, Group, GroupMember, News } = require('../models');
const mongoose = require('mongoose');

/**
 * Feed item type mappings
 */
const FEED_TYPES = {
  ANNOUNCEMENT: 'announcement',
  BLOG: 'blog',
  RECOGNITION: 'recognition',
  GROUP_POST: 'groupPost',
  NEWS: 'news',
  ALL: 'all'
};

/**
 * Map different content types to a common feed structure
 */
const mapToFeedItem = (item, type) => {
  const baseItem = {
    id: item._id.toString(),
    type,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };

  const typeMappers = {
    [FEED_TYPES.ANNOUNCEMENT]: () => ({
      ...baseItem,
      title: item.title,
      content: item.content,
      image: item.image,
      tags: item.tags || [],
      author: item.createdBy,
      publishedAt: item.publishedAt,
      isPublished: item.isPublished,
      scheduledAt: item.scheduledAt
    }),
    [FEED_TYPES.BLOG]: () => ({
      ...baseItem,
      title: item.title,
      content: item.content,
      excerpt: item.excerpt,
      coverImage: item.coverImage,
      tags: item.tags || [],
      author: item.authorId,
      views: item.views || 0,
      likes: item.likes || 0,
      isPublished: item.isPublished,
      publishedAt: item.publishedAt
    }),
    [FEED_TYPES.RECOGNITION]: () => ({
      ...baseItem,
      title: item.title,
      content: item.description,
      category: item.category,
      badge: item.badge,
      points: item.points || 0,
      author: item.givenById,
      recipient: item.receivedById,
      isPublic: item.isPublic
    }),
    [FEED_TYPES.GROUP_POST]: () => ({
      ...baseItem,
      content: item.content,
      images: item.images || [],
      author: item.authorId,
      group: item.groupId?._id || item.groupId,
      groupName: item.groupId?.name || (typeof item.groupId === 'object' ? item.groupId.name : null),
      mentions: item.mentions || [],
      commentCount: item.commentCount || 0,
      likes: item.likes || 0,
      isLiked: item.isLiked || false,
      isPinned: item.isPinned || false,
      isEdited: item.isEdited || false
    }),
    [FEED_TYPES.NEWS]: () => ({
      ...baseItem,
      title: item.title,
      content: item.content,
      image: item.image,
      source: item.source,
      author: item.createdBy,
      tags: item.tags || [],
      category: item.category
    })
  };

  const mapper = typeMappers[type];
  return mapper ? mapper() : baseItem;
};

/**
 * Fetch announcements for feed
 */
const fetchAnnouncements = async () => {
  return Announcement.find({ isPublished: true })
    .populate('createdBy', 'firstName lastName email avatar')
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Fetch blogs for feed
 */
const fetchBlogs = async () => {
  return Blog.find({ isPublished: true })
    .populate('authorId', 'firstName lastName email avatar')
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Fetch news for feed
 */
const fetchNews = async () => {
  return News.find({ status: 'published' })
    .populate('createdBy', 'firstName lastName email avatar')
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Fetch recognitions for feed
 */
const fetchRecognitions = async () => {
  return Recognition.find({ isPublic: true })
    .populate('givenById', 'firstName lastName email avatar')
    .populate('receivedById', 'firstName lastName email avatar')
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Get user's accessible group IDs
 */
const getUserAccessibleGroupIds = async (userId) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return [];
  }

  try {
    const userMemberships = await GroupMember.find({ userId })
      .select('groupId')
      .lean();
    return userMemberships.map(m => m.groupId.toString());
  } catch {
    return [];
  }
};

/**
 * Get accessible groups (public + user's groups)
 */
const getAccessibleGroups = async (userGroupIds) => {
  const query = {
    $or: [
      { isPublic: true },
      ...(userGroupIds.length > 0 ? [{ _id: { $in: userGroupIds } }] : [])
    ]
  };

  const groups = await Group.find(query).select('_id').lean();
  return groups.map(g => g._id);
};

/**
 * Fetch group posts for feed
 */
const fetchGroupPosts = async (userId, accessibleGroupIds) => {
  if (accessibleGroupIds.length === 0) {
    return [];
  }

  const posts = await GroupPost.find({ groupId: { $in: accessibleGroupIds } })
    .populate('authorId', 'firstName lastName email avatar')
    .populate('groupId', 'name')
    .populate('mentions', 'firstName lastName email avatar')
    .sort({ isPinned: -1, createdAt: -1 })
    .lean();

  return posts.map(post => {
    const postObj = { ...post };
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      postObj.isLiked = post.likedBy?.some(id => {
        const idStr = id.toString ? id.toString() : id;
        return idStr === userId.toString();
      }) || false;
    } else {
      postObj.isLiked = false;
    }
    return postObj;
  });
};

/**
 * Get unified feed with pagination and filtering
 * Optimized with parallel queries and database-level filtering
 */
const getFeed = async (userId, options = {}) => {
  const { page = 1, limit = 20, type } = options;
  const skip = (page - 1) * limit;
  const typesToFetch = type && type !== FEED_TYPES.ALL 
    ? [type] 
    : [FEED_TYPES.ANNOUNCEMENT, FEED_TYPES.BLOG, FEED_TYPES.RECOGNITION, FEED_TYPES.GROUP_POST, FEED_TYPES.NEWS];

  const fetchPromises = [];
  const typeMap = {};

  if (typesToFetch.includes(FEED_TYPES.ANNOUNCEMENT)) {
    fetchPromises.push(fetchAnnouncements().then(items => {
      typeMap[FEED_TYPES.ANNOUNCEMENT] = items;
    }));
  }

  if (typesToFetch.includes(FEED_TYPES.BLOG)) {
    fetchPromises.push(fetchBlogs().then(items => {
      typeMap[FEED_TYPES.BLOG] = items;
    }));
  }

  if (typesToFetch.includes(FEED_TYPES.RECOGNITION)) {
    fetchPromises.push(fetchRecognitions().then(items => {
      typeMap[FEED_TYPES.RECOGNITION] = items;
    }));
  }

  if (typesToFetch.includes(FEED_TYPES.GROUP_POST)) {
    fetchPromises.push(
      getUserAccessibleGroupIds(userId)
        .then(getAccessibleGroups)
        .then(groupIds => fetchGroupPosts(userId, groupIds))
        .then(items => {
          typeMap[FEED_TYPES.GROUP_POST] = items;
        })
    );
  }

  if (typesToFetch.includes(FEED_TYPES.NEWS)) {
    fetchPromises.push(fetchNews().then(items => {
      typeMap[FEED_TYPES.NEWS] = items;
    }));
  }

  await Promise.all(fetchPromises);

  const feedItems = [];
  Object.entries(typeMap).forEach(([feedType, items]) => {
    items.forEach(item => {
      feedItems.push(mapToFeedItem(item, feedType));
    });
  });

  feedItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = feedItems.length;
  const paginatedItems = feedItems.slice(skip, skip + limit);

  return {
    feed: paginatedItems,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasMore: skip + limit < total
    }
  };
};

module.exports = {
  getFeed
};
