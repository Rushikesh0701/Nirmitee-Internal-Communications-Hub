/**
 * Comprehensive dummy data service for development/testing
 * Returns hardcoded dummy data when database is unavailable
 */

// Dummy user data
const DUMMY_USER = {
  _id: 'dummy-user-id-123',
  id: 'dummy-user-id-123',
  email: 'dummy@test.com',
  firstName: 'Dummy',
  lastName: 'User',
  name: 'Dummy User',
  role: 'EMPLOYEE',
  roleId: 'role-employee-id',
  isActive: true,
  avatar: null,
  designation: 'Software Developer',
  department: 'Engineering',
  position: 'Software Developer',
  bio: 'This is a dummy user for testing',
  interests: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

const DUMMY_ADMIN_USER = {
  _id: 'dummy-admin-id-456',
  id: 'dummy-admin-id-456',
  email: 'admin@nirmitee.com',
  firstName: 'Admin',
  lastName: 'User',
  name: 'Admin User',
  role: 'ADMIN',
  roleId: 'role-admin-id',
  isActive: true,
  avatar: null,
  department: 'IT',
  position: 'System Administrator',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Dummy notifications
const DUMMY_NOTIFICATIONS = [
  {
    _id: 'notif-1',
    id: 'notif-1',
    userId: 'dummy-user-id-123',
    type: 'ANNOUNCEMENT',
    title: 'Welcome to the Platform',
    message: 'Welcome! This is a dummy notification.',
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'notif-2',
    id: 'notif-2',
    userId: 'dummy-user-id-123',
    type: 'RECOGNITION',
    title: 'You received recognition',
    message: 'Great work on the project!',
    isRead: false,
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000)
  },
  {
    _id: 'notif-3',
    id: 'notif-3',
    userId: 'dummy-user-id-123',
    type: 'MENTION',
    title: 'You were mentioned',
    message: 'Someone mentioned you in a post.',
    isRead: true,
    createdAt: new Date(Date.now() - 172800000),
    updatedAt: new Date(Date.now() - 172800000)
  },
  {
    _id: 'notif-4',
    id: 'notif-4',
    userId: 'dummy-user-id-123',
    type: 'DISCUSSION',
    title: 'New discussion reply',
    message: 'Someone replied to your discussion thread.',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date(Date.now() - 3600000)
  },
  {
    _id: 'notif-5',
    id: 'notif-5',
    userId: 'dummy-user-id-123',
    type: 'GROUP_POST',
    title: 'New post in Engineering Team',
    message: 'A new post was added to your group.',
    isRead: true,
    createdAt: new Date(Date.now() - 7200000),
    updatedAt: new Date(Date.now() - 7200000)
  }
];

// Dummy announcements
const DUMMY_ANNOUNCEMENTS = [
  {
    _id: 'announce-1',
    id: 'announce-1',
    title: 'Welcome to Nirmitee Internal Communications Hub',
    content: 'We are excited to welcome you to our new internal communications platform. This platform will help us stay connected, share knowledge, and collaborate more effectively.',
    image: null,
    tags: ['welcome', 'general', 'platform'],
    createdBy: DUMMY_ADMIN_USER._id,
    authorId: DUMMY_ADMIN_USER._id,
    isPublished: true,
    published: true,
    publishedAt: new Date(),
    scheduledAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'announce-2',
    id: 'announce-2',
    title: 'System Maintenance Scheduled',
    content: 'Scheduled maintenance will occur this weekend from Saturday 2 AM to Sunday 6 AM. The platform will be temporarily unavailable during this time.',
    image: null,
    tags: ['maintenance', 'system'],
    createdBy: DUMMY_ADMIN_USER._id,
    authorId: DUMMY_ADMIN_USER._id,
    isPublished: true,
    published: true,
    publishedAt: new Date(Date.now() - 86400000),
    scheduledAt: null,
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000)
  },
  {
    _id: 'announce-3',
    id: 'announce-3',
    title: 'New Feature: RSS Feed Integration',
    content: 'We have integrated RSS feeds for technology news. Subscribe to your favorite categories to stay updated with the latest tech trends.',
    image: null,
    tags: ['feature', 'rss', 'news'],
    createdBy: DUMMY_ADMIN_USER._id,
    authorId: DUMMY_ADMIN_USER._id,
    isPublished: true,
    published: true,
    publishedAt: new Date(Date.now() - 172800000),
    scheduledAt: null,
    createdAt: new Date(Date.now() - 172800000),
    updatedAt: new Date(Date.now() - 172800000)
  },
  {
    _id: 'announce-4',
    id: 'announce-4',
    title: 'Quarterly All-Hands Meeting',
    content: 'Join us for our quarterly all-hands meeting next Friday at 3 PM. We will discuss company updates, achievements, and future plans.',
    image: null,
    tags: ['meeting', 'company', 'quarterly'],
    createdBy: DUMMY_ADMIN_USER._id,
    authorId: DUMMY_ADMIN_USER._id,
    isPublished: true,
    published: true,
    publishedAt: new Date(Date.now() - 259200000),
    scheduledAt: null,
    createdAt: new Date(Date.now() - 259200000),
    updatedAt: new Date(Date.now() - 259200000)
  }
];

