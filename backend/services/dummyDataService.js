/**
 * Dummy Data Service
 * Provides fallback dummy data when database is unavailable or no data exists
 * Used for development and graceful degradation
 */

/**
 * Get dummy discussions
 */
const getDummyDiscussions = (options = {}) => {
  const { page = 1, limit = 10, category } = options;
  const skip = (page - 1) * limit;

  const dummyDiscussions = [
    {
      _id: 'dummy-discussion-1',
      title: 'Welcome to Technical Discussions',
      content: 'This is a sample discussion to get you started. Feel free to ask questions and share your knowledge!',
      category: category || 'General',
      tags: ['welcome', 'getting-started'],
      authorId: {
        _id: 'dummy-user-1',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@nirmitee.io',
        avatar: null
      },
      views: 42,
      commentCount: 3,
      isPinned: true,
      isLocked: false,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      _id: 'dummy-discussion-2',
      title: 'Best Practices for Code Reviews',
      content: 'What are your thoughts on effective code review processes? Share your experiences!',
      category: category || 'Development',
      tags: ['code-review', 'best-practices'],
      authorId: {
        _id: 'dummy-user-2',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@nirmitee.io',
        avatar: null
      },
      views: 28,
      commentCount: 5,
      isPinned: false,
      isLocked: false,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      _id: 'dummy-discussion-3',
      title: 'Database Optimization Tips',
      content: 'Let\'s discuss strategies for optimizing database queries and improving performance.',
      category: category || 'Database',
      tags: ['database', 'optimization', 'performance'],
      authorId: {
        _id: 'dummy-user-3',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@nirmitee.io',
        avatar: null
      },
      views: 15,
      commentCount: 2,
      isPinned: false,
      isLocked: false,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }
  ];

  // Filter by category if provided
  let filtered = category 
    ? dummyDiscussions.filter(d => d.category === category)
    : dummyDiscussions;

  // Apply pagination
  const paginated = filtered.slice(skip, skip + limit);

  return {
    discussions: paginated,
    pagination: {
      total: filtered.length,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(filtered.length / limit)
    }
  };
};

/**
 * Get dummy announcements
 */
const getDummyAnnouncements = (options = {}) => {
  const { page = 1, limit = 10, published = 'true' } = options;
  const skip = (page - 1) * limit;

  const dummyAnnouncements = [
    {
      _id: 'dummy-announcement-1',
      title: 'Welcome to Nirmitee Internal Communications Hub',
      content: 'We\'re excited to launch our new internal communications platform. This will help us stay connected and share knowledge.',
      priority: 'HIGH',
      tags: ['welcome', 'announcement'],
      isPublished: published === 'true',
      isPinned: true,
      createdBy: {
        _id: 'dummy-user-1',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@nirmitee.io',
        avatar: null
      },
      views: 150,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      publishedAt: published === 'true' ? new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) : null
    },
    {
      _id: 'dummy-announcement-2',
      title: 'Upcoming Team Meeting',
      content: 'Join us for our monthly team meeting this Friday at 2 PM. We\'ll discuss Q4 goals and upcoming projects.',
      priority: 'MEDIUM',
      tags: ['meeting', 'team'],
      isPublished: published === 'true',
      isPinned: false,
      createdBy: {
        _id: 'dummy-user-1',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@nirmitee.io',
        avatar: null
      },
      views: 89,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      publishedAt: published === 'true' ? new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) : null
    },
    {
      _id: 'dummy-announcement-3',
      title: 'New Office Hours',
      content: 'Starting next week, our office hours will be 9 AM to 6 PM. Please update your calendars accordingly.',
      priority: 'LOW',
      tags: ['office', 'hours'],
      isPublished: published === 'true',
      isPinned: false,
      createdBy: {
        _id: 'dummy-user-2',
        firstName: 'HR',
        lastName: 'Team',
        email: 'hr@nirmitee.io',
        avatar: null
      },
      views: 45,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      publishedAt: published === 'true' ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) : null
    }
  ];

  // Filter by published status
  let filtered = published === 'true'
    ? dummyAnnouncements.filter(a => a.isPublished)
    : dummyAnnouncements;

  // Apply pagination
  const paginated = filtered.slice(skip, skip + limit);

  return {
    announcements: paginated,
    pagination: {
      total: filtered.length,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(filtered.length / limit)
    }
  };
};

/**
 * Get a single dummy announcement by ID
 */
const getDummyAnnouncementById = (id) => {
  const dummyAnnouncements = [
    {
      _id: 'dummy-announcement-1',
      title: 'Welcome to Nirmitee Internal Communications Hub',
      content: 'We\'re excited to launch our new internal communications platform. This will help us stay connected and share knowledge.',
      priority: 'HIGH',
      tags: ['welcome', 'announcement'],
      isPublished: true,
      isPinned: true,
      createdBy: {
        _id: 'dummy-user-1',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@nirmitee.io',
        avatar: null
      },
      views: 150,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      _id: 'dummy-announcement-2',
      title: 'Upcoming Team Meeting',
      content: 'Join us for our monthly team meeting this Friday at 2 PM. We\'ll discuss Q4 goals and upcoming projects.',
      priority: 'MEDIUM',
      tags: ['meeting', 'team'],
      isPublished: true,
      isPinned: false,
      createdBy: {
        _id: 'dummy-user-1',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@nirmitee.io',
        avatar: null
      },
      views: 89,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      _id: 'dummy-announcement-3',
      title: 'New Office Hours',
      content: 'Starting next week, our office hours will be 9 AM to 6 PM. Please update your calendars accordingly.',
      priority: 'LOW',
      tags: ['office', 'hours'],
      isPublished: true,
      isPinned: false,
      createdBy: {
        _id: 'dummy-user-2',
        firstName: 'HR',
        lastName: 'Team',
        email: 'hr@nirmitee.io',
        avatar: null
      },
      views: 45,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    }
  ];

  const announcement = dummyAnnouncements.find(a => a._id === id);
  if (!announcement) {
    throw new Error('Announcement not found');
  }

  return announcement;
};

