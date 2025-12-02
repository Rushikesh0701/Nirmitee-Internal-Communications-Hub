const ROLES = {
  ADMIN: 'Admin',
  MODERATOR: 'Moderator',
  EMPLOYEE: 'Employee'
};

// Role descriptions as per requirements
const ROLE_DESCRIPTIONS = {
  ADMIN: 'HR, management, or designated communicators.',
  MODERATOR: 'Trusted employees for group moderation.',
  EMPLOYEE: 'All verified users (nirmitee.io).'
};

const PERMISSIONS = {
  // News & Announcements (Admin: Manage news, surveys, analytics, roles, and announcements)
  CREATE_NEWS: ['Admin', 'Moderator'],
  EDIT_NEWS: ['Admin', 'Moderator'],
  DELETE_NEWS: ['Admin'],
  MANAGE_ANNOUNCEMENTS: ['Admin'],
  
  // Blogs (Employee: Post blogs)
  CREATE_BLOG: ['Admin', 'Moderator', 'Employee'],
  EDIT_OWN_BLOG: ['Admin', 'Moderator', 'Employee'],
  EDIT_ANY_BLOG: ['Admin', 'Moderator'],
  DELETE_BLOG: ['Admin', 'Moderator'],
  
  // Discussions (Employee: Join discussions)
  CREATE_DISCUSSION: ['Admin', 'Moderator', 'Employee'],
  JOIN_DISCUSSION: ['Admin', 'Moderator', 'Employee'],
  MODERATE_DISCUSSION: ['Admin', 'Moderator'], // Moderator: Approve posts, manage comments
  
  // Groups & Communities (Moderator: Moderate communities)
  APPROVE_POSTS: ['Admin', 'Moderator'],
  MANAGE_COMMENTS: ['Admin', 'Moderator'],
  MODERATE_COMMUNITIES: ['Admin', 'Moderator'],
  
  // Surveys (Admin: Manage surveys; Employee: Respond to surveys)
  CREATE_SURVEY: ['Admin'],
  RESPOND_SURVEY: ['Admin', 'Moderator', 'Employee'],
  VIEW_SURVEY_RESULTS: ['Admin', 'Moderator'],
  
  // Learning & Development (Employee: Participate in programs)
  MANAGE_COURSES: ['Admin', 'Moderator'],
  ENROLL_COURSES: ['Admin', 'Moderator', 'Employee'],
  PARTICIPATE_PROGRAMS: ['Admin', 'Moderator', 'Employee'],
  
  // Analytics (Admin: Manage analytics)
  VIEW_ANALYTICS: ['Admin', 'Moderator'],
  MANAGE_ANALYTICS: ['Admin'],
  
  // Roles & Users (Admin: Manage roles)
  MANAGE_ROLES: ['Admin'],
  MANAGE_USERS: ['Admin'],
  EDIT_ANY_PROFILE: ['Admin'], // Admin can edit other's profile (everything)
  VIEW_ALL_USERS: ['Admin', 'Moderator']
};

module.exports = { ROLES, PERMISSIONS, ROLE_DESCRIPTIONS };