// Dummy news (including RSS-sourced)
const DUMMY_NEWS = [
  {
    _id: 'news-1',
    id: 'news-1',
    title: 'Company Achieves Record Growth in Q4',
    content: 'We are thrilled to announce that our company has achieved record growth in the fourth quarter. This milestone reflects the hard work and dedication of our entire team.',
    summary: 'Company achieves record growth in Q4, reflecting team dedication and hard work.',
    imageUrl: null,
    authorId: DUMMY_ADMIN_USER._id,
    Author: {
      _id: DUMMY_ADMIN_USER._id,
      firstName: DUMMY_ADMIN_USER.firstName,
      lastName: DUMMY_ADMIN_USER.lastName,
      email: DUMMY_ADMIN_USER.email,
      avatar: DUMMY_ADMIN_USER.avatar
    },
    category: 'Company',
    priority: 'high',
    isPublished: true,
    published: true,
    publishedAt: new Date(),
    views: 45,
    sourceUrl: null,
    sourceType: 'manual',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'news-2',
    id: 'news-2',
    title: 'Latest AI Breakthroughs in Machine Learning',
    content: 'Recent advances in machine learning are revolutionizing how we approach complex problems. From GPT models to computer vision, AI is transforming industries.',
    summary: 'Recent advances in machine learning are revolutionizing problem-solving approaches.',
    imageUrl: 'https://via.placeholder.com/800x400?text=AI+News',
    authorId: DUMMY_ADMIN_USER._id,
    Author: {
      _id: DUMMY_ADMIN_USER._id,
      firstName: DUMMY_ADMIN_USER.firstName,
      lastName: DUMMY_ADMIN_USER.lastName,
      email: DUMMY_ADMIN_USER.email,
      avatar: DUMMY_ADMIN_USER.avatar
    },
    category: 'AI',
    priority: 'medium',
    isPublished: true,
    published: true,
    publishedAt: new Date(Date.now() - 3600000),
    views: 32,
    sourceUrl: 'https://example.com/ai-breakthroughs',
    sourceType: 'rss',
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date(Date.now() - 3600000)
  },
  {
    _id: 'news-3',
    id: 'news-3',
    title: 'Cloud Infrastructure Best Practices',
    content: 'Learn about the latest best practices for cloud infrastructure management, including security, scalability, and cost optimization strategies.',
    summary: 'Best practices for cloud infrastructure management, security, and scalability.',
    imageUrl: null,
    authorId: DUMMY_ADMIN_USER._id,
    Author: {
      _id: DUMMY_ADMIN_USER._id,
      firstName: DUMMY_ADMIN_USER.firstName,
      lastName: DUMMY_ADMIN_USER.lastName,
      email: DUMMY_ADMIN_USER.email,
      avatar: DUMMY_ADMIN_USER.avatar
    },
    category: 'Cloud',
    priority: 'medium',
    isPublished: true,
    published: true,
    publishedAt: new Date(Date.now() - 7200000),
    views: 28,
    sourceUrl: 'https://example.com/cloud-best-practices',
    sourceType: 'rss',
    createdAt: new Date(Date.now() - 7200000),
    updatedAt: new Date(Date.now() - 7200000)
  },
  {
    _id: 'news-4',
    id: 'news-4',
    title: 'DevOps Automation Tools Comparison',
    content: 'A comprehensive comparison of popular DevOps automation tools including Jenkins, GitLab CI, and GitHub Actions.',
    summary: 'Comparison of popular DevOps automation tools: Jenkins, GitLab CI, GitHub Actions.',
    imageUrl: null,
    authorId: DUMMY_ADMIN_USER._id,
    Author: {
      _id: DUMMY_ADMIN_USER._id,
      firstName: DUMMY_ADMIN_USER.firstName,
      lastName: DUMMY_ADMIN_USER.lastName,
      email: DUMMY_ADMIN_USER.email,
      avatar: DUMMY_ADMIN_USER.avatar
    },
    category: 'DevOps',
    priority: 'low',
    isPublished: true,
    published: true,
    publishedAt: new Date(Date.now() - 10800000),
    views: 19,
    sourceUrl: 'https://example.com/devops-tools',
    sourceType: 'rss',
    createdAt: new Date(Date.now() - 10800000),
    updatedAt: new Date(Date.now() - 10800000)
  },
  {
    _id: 'news-5',
    id: 'news-5',
    title: 'JavaScript ES2024 New Features',
    content: 'Explore the new features coming in JavaScript ES2024, including improved async handling and new array methods.',
    summary: 'New JavaScript ES2024 features including improved async handling.',
    imageUrl: null,
    authorId: DUMMY_ADMIN_USER._id,
    Author: {
      _id: DUMMY_ADMIN_USER._id,
      firstName: DUMMY_ADMIN_USER.firstName,
      lastName: DUMMY_ADMIN_USER.lastName,
      email: DUMMY_ADMIN_USER.email,
      avatar: DUMMY_ADMIN_USER.avatar
    },
    category: 'Programming',
    priority: 'medium',
    isPublished: true,
    published: true,
    publishedAt: new Date(Date.now() - 14400000),
    views: 67,
    sourceUrl: 'https://example.com/js-es2024',
    sourceType: 'rss',
    createdAt: new Date(Date.now() - 14400000),
    updatedAt: new Date(Date.now() - 14400000)
  },
  {
    _id: 'news-6',
    id: 'news-6',
    title: 'Cybersecurity Threats: What to Watch in 2024',
    content: 'Stay informed about the latest cybersecurity threats and how to protect your organization from emerging risks.',
    summary: 'Latest cybersecurity threats and protection strategies for 2024.',
    imageUrl: null,
    authorId: DUMMY_ADMIN_USER._id,
    Author: {
      _id: DUMMY_ADMIN_USER._id,
      firstName: DUMMY_ADMIN_USER.firstName,
      lastName: DUMMY_ADMIN_USER.lastName,
      email: DUMMY_ADMIN_USER.email,
      avatar: DUMMY_ADMIN_USER.avatar
    },
    category: 'Cybersecurity',
    priority: 'high',
    isPublished: true,
    published: true,
    publishedAt: new Date(Date.now() - 18000000),
    views: 89,
    sourceUrl: 'https://example.com/cybersecurity-2024',
    sourceType: 'rss',
    createdAt: new Date(Date.now() - 18000000),
    updatedAt: new Date(Date.now() - 18000000)
  }
];