/**
 * Get dummy notifications
 */
const getDummyNotifications = (userId, options = {}) => {
  const { page = 1, limit = 20, isRead } = options;
  const skip = (page - 1) * limit;

  const dummyNotifications = [
    {
      _id: 'dummy-notification-1',
      userId: userId,
      type: 'ANNOUNCEMENT',
      content: 'New announcement: Welcome to Nirmitee Internal Communications Hub',
      metadata: {
        announcementId: 'dummy-announcement-1',
        announcementTitle: 'Welcome to Nirmitee Internal Communications Hub'
      },
      isRead: false,
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      readAt: null
    },
    {
      _id: 'dummy-notification-2',
      userId: userId,
      type: 'RECOGNITION',
      content: 'John Doe recognized you and awarded 50 points',
      metadata: {
        points: 50
      },
      isRead: false,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      readAt: null
    },
    {
      _id: 'dummy-notification-3',
      userId: userId,
      type: 'MENTION',
      content: 'Jane Smith mentioned you in a discussion',
      metadata: {
        postId: 'dummy-discussion-1',
        postType: 'discussion'
      },
      isRead: true,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      readAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
    },
    {
      _id: 'dummy-notification-4',
      userId: userId,
      type: 'COMMENT',
      content: 'Someone commented on your blog: Best Practices for Code Reviews',
      metadata: {
        blogId: 'dummy-blog-1',
        blogTitle: 'Best Practices for Code Reviews',
        commentId: 'dummy-comment-1',
        contentType: 'blog'
      },
      isRead: true,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      readAt: new Date(Date.now() - 11 * 60 * 60 * 1000)
    }
  ];

  // Filter by read status if provided
  let filtered = isRead !== undefined
    ? dummyNotifications.filter(n => n.isRead === (isRead === 'true' || isRead === true))
    : dummyNotifications;

  // Apply pagination
  const paginated = filtered.slice(skip, skip + limit);

  return {
    notifications: paginated,
    pagination: {
      total: filtered.length,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(filtered.length / limit)
    },
    unreadCount: dummyNotifications.filter(n => !n.isRead).length
  };
};

/**
 * Get dummy unread count
 */
const getDummyUnreadCount = (userId) => {
  return {
    unreadCount: 2
  };
};

/**
 * Get dummy groups
 */
const getDummyGroups = (options = {}) => {
  const { page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;

  const dummyGroups = [
    {
      _id: 'dummy-group-1',
      name: 'Frontend Developers',
      description: 'A group for frontend developers to share knowledge and discuss best practices.',
      isPublic: true,
      createdBy: {
        _id: 'dummy-user-1',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@nirmitee.io',
        avatar: null
      },
      memberCount: 15,
      postCount: 23,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      _id: 'dummy-group-2',
      name: 'Backend Engineers',
      description: 'Discussion group for backend engineering topics and architecture decisions.',
      isPublic: true,
      createdBy: {
        _id: 'dummy-user-2',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@nirmitee.io',
        avatar: null
      },
      memberCount: 12,
      postCount: 18,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      _id: 'dummy-group-3',
      name: 'DevOps Team',
      description: 'Infrastructure, CI/CD, and deployment discussions.',
      isPublic: true,
      createdBy: {
        _id: 'dummy-user-3',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@nirmitee.io',
        avatar: null
      },
      memberCount: 8,
      postCount: 14,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  ];

  // Apply pagination
  const paginated = dummyGroups.slice(skip, skip + limit);

  return {
    groups: paginated,
    pagination: {
      total: dummyGroups.length,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(dummyGroups.length / limit)
    }
  };
};

/**
 * Get a single dummy group by ID
 */
const getDummyGroupById = (id) => {
  const dummyGroups = [
    {
      _id: 'dummy-group-1',
      name: 'Frontend Developers',
      description: 'A group for frontend developers to share knowledge and discuss best practices.',
      isPublic: true,
      createdBy: {
        _id: 'dummy-user-1',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@nirmitee.io',
        avatar: null
      },
      memberCount: 15,
      postCount: 23,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      _id: 'dummy-group-2',
      name: 'Backend Engineers',
      description: 'Discussion group for backend engineering topics and architecture decisions.',
      isPublic: true,
      createdBy: {
        _id: 'dummy-user-2',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@nirmitee.io',
        avatar: null
      },
      memberCount: 12,
      postCount: 18,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      _id: 'dummy-group-3',
      name: 'DevOps Team',
      description: 'Infrastructure, CI/CD, and deployment discussions.',
      isPublic: true,
      createdBy: {
        _id: 'dummy-user-3',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@nirmitee.io',
        avatar: null
      },
      memberCount: 8,
      postCount: 14,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  ];

  const group = dummyGroups.find(g => g._id === id);
  if (!group) {
    throw new Error('Group not found');
  }

  return group;
};

module.exports = {
  getDummyDiscussions,
  getDummyAnnouncements,
  getDummyAnnouncementById,
  getDummyNotifications,
  getDummyUnreadCount,
  getDummyGroups,
  getDummyGroupById
};