// Dummy RSS Feeds
const DUMMY_RSS_FEEDS = [
  {
    _id: 'rss-feed-1',
    id: 'rss-feed-1',
    feedUrl: 'https://feeds.feedburner.com/oreilly/radar',
    category: 'AI',
    isActive: true,
    lastFetchedAt: new Date(Date.now() - 3600000),
    createdById: DUMMY_ADMIN_USER._id,
    createdAt: new Date(Date.now() - 604800000),
    updatedAt: new Date(Date.now() - 3600000)
  },
  {
    _id: 'rss-feed-2',
    id: 'rss-feed-2',
    feedUrl: 'https://aws.amazon.com/blogs/aws/feed/',
    category: 'Cloud',
    isActive: true,
    lastFetchedAt: new Date(Date.now() - 7200000),
    createdById: DUMMY_ADMIN_USER._id,
    createdAt: new Date(Date.now() - 604800000),
    updatedAt: new Date(Date.now() - 7200000)
  },
  {
    _id: 'rss-feed-3',
    id: 'rss-feed-3',
    feedUrl: 'https://devops.com/feed/',
    category: 'DevOps',
    isActive: true,
    lastFetchedAt: new Date(Date.now() - 10800000),
    createdById: DUMMY_ADMIN_USER._id,
    createdAt: new Date(Date.now() - 604800000),
    updatedAt: new Date(Date.now() - 10800000)
  },
  {
    _id: 'rss-feed-4',
    id: 'rss-feed-4',
    feedUrl: 'https://javascriptweekly.com/rss',
    category: 'Programming',
    isActive: true,
    lastFetchedAt: new Date(Date.now() - 14400000),
    createdById: DUMMY_ADMIN_USER._id,
    createdAt: new Date(Date.now() - 604800000),
    updatedAt: new Date(Date.now() - 14400000)
  },
  {
    _id: 'rss-feed-5',
    id: 'rss-feed-5',
    feedUrl: 'https://krebsonsecurity.com/feed/',
    category: 'Cybersecurity',
    isActive: true,
    lastFetchedAt: new Date(Date.now() - 18000000),
    createdById: DUMMY_ADMIN_USER._id,
    createdAt: new Date(Date.now() - 604800000),
    updatedAt: new Date(Date.now() - 18000000)
  }
];

// Dummy RSS Articles
const DUMMY_RSS_ARTICLES = [
  {
    _id: 'rss-article-1',
    id: 'rss-article-1',
    title: 'The Future of AI in Enterprise',
    link: 'https://example.com/ai-enterprise',
    description: 'Exploring how AI is transforming enterprise operations and decision-making processes.',
    category: 'AI',
    publishedAt: new Date(Date.now() - 3600000),
    feedId: 'rss-feed-1',
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date(Date.now() - 3600000)
  },
  {
    _id: 'rss-article-2',
    id: 'rss-article-2',
    title: 'AWS Lambda Performance Optimization',
    link: 'https://example.com/aws-lambda',
    description: 'Best practices for optimizing AWS Lambda functions for better performance and cost efficiency.',
    category: 'Cloud',
    publishedAt: new Date(Date.now() - 7200000),
    feedId: 'rss-feed-2',
    createdAt: new Date(Date.now() - 7200000),
    updatedAt: new Date(Date.now() - 7200000)
  },
  {
    _id: 'rss-article-3',
    id: 'rss-article-3',
    title: 'CI/CD Pipeline Best Practices',
    link: 'https://example.com/cicd-practices',
    description: 'Learn how to build efficient CI/CD pipelines that improve development velocity.',
    category: 'DevOps',
    publishedAt: new Date(Date.now() - 10800000),
    feedId: 'rss-feed-3',
    createdAt: new Date(Date.now() - 10800000),
    updatedAt: new Date(Date.now() - 10800000)
  }
];

// Dummy blogs
const DUMMY_BLOGS = [
  {
    _id: 'blog-1',
    id: 'blog-1',
    title: 'Getting Started with React Hooks',
    content: 'React Hooks revolutionized how we write React components. In this comprehensive guide, we will explore useState, useEffect, and custom hooks.',
    excerpt: 'A comprehensive guide to React Hooks including useState, useEffect, and custom hooks.',
    coverImage: 'https://via.placeholder.com/800x400?text=React+Hooks',
    authorId: DUMMY_USER._id,
    tags: ['react', 'javascript', 'frontend', 'hooks'],
    isPublished: true,
    published: true,
    publishedAt: new Date(),
    views: 125,
    likes: 23,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'blog-2',
    id: 'blog-2',
    title: 'Building Scalable Microservices',
    content: 'Microservices architecture allows for better scalability and maintainability. Learn how to design and implement microservices that can grow with your business.',
    excerpt: 'Learn how to design and implement scalable microservices architecture.',
    coverImage: null,
    authorId: DUMMY_USER._id,
    tags: ['microservices', 'architecture', 'backend'],
    isPublished: true,
    published: true,
    publishedAt: new Date(Date.now() - 86400000),
    views: 89,
    likes: 15,
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000)
  },
  {
    _id: 'blog-3',
    id: 'blog-3',
    title: 'Introduction to GraphQL',
    content: 'GraphQL is a query language for APIs that provides a more efficient alternative to REST. Discover how to implement GraphQL in your projects.',
    excerpt: 'Introduction to GraphQL and how to implement it in your projects.',
    coverImage: 'https://via.placeholder.com/800x400?text=GraphQL',
    authorId: DUMMY_USER._id,
    tags: ['graphql', 'api', 'backend'],
    isPublished: true,
    published: true,
    publishedAt: new Date(Date.now() - 172800000),
    views: 156,
    likes: 34,
    createdAt: new Date(Date.now() - 172800000),
    updatedAt: new Date(Date.now() - 172800000)
  }
];

// Dummy discussions
const DUMMY_DISCUSSIONS = [
  {
    _id: 'discuss-1',
    id: 'discuss-1',
    title: 'Best Practices for Code Reviews',
    content: 'What are your best practices for conducting effective code reviews? Share your tips and experiences.',
    authorId: DUMMY_USER._id,
    category: 'Development',
    tags: ['code-review', 'best-practices', 'development'],
    isPinned: true,
    isLocked: false,
    views: 234,
    commentCount: 12,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'discuss-2',
    id: 'discuss-2',
    title: 'How to Improve Team Collaboration',
    content: 'Let\'s discuss strategies for improving collaboration within development teams. What tools and processes have worked best for you?',
    authorId: DUMMY_USER._id,
    category: 'Team',
    tags: ['collaboration', 'team', 'process'],
    isPinned: false,
    isLocked: false,
    views: 156,
    commentCount: 8,
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000)
  },
  {
    _id: 'discuss-3',
    id: 'discuss-3',
    title: 'Testing Strategies for Modern Applications',
    content: 'What testing strategies do you use for modern web applications? Unit tests, integration tests, E2E tests - let\'s discuss!',
    authorId: DUMMY_USER._id,
    category: 'Testing',
    tags: ['testing', 'qa', 'automation'],
    isPinned: false,
    isLocked: false,
    views: 189,
    commentCount: 15,
    createdAt: new Date(Date.now() - 172800000),
    updatedAt: new Date(Date.now() - 172800000)
  }
];

// Dummy discussion comments
const DUMMY_DISCUSSION_COMMENTS = [
  {
    _id: 'discuss-comment-1',
    id: 'discuss-comment-1',
    discussionId: 'discuss-1',
    authorId: DUMMY_USER._id,
    content: 'I always make sure to review the code with the context of the ticket in mind. It helps understand the intent.',
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date(Date.now() - 3600000)
  },
  {
    _id: 'discuss-comment-2',
    id: 'discuss-comment-2',
    discussionId: 'discuss-1',
    authorId: DUMMY_ADMIN_USER._id,
    content: 'Great point! I also find it helpful to ask questions rather than just pointing out issues.',
    createdAt: new Date(Date.now() - 1800000),
    updatedAt: new Date(Date.now() - 1800000)
  }
];

// Dummy groups
const DUMMY_GROUPS = [
  {
    _id: 'group-1',
    id: 'group-1',
    name: 'Engineering Team',
    description: 'A group for all engineering team members to collaborate and share knowledge.',
    isPublic: true,
    createdBy: DUMMY_ADMIN_USER._id,
    moderators: [DUMMY_ADMIN_USER._id],
    coverImage: null,
    memberCount: 25,
    postCount: 45,
    createdAt: new Date(Date.now() - 2592000000),
    updatedAt: new Date()
  },
  {
    _id: 'group-2',
    id: 'group-2',
    name: 'Frontend Developers',
    description: 'Discussion group for frontend developers to share tips, tricks, and best practices.',
    isPublic: true,
    createdBy: DUMMY_USER._id,
    moderators: [DUMMY_USER._id],
    coverImage: null,
    memberCount: 15,
    postCount: 32,
    createdAt: new Date(Date.now() - 1728000000),
    updatedAt: new Date()
  },
  {
    _id: 'group-3',
    id: 'group-3',
    name: 'DevOps Engineers',
    description: 'Community for DevOps engineers to discuss infrastructure, CI/CD, and automation.',
    isPublic: true,
    createdBy: DUMMY_ADMIN_USER._id,
    moderators: [DUMMY_ADMIN_USER._id],
    coverImage: null,
    memberCount: 12,
    postCount: 28,
    createdAt: new Date(Date.now() - 1296000000),
    updatedAt: new Date()
  }
];

// Dummy group posts
const DUMMY_GROUP_POSTS = [
  {
    _id: 'group-post-1',
    id: 'group-post-1',
    groupId: 'group-1',
    authorId: DUMMY_USER._id,
    content: 'Just finished implementing a new feature. Looking forward to your feedback!',
    images: [],
    mentions: [],
    commentCount: 5,
    likes: 12,
    likedBy: [],
    isPinned: false,
    isEdited: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'group-post-2',
    id: 'group-post-2',
    groupId: 'group-1',
    authorId: DUMMY_ADMIN_USER._id,
    content: 'Reminder: Team standup meeting at 10 AM tomorrow. Please prepare your updates.',
    images: [],
    mentions: [],
    commentCount: 3,
    likes: 8,
    likedBy: [],
    isPinned: true,
    isEdited: false,
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000)
  },
  {
    _id: 'group-post-3',
    id: 'group-post-3',
    groupId: 'group-2',
    authorId: DUMMY_USER._id,
    content: 'Check out this awesome new CSS feature! Has anyone tried container queries yet?',
    images: ['https://via.placeholder.com/600x400?text=CSS+Feature'],
    mentions: [],
    commentCount: 7,
    likes: 19,
    likedBy: [],
    isPinned: false,
    isEdited: false,
    createdAt: new Date(Date.now() - 172800000),
    updatedAt: new Date(Date.now() - 172800000)
  }
];

// Dummy recognitions
const DUMMY_RECOGNITIONS = [
  {
    _id: 'recognition-1',
    id: 'recognition-1',
    title: 'Outstanding Performance',
    description: 'For exceptional work on the Q4 project delivery. Your dedication and attention to detail made all the difference.',
    category: 'achievement',
    givenById: DUMMY_ADMIN_USER._id,
    receivedById: DUMMY_USER._id,
    badge: 'star',
    points: 100,
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'recognition-2',
    id: 'recognition-2',
    title: 'Team Collaboration',
    description: 'Thank you for your excellent collaboration skills and helping the team achieve our goals.',
    category: 'teamwork',
    givenById: DUMMY_ADMIN_USER._id,
    receivedById: DUMMY_USER._id,
    badge: 'team',
    points: 50,
    isPublic: true,
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000)
  },
  {
    _id: 'recognition-3',
    id: 'recognition-3',
    title: 'Innovation Award',
    description: 'For proposing and implementing an innovative solution that improved our workflow efficiency.',
    category: 'innovation',
    givenById: DUMMY_ADMIN_USER._id,
    receivedById: DUMMY_USER._id,
    badge: 'lightbulb',
    points: 75,
    isPublic: true,
    createdAt: new Date(Date.now() - 172800000),
    updatedAt: new Date(Date.now() - 172800000)
  }
];

// Dummy surveys
const DUMMY_SURVEYS = [
  {
    _id: 'survey-1',
    id: 'survey-1',
    title: 'Employee Satisfaction Survey',
    description: 'Help us understand how we can improve your work experience.',
    questions: {
      type: 'multiple_choice',
      questions: [
        {
          id: 'q1',
          question: 'How satisfied are you with your current role?',
          type: 'rating',
          options: ['1', '2', '3', '4', '5']
        },
        {
          id: 'q2',
          question: 'What areas would you like to see improved?',
          type: 'multiple_choice',
          options: ['Work-life balance', 'Career growth', 'Team collaboration', 'Tools and resources']
        }
      ]
    },
    createdById: DUMMY_ADMIN_USER._id,
    isActive: true,
    startDate: new Date(Date.now() - 604800000),
    endDate: new Date(Date.now() + 604800000),
    allowAnonymous: false,
    responseCount: 45,
    createdAt: new Date(Date.now() - 604800000),
    updatedAt: new Date()
  },
  {
    _id: 'survey-2',
    id: 'survey-2',
    title: 'Technology Stack Preferences',
    description: 'Share your preferences for our technology stack decisions.',
    questions: {
      type: 'multiple_choice',
      questions: [
        {
          id: 'q1',
          question: 'Which frontend framework do you prefer?',
          type: 'single_choice',
          options: ['React', 'Vue', 'Angular', 'Svelte']
        },
        {
          id: 'q2',
          question: 'What backend technologies are you most comfortable with?',
          type: 'multiple_choice',
          options: ['Node.js', 'Python', 'Java', 'Go', 'Rust']
        }
      ]
    },
    createdById: DUMMY_ADMIN_USER._id,
    isActive: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 2592000000),
    allowAnonymous: false,
    responseCount: 23,
    createdAt: new Date(Date.now() - 172800000),
    updatedAt: new Date()
  }
];

// Dummy courses
const DUMMY_COURSES = [
  {
    _id: 'course-1',
    id: 'course-1',
    title: 'Introduction to React',
    description: 'Learn the fundamentals of React including components, props, state, and hooks.',
    content: {
      modules: [
        { title: 'Getting Started', duration: 30 },
        { title: 'Components and Props', duration: 45 },
        { title: 'State Management', duration: 60 }
      ]
    },
    instructorId: DUMMY_ADMIN_USER._id,
    category: 'Frontend',
    level: 'beginner',
    duration: 135,
    thumbnail: 'https://via.placeholder.com/400x300?text=React+Course',
    isPublished: true,
    enrollmentCount: 45,
    rating: 4.5,
    createdAt: new Date(Date.now() - 2592000000),
    updatedAt: new Date()
  },
  {
    _id: 'course-2',
    id: 'course-2',
    title: 'Advanced Node.js Development',
    description: 'Master advanced Node.js concepts including async patterns, performance optimization, and microservices.',
    content: {
      modules: [
        { title: 'Async Patterns', duration: 60 },
        { title: 'Performance Optimization', duration: 45 },
        { title: 'Microservices Architecture', duration: 90 }
      ]
    },
    instructorId: DUMMY_ADMIN_USER._id,
    category: 'Backend',
    level: 'advanced',
    duration: 195,
    thumbnail: null,
    isPublished: true,
    enrollmentCount: 28,
    rating: 4.8,
    createdAt: new Date(Date.now() - 1728000000),
    updatedAt: new Date()
  },
  {
    _id: 'course-3',
    id: 'course-3',
    title: 'Docker and Kubernetes Fundamentals',
    description: 'Learn containerization with Docker and orchestration with Kubernetes.',
    content: {
      modules: [
        { title: 'Docker Basics', duration: 45 },
        { title: 'Docker Compose', duration: 30 },
        { title: 'Kubernetes Introduction', duration: 60 }
      ]
    },
    instructorId: DUMMY_ADMIN_USER._id,
    category: 'DevOps',
    level: 'intermediate',
    duration: 135,
    thumbnail: 'https://via.placeholder.com/400x300?text=Docker+K8s',
    isPublished: true,
    enrollmentCount: 67,
    rating: 4.6,
    createdAt: new Date(Date.now() - 1296000000),
    updatedAt: new Date()
  }
];

/**
 * Get dummy notifications
 */
const getDummyNotifications = (userId, options = {}) => {
  const { page = 1, limit = 10, isRead } = options;
  let notifications = [...DUMMY_NOTIFICATIONS];

  if (isRead !== undefined) {
    notifications = notifications.filter(n => n.isRead === (isRead === 'true'));
  }

  const start = (page - 1) * limit;
  const end = start + parseInt(limit);

  return {
    notifications: notifications.slice(start, end),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: notifications.length,
      totalPages: Math.ceil(notifications.length / limit)
    }
  };
};

/**
 * Get dummy unread count
 */
const getDummyUnreadCount = (userId) => {
  return {
    unreadCount: DUMMY_NOTIFICATIONS.filter(n => !n.isRead).length
  };
};

/**
 * Get dummy announcements
 */
const getDummyAnnouncements = (options = {}) => {
  const { page = 1, limit = 10, published } = options;
  let announcements = [...DUMMY_ANNOUNCEMENTS];

  if (published !== undefined) {
    announcements = announcements.filter(a => a.isPublished === (published === 'true' || published === true));
  }

  const start = (page - 1) * limit;
  const end = start + parseInt(limit);

  return {
    announcements: announcements.slice(start, end),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: announcements.length,
      pages: Math.ceil(announcements.length / limit)
    }
  };
};

/**
 * Get dummy news
 */
const getDummyNews = (options = {}) => {
  const { page = 1, limit = 10, published, category, priority } = options;
  let news = [...DUMMY_NEWS];

  // Filter by published status
  if (published !== undefined) {
    const publishedBool = published === 'true' || published === true;
    news = news.filter(n => n.isPublished === publishedBool);
  } else {
    // If not specified, default to published only
    news = news.filter(n => n.isPublished === true);
  }

  if (category) {
    news = news.filter(n => n.category === category);
  }

  if (priority) {
    news = news.filter(n => n.priority === priority);
  }

  const start = (page - 1) * limit;
  const end = start + parseInt(limit);

  const paginatedNews = news.slice(start, end);

  // Ensure all news items have Author populated
  const newsWithAuthor = paginatedNews.map(item => {
    if (!item.Author && item.authorId) {
      return {
        ...item,
        Author: DUMMY_ADMIN_USER
      };
    }
    return item;
  });

  return {
    news: newsWithAuthor,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: news.length,
      pages: Math.ceil(news.length / limit)
    }
  };
};

/**
 * Get dummy blogs
 */
const getDummyBlogs = (options = {}) => {
  const { page = 1, limit = 10, published } = options;
  let blogs = [...DUMMY_BLOGS];

  if (published !== undefined) {
    blogs = blogs.filter(b => b.isPublished === (published === 'true' || published === true));
  }

  const start = (page - 1) * limit;
  const end = start + parseInt(limit);

  return {
    blogs: blogs.slice(start, end),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: blogs.length,
      pages: Math.ceil(blogs.length / limit)
    }
  };
};

/**
 * Get dummy discussions
 */
const getDummyDiscussions = (options = {}) => {
  const { page = 1, limit = 10, category } = options;
  let discussions = [...DUMMY_DISCUSSIONS];

  if (category) {
    discussions = discussions.filter(d => d.category === category);
  }

  const start = (page - 1) * limit;
  const end = start + parseInt(limit);

  return {
    discussions: discussions.slice(start, end),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: discussions.length,
      pages: Math.ceil(discussions.length / limit)
    }
  };
};

/**
 * Get dummy groups
 */
const getDummyGroups = (options = {}) => {
  const { page = 1, limit = 10 } = options;
  const start = (page - 1) * limit;
  const end = start + parseInt(limit);

  return {
    groups: DUMMY_GROUPS.slice(start, end),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: DUMMY_GROUPS.length,
      pages: Math.ceil(DUMMY_GROUPS.length / limit)
    }
  };
};

/**
 * Get dummy RSS feeds
 */
const getDummyRSSFeeds = (options = {}) => {
  const { category, isActive } = options;
  let feeds = [...DUMMY_RSS_FEEDS];

  if (category) {
    feeds = feeds.filter(f => f.category === category);
  }

  if (isActive !== undefined) {
    feeds = feeds.filter(f => f.isActive === (isActive === 'true' || isActive === true));
  }

  return feeds;
};

/**
 * Get dummy RSS articles
 */
const getDummyRSSArticles = (options = {}) => {
  const { page = 1, limit = 20, category } = options;
  let articles = [...DUMMY_RSS_ARTICLES];

  if (category) {
    articles = articles.filter(a => a.category === category);
  }

  const start = (page - 1) * limit;
  const end = start + parseInt(limit);

  return {
    articles: articles.slice(start, end),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: articles.length,
      pages: Math.ceil(articles.length / limit)
    }
  };
};

/**
 * Get dummy recognitions
 */
const getDummyRecognitions = (options = {}) => {
  const { page = 1, limit = 10, receivedById, category } = options;
  let recognitions = [...DUMMY_RECOGNITIONS];

  if (receivedById) {
    recognitions = recognitions.filter(r => r.receivedById === receivedById);
  }

  if (category) {
    recognitions = recognitions.filter(r => r.category === category);
  }

  const start = (page - 1) * limit;
  const end = start + parseInt(limit);

  return {
    recognitions: recognitions.slice(start, end),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: recognitions.length,
      pages: Math.ceil(recognitions.length / limit)
    }
  };
};

/**
 * Get dummy surveys
 */
const getDummySurveys = (options = {}) => {
  const { page = 1, limit = 10, status, isActive } = options;
  let surveys = [...DUMMY_SURVEYS];

  // Map isActive to status for compatibility
  let filterStatus = status;
  if (isActive === 'true' || isActive === true) {
    filterStatus = 'ACTIVE';
  }

  // Filter by status if provided
  if (filterStatus) {
    surveys = surveys.filter(s => {
      // Check both status and isActive for backward compatibility
      return (s.status === filterStatus) || 
             (filterStatus === 'ACTIVE' && s.isActive === true);
    });
  }

  // Convert isActive to status for consistency
  surveys = surveys.map(s => ({
    ...s,
    status: s.status || (s.isActive ? 'ACTIVE' : 'DRAFT')
  }));

  const start = (page - 1) * limit;
  const end = start + parseInt(limit);

  return {
    surveys: surveys.slice(start, end),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: surveys.length,
      pages: Math.ceil(surveys.length / limit)
    }
  };
};

/**
 * Get dummy courses
 */
const getDummyCourses = (options = {}) => {
  const { page = 1, limit = 10, category, level, isPublished } = options;
  let courses = [...DUMMY_COURSES];

  if (category) {
    courses = courses.filter(c => c.category === category);
  }

  if (level) {
    courses = courses.filter(c => c.level === level);
  }

  if (isPublished !== undefined) {
    courses = courses.filter(c => c.isPublished === (isPublished === 'true' || isPublished === true));
  }

  const start = (page - 1) * limit;
  const end = start + parseInt(limit);

  return {
    courses: courses.slice(start, end),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: courses.length,
      pages: Math.ceil(courses.length / limit)
    }
  };
};

/**
 * Get dummy group posts
 */
const getDummyGroupPosts = (options = {}) => {
  const { page = 1, limit = 20, groupId } = options;
  let posts = [...DUMMY_GROUP_POSTS];

  if (groupId) {
    posts = posts.filter(p => p.groupId === groupId);
  }

  const start = (page - 1) * limit;
  const end = start + parseInt(limit);

  return {
    posts: posts.slice(start, end),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: posts.length,
      pages: Math.ceil(posts.length / limit)
    }
  };
};

/**
 * Get dummy discussion comments
 */
const getDummyDiscussionComments = (options = {}) => {
  const { page = 1, limit = 20, discussionId } = options;
  let comments = [...DUMMY_DISCUSSION_COMMENTS];

  if (discussionId) {
    comments = comments.filter(c => c.discussionId === discussionId);
  }

  const start = (page - 1) * limit;
  const end = start + parseInt(limit);

  return {
    comments: comments.slice(start, end),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: comments.length,
      pages: Math.ceil(comments.length / limit)
    }
  };
};

module.exports = {
  DUMMY_USER,
  DUMMY_ADMIN_USER,
  DUMMY_NOTIFICATIONS,
  DUMMY_ANNOUNCEMENTS,
  DUMMY_NEWS,
  DUMMY_RSS_FEEDS,
  DUMMY_RSS_ARTICLES,
  DUMMY_BLOGS,
  DUMMY_DISCUSSIONS,
  DUMMY_DISCUSSION_COMMENTS,
  DUMMY_GROUPS,
  DUMMY_GROUP_POSTS,
  DUMMY_RECOGNITIONS,
  DUMMY_SURVEYS,
  DUMMY_COURSES,
  getDummyNotifications,
  getDummyUnreadCount,
  getDummyAnnouncements,
  getDummyNews,
  getDummyBlogs,
  getDummyDiscussions,
  getDummyGroups,
  getDummyRSSFeeds,
  getDummyRSSArticles,
  getDummyRecognitions,
  getDummySurveys,
  getDummyCourses,
  getDummyGroupPosts,
  getDummyDiscussionComments
};
