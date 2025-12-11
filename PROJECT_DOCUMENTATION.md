# Nirmitee Internal Communications Hub - Complete Documentation

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Backend Structure](#backend-structure)
5. [Frontend Structure](#frontend-structure)
6. [Authentication & Authorization](#authentication--authorization)
7. [Database Models](#database-models)
8. [API Endpoints](#api-endpoints)
9. [Key Features](#key-features)
10. [Application Flow](#application-flow)
11. [Setup & Installation](#setup--installation)
12. [Environment Variables](#environment-variables)

---

## 🎯 Project Overview

**Nirmitee Internal Communications Hub** is a comprehensive internal communication and collaboration platform designed for organizations. It provides a centralized hub for news, announcements, blogs, discussions, employee recognition, learning management, and analytics.

### Purpose
- Facilitate internal communication
- Enable knowledge sharing through blogs and discussions
- Recognize and reward employee contributions
- Manage learning and development programs
- Conduct surveys and gather feedback
- Track engagement through analytics

### Target Users
- **Employees**: All verified users with @nirmitee.io email
- **Moderators**: Trusted employees for content moderation
- **Admins**: HR, management, or designated communicators

---

## 🛠 Technology Stack

### Backend
- **Runtime**: Node.js (v14+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) + Cookies
- **Security**: 
  - Helmet.js (HTTP headers)
  - CORS
  - Express Rate Limiter
  - bcryptjs (Password hashing)
- **Validation**: Express-validator
- **Scheduling**: Node-cron (Background jobs)
- **API Integration**: Axios
- **RSS Parser**: rss-parser
- **Email**: Nodemailer
- **Logging**: Custom logger utility

### Frontend
- **Framework**: React 18.2
- **Build Tool**: Vite
- **Routing**: React Router DOM v6
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **UI Framework**: TailwindCSS
- **Rich Text Editor**: 
  - CKEditor 5
  - Tiptap
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Notifications**: React Hot Toast
- **Date Utilities**: date-fns
- **HTML Sanitization**: DOMPurify

### DevOps & Deployment
- **Frontend Hosting**: Netlify
- **API Documentation**: RESTful API
- **Version Control**: Git

---

## 🏗 Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   React Frontend (Vite + TailwindCSS)               │   │
│  │   - Pages, Components, Layouts                       │   │
│  │   - Zustand (Auth State)                            │   │
│  │   - React Query (Data Fetching)                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/HTTPS (JWT + Cookies)
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   Express.js Server                                  │   │
│  │   - Routes → Controllers → Services                  │   │
│  │   - Middleware (Auth, RBAC, Error Handler)          │   │
│  │   - Cron Jobs (RSS, Scheduled Posts)               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ Mongoose ODM
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   MongoDB Database                                   │   │
│  │   - Users, Roles, Blogs, Discussions                │   │
│  │   - News, Announcements, Surveys                    │   │
│  │   - Recognitions, Rewards, Courses                  │   │
│  │   - Analytics, Notifications                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

```
User Action → React Component → API Service → Express Route 
  → Auth Middleware → RBAC Middleware → Controller 
    → Service Layer → MongoDB → Response
```

---

## 📦 Backend Structure

### Directory Layout

```
backend/
├── config/
│   ├── database.js              # MongoDB connection
│   └── initializeData.js        # Seed roles and test users
├── constants/
│   └── roles.js                 # Role definitions & permissions
├── controllers/
│   ├── authController.js        # Authentication logic
│   ├── blogController.js        # Blog CRUD operations
│   ├── discussionController.js  # Discussion management
│   ├── recognitionRewardController.js
│   ├── surveyController.js
│   ├── learningController.js
│   ├── newsController.js
│   ├── announcementController.js
│   ├── groupController.js
│   ├── userController.js
│   ├── analyticsController.js
│   ├── adminAnalyticsController.js
│   ├── adminRewardController.js
│   ├── notificationController.js
│   ├── profileController.js
│   └── moderationController.js
├── middleware/
│   ├── auth.js                  # JWT & Cookie authentication
│   ├── rbac.js                  # Role-based access control
│   └── errorHandler.js          # Global error handler
├── models/                       # Mongoose schemas
│   ├── User.js
│   ├── Role.js
│   ├── Blog.js
│   ├── BlogComment.js
│   ├── Discussion.js
│   ├── DiscussionComment.js
│   ├── News.js
│   ├── Announcement.js
│   ├── Recognition.js
│   ├── RewardCatalog.js
│   ├── Redemption.js
│   ├── UserPoints.js
│   ├── SurveyModel.js
│   ├── SurveyResponse.js
│   ├── Course.js
│   ├── Module.js
│   ├── Certificate.js
│   ├── UserCourse.js
│   ├── Group.js
│   ├── GroupMember.js
│   ├── GroupPost.js
│   ├── GroupComment.js
│   ├── RSSFeed.js
│   ├── RssArticle.js
│   ├── Notification.js
│   ├── Analytics.js
│   ├── Mentorship.js
│   └── index.js
├── routes/                       # Express routes
│   ├── auth.js
│   ├── blogs.js
│   ├── discussions.js
│   ├── news.js
│   ├── announcements.js
│   ├── surveys.js
│   ├── learning.js
│   ├── recognitionRewards.js
│   ├── groups.js
│   ├── users.js
│   ├── rss.js
│   ├── notifications.js
│   ├── analytics.js
│   ├── admin.js
│   └── moderation.js
├── services/                     # Business logic layer
│   ├── authService.js
│   ├── blogService.js
│   ├── discussionService.js
│   ├── newsService.js
│   ├── announcementService.js
│   ├── surveyService.js
│   ├── learningService.js
│   ├── recognitionRewardService.js
│   ├── groupService.js
│   ├── userService.js
│   ├── profileService.js
│   ├── rssService.js
│   ├── notificationService.js
│   ├── analyticsService.js
│   ├── adminAnalyticsService.js
│   ├── dummyAuthService.js
│   └── dummyDataService.js
├── jobs/
│   ├── rssFeedFetcher.js        # Cron job for RSS feeds
│   └── scheduledAnnouncements.js # Scheduled post publishing
├── utils/
│   ├── constants.js             # App-wide constants
│   ├── logger.js                # Winston logger
│   ├── responseHelpers.js       # Standard API responses
│   ├── errorHandlers.js
│   ├── dbOperationHelper.js
│   ├── dbFallbackHelper.js
│   ├── idHelpers.js
│   ├── newsDataHelpers.js
│   ├── userMapping.js
│   └── userMappingHelper.js
├── scripts/                      # Utility scripts
│   ├── createTestUser.js
│   ├── checkAuth.js
│   ├── setupPostgreSQL.js
│   └── ...
├── package.json
├── server.js                     # Main entry point
└── .env
```

### Key Backend Components

#### 1. **Server Entry (server.js)**
- Initializes Express app
- Configures middleware (CORS, Helmet, Rate Limiting)
- Connects to MongoDB
- Sets up routes
- Schedules cron jobs (RSS feeds every 6 hours, announcements every minute)
- Starts HTTP server on port 5002

#### 2. **Authentication Middleware (middleware/auth.js)**
- **authenticateToken**: Validates JWT tokens from Authorization header
- **optionalAuth**: Allows requests with or without authentication
- Supports both JWT and cookie-based auth (backward compatibility)
- Populates `req.user`, `req.userId`, `req.userRole`

#### 3. **RBAC Middleware (middleware/rbac.js)**
- **checkRole**: Validates user has required role
- **isAdmin**: Admin-only routes
- **isModerator**: Admin + Moderator access
- **isEmployee**: All authenticated users
- **checkOwnership**: Verify resource ownership or admin/moderator

#### 4. **Role System (constants/roles.js)**
Three main roles with distinct permissions:

**Admin**
- Manage news, announcements, surveys, analytics
- Manage roles and users
- Full system access

**Moderator**
- Moderate communities and discussions
- Approve posts, manage comments
- View analytics

**Employee**
- Post blogs, join discussions
- Respond to surveys
- Participate in learning programs
- Send/receive recognitions

---

## 🎨 Frontend Structure

### Directory Layout

```
frontend/
├── src/
│   ├── components/
│   │   ├── blog/
│   │   │   ├── BlogCard.jsx
│   │   │   ├── BlogDetail.jsx
│   │   │   ├── BlogForm.jsx
│   │   │   ├── BlogList.jsx
│   │   │   └── ...
│   │   ├── discussion/
│   │   │   └── DiscussionCard.jsx
│   │   ├── editor/
│   │   │   ├── CKEditorComponent.jsx
│   │   │   ├── TiptapEditor.jsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   └── Navigation.jsx
│   │   ├── ui/
│   │   │   └── Button.jsx
│   │   ├── AdminRoute.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── NotificationBell.jsx
│   │   ├── RoleBadge.jsx
│   │   ├── CommentsComponent.jsx
│   │   ├── PostComposer.jsx
│   │   ├── MentionInput.jsx
│   │   ├── RSSSubscriptionManager.jsx
│   │   ├── AnnouncementNotification.jsx
│   │   └── Loading.jsx
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── blogs/
│   │   │   ├── Blogs.jsx
│   │   │   ├── BlogDetail.jsx
│   │   │   ├── CreateBlog.jsx
│   │   │   └── EditBlog.jsx
│   │   ├── discussions/
│   │   │   ├── Discussions.jsx
│   │   │   ├── DiscussionDetail.jsx
│   │   │   ├── CreateDiscussion.jsx
│   │   │   └── DiscussionForm.jsx
│   │   ├── news/
│   │   │   ├── NewsList.jsx
│   │   │   └── NewsDetail.jsx
│   │   ├── announcements/
│   │   │   ├── AnnouncementsList.jsx
│   │   │   ├── AnnouncementDetail.jsx
│   │   │   └── AnnouncementForm.jsx
│   │   ├── recognitions/
│   │   │   ├── RecognitionsFeed.jsx
│   │   │   ├── RecognitionForm.jsx
│   │   │   ├── RewardsCatalog.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   └── PointsHistory.jsx
│   │   ├── surveys/
│   │   │   ├── SurveysList.jsx
│   │   │   ├── SurveyDetail.jsx
│   │   │   ├── SurveyForm.jsx
│   │   │   └── SurveyAnalytics.jsx
│   │   ├── learning/
│   │   │   ├── LearningList.jsx
│   │   │   ├── CourseDetail.jsx
│   │   │   └── CourseForm.jsx
│   │   ├── groups/
│   │   │   ├── GroupsList.jsx
│   │   │   ├── GroupDetail.jsx
│   │   │   └── GroupForm.jsx
│   │   ├── admin/
│   │   │   └── AdminRewardsManagement.jsx
│   │   ├── analytics/
│   │   │   └── Analytics.jsx
│   │   ├── profile/
│   │   │   └── ProfilePage.jsx
│   │   ├── directory/
│   │   │   └── EmployeeDirectory.jsx
│   │   ├── notifications/
│   │   │   └── NotificationsPage.jsx
│   │   ├── rss/
│   │   │   └── RSSFeeds.jsx
│   │   └── Dashboard.jsx
│   ├── layouts/
│   │   ├── Layout.jsx              # Main app layout with sidebar
│   │   └── AuthLayout.jsx          # Login/register layout
│   ├── services/
│   │   ├── api.js                  # Axios instance
│   │   ├── authService.js
│   │   ├── blogService.js
│   │   ├── discussionService.js
│   │   ├── newsService.js
│   │   └── ...
│   ├── store/
│   │   └── authStore.js            # Zustand auth state
│   ├── hooks/
│   │   ├── useAuthGuard.js
│   │   ├── useBlogMutations.js
│   │   ├── useBookmarks.js
│   │   └── useNewsFilter.js
│   ├── utils/
│   │   ├── animations.js
│   │   ├── blogHelpers.js
│   │   ├── newsConstants.js
│   │   ├── sanitize.js
│   │   └── userHelpers.js
│   ├── config/
│   │   └── routes.js               # Centralized route config
│   ├── styles/
│   │   └── blog-content.css
│   ├── App.jsx                     # Root component
│   ├── main.jsx                    # Entry point
│   └── index.css                   # Global styles
├── public/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── netlify.toml
```

### Key Frontend Components

#### 1. **App Structure (App.jsx)**
```javascript
QueryClientProvider (React Query)
  → Router (React Router v6)
    → Routes
      ├── Public Routes (AuthLayout)
      │   ├── /login
      │   └── /register
      └── Protected Routes (Layout)
          ├── Dashboard
          ├── News, Blogs, Discussions
          ├── Groups, Recognitions
          ├── Surveys, Learning
          ├── Admin Routes (Admin-only)
          └── Analytics, Rewards Management
```

#### 2. **State Management (store/authStore.js)**
- Global authentication state using Zustand
- Stores: user, isAuthenticated, isLoading
- Actions:
  - `initialize()`: Check auth on app load
  - `login(email, password)`: Authenticate user
  - `register(userData)`: Create new account
  - `logout()`: Clear session
  - `fetchUser()`: Refresh user data
  - `updateUser(userData)`: Update user info

#### 3. **Route Protection**
- **ProtectedRoute**: Requires authentication
- **AdminRoute**: Requires Admin or Moderator role
- Uses `useAuthStore` to check auth state
- Redirects to /login if not authenticated

#### 4. **Layout System**
- **Layout.jsx**: Main app layout with sidebar navigation
  - Responsive sidebar (mobile hamburger menu)
  - Navigation items based on role
  - User profile section
  - Notification bell
- **AuthLayout.jsx**: Minimal layout for login/register

---

## 🔐 Authentication & Authorization

### Authentication Flow

#### 1. **User Registration**
```
Frontend (Register.jsx)
  → POST /api/auth/register
    → authController.register
      → authService.register
        → Create User in MongoDB
        → Hash password with bcryptjs
        → Assign Employee role by default
  ← Response: { success: true, user }
```

#### 2. **User Login**
```
Frontend (Login.jsx)
  → POST /api/auth/login
    → authController.login
      → authService.login
        → Find user by email
        → Compare password (bcryptjs)
        → Generate JWT tokens (access + refresh)
        → Set cookie (userId) for backward compatibility
  ← Response: { user, accessToken, refreshToken }
  → Store tokens in localStorage
  → Set Authorization header: Bearer <accessToken>
  → Update Zustand store
  → Redirect to /dashboard
```

#### 3. **Token Refresh**
```
Frontend detects expired token
  → POST /api/auth/refresh
    → authController.refresh
      → Verify refreshToken
      → Generate new access token
  ← Response: { accessToken, refreshToken }
  → Update localStorage
  → Retry original request
```

#### 4. **Session Verification**
```
Protected Route Access
  → authenticateToken middleware
    → Extract token from Authorization header
    → Verify JWT signature
    → Decode userId
    → Fetch user from MongoDB
    → Populate req.user, req.userId, req.userRole
  → Continue to controller
```

### Authorization (RBAC)

#### Role Hierarchy
```
Admin (Highest)
  ↓ Can do everything Moderator can do
Moderator (Middle)
  ↓ Can do everything Employee can do
Employee (Base)
```

#### Permission Matrix

| Feature | Admin | Moderator | Employee |
|---------|-------|-----------|----------|
| Create News | ✅ | ✅ | ❌ |
| Manage Announcements | ✅ | ❌ | ❌ |
| Create Blog | ✅ | ✅ | ✅ |
| Edit Own Blog | ✅ | ✅ | ✅ |
| Edit Any Blog | ✅ | ✅ | ❌ |
| Delete Blog | ✅ | ✅ | ❌ |
| Create Discussion | ✅ | ✅ | ✅ |
| Moderate Discussion | ✅ | ✅ | ❌ |
| Create Survey | ✅ | ❌ | ❌ |
| Respond to Survey | ✅ | ✅ | ✅ |
| View Analytics | ✅ | ✅ | ❌ |
| Manage Users | ✅ | ❌ | ❌ |
| Manage Courses | ✅ | ✅ | ❌ |
| Send Recognition | ✅ | ✅ | ✅ |
| Manage Rewards | ✅ | ❌ | ❌ |

---

## 💾 Database Models

### Core Models

#### 1. **User**
```javascript
{
  email: String (unique, required),
  password: String (hashed),
  firstName: String,
  lastName: String,
  displayName: String,
  avatar: String (URL),
  department: String,
  position: String,
  roleId: ObjectId (ref: Role),
  isActive: Boolean,
  lastLogin: Date,
  oauthProvider: String (google, github),
  oauthId: String,
  rssSubscriptions: [String] (min 3 categories),
  timestamps: true
}
```

#### 2. **Role**
```javascript
{
  name: String (Admin, Moderator, Employee),
  description: String,
  permissions: [String],
  timestamps: true
}
```

#### 3. **Blog**
```javascript
{
  title: String,
  content: String (rich text),
  excerpt: String,
  category: String,
  coverImage: String,
  authorId: ObjectId (ref: User),
  tags: [String],
  isPublished: Boolean,
  publishedAt: Date,
  views: Number,
  likes: Number,
  likedBy: [ObjectId],
  moderationStatus: String (PENDING, APPROVED, REJECTED),
  moderatedBy: ObjectId (ref: User),
  moderatedAt: Date,
  timestamps: true
}
```

#### 4. **Discussion**
```javascript
{
  title: String,
  content: String,
  authorId: ObjectId (ref: User),
  category: String,
  tags: [String],
  isPinned: Boolean,
  isLocked: Boolean,
  views: Number,
  commentCount: Number,
  timestamps: true
}
```

#### 5. **Recognition**
```javascript
{
  senderId: ObjectId (ref: User),
  receiverId: ObjectId (ref: User),
  message: String,
  badge: String (STAR_PERFORMER, TEAM_PLAYER, etc.),
  points: Number,
  isPublic: Boolean,
  category: String,
  timestamps: true
}
```

#### 6. **Announcement**
```javascript
{
  title: String,
  content: String,
  authorId: ObjectId (ref: User),
  priority: String (LOW, MEDIUM, HIGH, URGENT),
  targetAudience: String (ALL, DEPARTMENT, ROLE),
  targetDepartment: String,
  targetRole: ObjectId (ref: Role),
  scheduledFor: Date,
  expiresAt: Date,
  isPublished: Boolean,
  isPinned: Boolean,
  attachments: [String],
  tags: [String],
  views: Number,
  readBy: [ObjectId],
  timestamps: true
}
```

#### 7. **Survey**
```javascript
{
  title: String,
  description: String,
  createdBy: ObjectId (ref: User),
  questions: [{
    questionText: String,
    questionType: String (TEXT, MULTIPLE_CHOICE, RATING, etc.),
    options: [String],
    isRequired: Boolean
  }],
  isActive: Boolean,
  startDate: Date,
  endDate: Date,
  isAnonymous: Boolean,
  targetAudience: String,
  timestamps: true
}
```

#### 8. **Course**
```javascript
{
  title: String,
  description: String,
  category: String,
  level: String (BEGINNER, INTERMEDIATE, ADVANCED),
  duration: Number (hours),
  coverImage: String,
  instructorId: ObjectId (ref: User),
  modules: [ObjectId] (ref: Module),
  enrolledCount: Number,
  rating: Number,
  isPublished: Boolean,
  tags: [String],
  timestamps: true
}
```

### Supporting Models

- **BlogComment**: Comments on blogs
- **DiscussionComment**: Comments on discussions
- **News**: Tech news articles (live from external APIs)
- **RSSFeed**: RSS feed sources (deprecated - now live only)
- **RssArticle**: Fetched RSS articles (deprecated - not stored)
- **RewardCatalog**: Available rewards
- **Redemption**: Reward redemptions
- **UserPoints**: User point balances
- **SurveyResponse**: Survey answers
- **Notification**: User notifications
- **Analytics**: Usage analytics
- **Group**: Community groups
- **GroupMember**: Group memberships
- **GroupPost**: Posts in groups
- **GroupComment**: Comments on group posts
- **Certificate**: Course completion certificates
- **UserCourse**: Course enrollment tracking
- **Module**: Course modules
- **Mentorship**: Mentorship relationships

---

## 🔌 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/register` | Register new user | No | - |
| POST | `/login` | Login user | No | - |
| POST | `/refresh` | Refresh access token | No | - |
| POST | `/logout` | Logout user | Yes | All |
| GET | `/me` | Get current user | Yes | All |

### Blogs (`/api/blogs`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get all blogs | Yes | All |
| GET | `/:id` | Get blog by ID | Yes | All |
| POST | `/` | Create new blog | Yes | All |
| PUT | `/:id` | Update blog | Yes | Owner/Mod/Admin |
| DELETE | `/:id` | Delete blog | Yes | Owner/Mod/Admin |
| POST | `/:id/like` | Like/unlike blog | Yes | All |
| POST | `/:id/comments` | Add comment | Yes | All |
| DELETE | `/:id/comments/:commentId` | Delete comment | Yes | Owner/Mod/Admin |

### Discussions (`/api/discussions`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get all discussions | Yes | All |
| GET | `/:id` | Get discussion by ID | Yes | All |
| POST | `/` | Create discussion | Yes | All |
| PUT | `/:id` | Update discussion | Yes | Owner/Mod/Admin |
| DELETE | `/:id` | Delete discussion | Yes | Owner/Mod/Admin |
| POST | `/:id/comments` | Add comment | Yes | All |

### News (`/api/news`)

> **Note**: News is fetched from live external sources only (NewsData.io API + Healthcare IT RSS feeds). No database storage.

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get merged news (NewsData.io + RSS) | Yes | All |
| GET | `/rss` | Get RSS-only articles (Healthcare IT) | Yes | All |
| GET | `/:id` | Get news by ID (from cache) | Yes | All |
| POST | `/` | Create news (not supported) | Yes | Admin/Mod |
| PUT | `/:id` | Update news (not supported) | Yes | Admin/Mod |
| DELETE | `/:id` | Delete news (not supported) | Yes | Admin |

### Announcements (`/api/announcements`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get all announcements | Yes | All |
| GET | `/:id` | Get announcement | Yes | All |
| POST | `/` | Create announcement | Yes | Admin |
| PUT | `/:id` | Update announcement | Yes | Admin |
| DELETE | `/:id` | Delete announcement | Yes | Admin |
| POST | `/:id/read` | Mark as read | Yes | All |

### Recognitions (`/api/recognitions`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get recognitions feed | Yes | All |
| POST | `/` | Send recognition | Yes | All |
| GET | `/leaderboard` | Get points leaderboard | Yes | All |
| GET | `/rewards` | Get reward catalog | Yes | All |
| POST | `/redeem` | Redeem reward | Yes | All |
| GET | `/points/history` | Get points history | Yes | All |

### Surveys (`/api/surveys`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get all surveys | Yes | All |
| GET | `/:id` | Get survey by ID | Yes | All |
| POST | `/` | Create survey | Yes | Admin |
| PUT | `/:id` | Update survey | Yes | Admin |
| DELETE | `/:id` | Delete survey | Yes | Admin |
| POST | `/:id/respond` | Submit response | Yes | All |
| GET | `/:id/analytics` | Get survey analytics | Yes | Admin/Mod |

### Learning (`/api/learning`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/courses` | Get all courses | Yes | All |
| GET | `/courses/:id` | Get course details | Yes | All |
| POST | `/courses` | Create course | Yes | Admin/Mod |
| PUT | `/courses/:id` | Update course | Yes | Admin/Mod |
| DELETE | `/courses/:id` | Delete course | Yes | Admin |
| POST | `/courses/:id/enroll` | Enroll in course | Yes | All |
| POST | `/courses/:id/progress` | Update progress | Yes | All |
| GET | `/my-courses` | Get enrolled courses | Yes | All |

### Groups (`/api/groups`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get all groups | Yes | All |
| GET | `/:id` | Get group details | Yes | All |
| POST | `/` | Create group | Yes | Admin |
| PUT | `/:id` | Update group | Yes | Admin |
| DELETE | `/:id` | Delete group | Yes | Admin |
| POST | `/:id/join` | Join group | Yes | All |
| POST | `/:id/leave` | Leave group | Yes | All |
| POST | `/:id/posts` | Create group post | Yes | Members |
| GET | `/:id/posts` | Get group posts | Yes | Members |

### Users (`/api/users`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get all users | Yes | Admin/Mod |
| GET | `/:id` | Get user profile | Yes | All |
| PUT | `/:id` | Update user | Yes | Owner/Admin |
| DELETE | `/:id` | Delete user | Yes | Admin |
| GET | `/:id/activity` | Get user activity | Yes | Owner/Admin |

### Analytics (`/api/analytics`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/dashboard` | Get dashboard stats | Yes | Admin/Mod |
| GET | `/engagement` | Get engagement metrics | Yes | Admin/Mod |
| GET | `/users` | Get user analytics | Yes | Admin/Mod |
| GET | `/content` | Get content analytics | Yes | Admin/Mod |

### Admin (`/api/admin`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/rewards` | Get all rewards | Yes | Admin |
| POST | `/rewards` | Create reward | Yes | Admin |
| PUT | `/rewards/:id` | Update reward | Yes | Admin |
| DELETE | `/rewards/:id` | Delete reward | Yes | Admin |
| GET | `/redemptions` | Get redemptions | Yes | Admin |

### RSS Feeds (`/api/rss`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/feeds` | Get user's feed articles | Yes | All |
| GET | `/categories` | Get RSS categories | Yes | All |
| PUT | `/subscriptions` | Update subscriptions | Yes | All |
| POST | `/refresh` | Manually refresh feeds | Yes | Admin |

### Notifications (`/api/notifications`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get user notifications | Yes | All |
| PUT | `/:id/read` | Mark as read | Yes | All |
| PUT | `/read-all` | Mark all as read | Yes | All |
| DELETE | `/:id` | Delete notification | Yes | All |

---

## ✨ Key Features

### 1. **News & Announcements**

**News Feed** (Live Data Only)
- Fetches news from **NewsData.io API** (Tech/IT/Programming categories)
- Fetches news from **Healthcare IT RSS feeds**:
  - healthcareitnews.com
  - healthitoutcomes.com
  - healthtechmagazine.net
  - medtech.pharmaintelligence.informa.com
- Automatic deduplication by title and URL
- In-memory caching (5-minute TTL) for article lookups
- Fallback to dummy data when live sources fail
- Advanced filtering: search, category, source, language
- Sorting: date, relevance, popularity

**Announcements**
- Admins can create, edit, delete announcements
- Priority levels (LOW, MEDIUM, HIGH, URGENT)
- Target specific audiences (department, role, or all)
- Schedule announcements for future publishing
- Pin important announcements
- Track views and read status
- Expiration dates for time-sensitive content

### 2. **Blogs**
- All employees can write and publish blogs
- Rich text editor (CKEditor 5 + Tiptap)
- Categories and tags for organization
- Cover images
- Draft/published states
- Like system
- Comments with nested replies
- Moderation workflow (pending/approved/rejected)
- View tracking

### 3. **Discussions**
- Create discussion threads
- Category-based organization
- Pin important discussions
- Lock discussions to prevent new comments
- Tagging system
- Comment system
- View and engagement tracking
- Search and filter capabilities

### 4. **Employee Recognition & Rewards**
- Send recognition to colleagues
- Badge system (Star Performer, Team Player, Innovator, etc.)
- Points-based reward system
- Public/private recognitions
- Leaderboard
- Reward catalog
- Points redemption
- Recognition feed
- Points history tracking

### 5. **Surveys**
- Admin creates surveys
- Multiple question types:
  - Text input
  - Multiple choice
  - Rating scales
  - Yes/No
- Anonymous survey option
- Schedule surveys (start/end dates)
- Target specific audiences
- Real-time analytics dashboard
- Response tracking
- Export capabilities

### 6. **Learning & Development**
- Course management system
- Module-based content
- Video, document, and quiz support
- Progress tracking
- Certificates upon completion
- Course ratings
- Enrollment management
- Difficulty levels (Beginner, Intermediate, Advanced)
- Category organization

### 7. **Groups & Communities**
- Create interest-based groups
- Group membership management
- Group-specific posts and discussions
- Member roles (admin, moderator, member)
- Group analytics
- Activity feeds

### 8. **RSS Feed Integration**
- Healthcare IT news from 4 dedicated RSS feeds
- Real-time fetching on each request
- Categories: HealthcareIT
- Integrated with main news feed
- `/api/news/rss` endpoint for RSS-only articles
- Automatic parsing and transformation
- No database storage - live data only

### 9. **Notifications**
- Real-time notification bell
- Notification types:
  - New announcements
  - Recognition received
  - Comments on your content
  - Survey invitations
  - Course enrollments
  - Group activities
- Mark as read/unread
- Notification preferences

### 10. **Analytics Dashboard** (Admin/Moderator)
- User engagement metrics
- Content performance
- Survey responses
- Learning completion rates
- Recognition statistics
- Active users tracking
- Department-wise analytics
- Trend analysis with charts (Recharts)

### 11. **Employee Directory**
- Search employees by name, department, role
- View profiles
- Contact information
- Department hierarchy
- Role filtering

### 12. **Profile Management**
- View and edit personal profile
- Avatar upload
- Department and position
- Activity history
- Recognitions received
- Courses completed
- Points balance

---

## 🔄 Application Flow

### 1. **Initial App Load**

```
User opens app
  → main.jsx renders App.jsx
  → App.jsx initializes React Query
  → useAuthStore.initialize() called
    → GET /api/auth/me
    → If valid token:
        Set isAuthenticated = true
        Load user data
      Else:
        Set isAuthenticated = false
  → Route decision:
      Authenticated → /dashboard
      Not authenticated → /login
```

### 2. **User Registration Flow**

```
User navigates to /register
  → Enter email (@nirmitee.io), password, name
  → Submit form
    → POST /api/auth/register
      → Validate email domain
      → Hash password (bcryptjs)
      → Create user in MongoDB with Employee role
      → Return success message
    ← Registration successful
  → Redirect to /login
```

### 3. **User Login Flow**

```
User navigates to /login
  → Enter email and password
  → Submit form
    → authStore.login(email, password)
      → POST /api/auth/login
        → Validate credentials
        → Find user in MongoDB
        → Compare hashed password
        → Generate JWT tokens (access + refresh)
        → Set cookie (userId)
        ← Return { user, accessToken, refreshToken }
      → Store tokens in localStorage
      → Set Authorization header
      → Update authStore state
    ← Login successful
  → Redirect to /dashboard
```

### 4. **Dashboard Load**

```
User at /dashboard
  → Layout.jsx renders with sidebar navigation
  → Dashboard.jsx component loads
    → Fetch recent announcements (GET /api/announcements)
    → Fetch recent recognitions (GET /api/recognitions)
    → Fetch user's courses (GET /api/learning/my-courses)
    → Fetch RSS feed articles (GET /api/rss/feeds)
  → Display aggregated dashboard widgets:
      - Upcoming surveys
      - Recent blogs
      - Leaderboard preview
      - Quick actions
```

### 5. **Creating a Blog**

```
Employee clicks "Create Blog"
  → Navigate to /blogs/create
  → CreateBlog.jsx loads rich text editor (CKEditor)
  → User enters:
      - Title
      - Content (with formatting)
      - Category
      - Tags
      - Cover image URL
  → Click "Publish"
    → POST /api/blogs
      → authenticateToken middleware validates user
      → blogController.createBlog
        → blogService.createBlog
          → Save blog to MongoDB
          → Set authorId = current user
          → moderationStatus = APPROVED (auto-approve)
          → isPublished = true
        ← Return created blog
    ← Blog created successfully
  → Redirect to /blogs/:id (blog detail page)
  → Show success toast notification
```

### 6. **Sending Recognition**

```
Employee navigates to /recognitions/new
  → RecognitionForm.jsx loads
  → User selects:
      - Recipient (from employee list)
      - Badge type (Star Performer, Team Player, etc.)
      - Category
      - Message
      - Public/Private
  → Submit
    → POST /api/recognitions
      → authenticateToken middleware
      → recognitionController.create
        → Calculate points based on badge
        → Save recognition to MongoDB
        → Update receiver's UserPoints
        → Create notification for receiver
        ← Return recognition
    ← Recognition sent
  → Show success message
  → Redirect to /recognitions feed
  → Receiver sees notification bell update
```

### 7. **Taking a Survey**

```
Employee receives survey notification
  → Click notification → Navigate to /surveys/:id
  → SurveyDetail.jsx loads
    → GET /api/surveys/:id
    → Display questions:
        - Text inputs
        - Multiple choice (radio/checkboxes)
        - Rating scales
  → User fills out answers
  → Submit
    → POST /api/surveys/:id/respond
      → Validate all required fields
      → Save SurveyResponse to MongoDB
      → Update survey response count
      ← Response saved
    ← Survey submitted
  → Show thank you message
  → Redirect to /surveys
```

### 8. **Admin Creating Announcement**

```
Admin clicks "Create Announcement"
  → Navigate to /announcements/new
  → AnnouncementForm.jsx loads
  → Admin enters:
      - Title
      - Content (rich text)
      - Priority (LOW, MEDIUM, HIGH, URGENT)
      - Target audience (ALL, DEPARTMENT, ROLE)
      - Schedule date (optional)
      - Expiration date (optional)
      - Pin option
  → Submit
    → POST /api/announcements
      → authenticateToken + isAdmin middleware
      → announcementController.create
        → Save announcement to MongoDB
        → If scheduled:
            isPublished = false
            scheduledFor = selected date
          Else:
            isPublished = true
        → Create notifications for target users
        ← Return announcement
    ← Announcement created
  → Scheduled announcements are published by cron job
  → Users see announcement notification
```

### 9. **Moderator Reviewing Blog**

```
Moderator navigates to /moderation
  → View blogs with moderationStatus = PENDING
  → Click on blog to review
  → Read content
  → Decision:
      Approve → PUT /api/blogs/:id/moderate
                  { status: 'APPROVED' }
      Reject → PUT /api/blogs/:id/moderate
                 { status: 'REJECTED', reason: '...' }
    → isModerator middleware validates
    → Update blog.moderationStatus
    → Update blog.moderatedBy
    → Create notification for author
    ← Moderation completed
```

### 10. **Viewing Analytics** (Admin)

```
Admin navigates to /analytics
  → Analytics.jsx loads
  → Fetch multiple metrics in parallel:
      - GET /api/analytics/dashboard
        → Total users, active users, new users
        → Content stats (blogs, discussions, etc.)
        → Engagement rates
      - GET /api/analytics/engagement
        → Daily active users (chart data)
        → Content creation trends
        → Most engaged users
      - GET /api/analytics/content
        → Most viewed blogs
        → Popular discussions
        → Survey response rates
  → Render charts (Recharts):
      - Line chart: User activity over time
      - Bar chart: Content by category
      - Pie chart: User distribution by department
      - Table: Top contributors
  → Export options (CSV, PDF)
```

### 11. **News Data Fetching** (Live Data)

```
User navigates to /news
  → NewsList.jsx loads
    → GET /api/news
      → newsController.getAllNews
        → newsService.getAllNews
          → Parallel fetch:
              1. fetchNewsFromNewsData (NewsData.io API)
              2. fetchAllRSSFeeds (4 Healthcare IT RSS feeds)
          → Merge articles
          → Deduplicate by title/URL
          → Apply filters (search, category, source, date range)
          → Sort by selected option (date/relevance/popularity)
          → Cache results for getNewsById lookups
          → Paginate and return
        ← Return { results, totalResults, nextPage }
      ← Response
    → Display articles in grid
    → Click article → Opens external link
    → Filters update → Refetch with new params
```

### 12. **Token Refresh Flow**

```
User makes API request
  → Request sent with expired accessToken
  ← Response: 401 Unauthorized { message: 'Token expired' }
  → axios interceptor detects 401
    → Extract refreshToken from localStorage
    → POST /api/auth/refresh { refreshToken }
      → Verify refreshToken
      → Generate new accessToken
      ← Return { accessToken, refreshToken }
    → Update localStorage
    → Update Authorization header
    → Retry original request
      → Request succeeds with new token
    ← Original response returned
  → User continues without interruption

If refresh fails:
  → Clear tokens
  → Update authStore: isAuthenticated = false
  → Redirect to /login
```

### 13. **Real-time Notification Flow**

```
Event occurs (e.g., new recognition sent)
  → recognitionService.create
    → Save recognition to database
    → notificationService.create({
        userId: receiverId,
        type: 'RECOGNITION_RECEIVED',
        message: 'You received a recognition!',
        link: '/recognitions/:id'
      })
    → Save Notification to MongoDB
    ← Notification created

Frontend (polling every 30 seconds):
  → NotificationBell.jsx
    → useEffect with interval
      → GET /api/notifications?unread=true
      ← Return unread notifications array
    → Update badge count
    → User clicks bell
      → Show notification dropdown
      → List notifications with links
      → Click notification:
          PUT /api/notifications/:id/read
          Navigate to notification.link
```

### 14. **Complete User Journey Example**

```
Day 1: Employee joins organization
  1. Receives email with platform link
  2. Registers at /register with @nirmitee.io email
  3. Assigned Employee role automatically
  4. Logs in → Dashboard
  5. Prompted to subscribe to 3+ RSS categories
  6. Explores announcements, news, blogs
  7. Enrolls in onboarding course

Day 2: Engaging with content
  1. Logs in → Dashboard shows personalized feed
  2. Reads RSS tech news articles
  3. Likes and comments on colleague's blog
  4. Joins discussion about project
  5. Receives recognition from manager (20 points)
  6. Notification: "New survey available"
  7. Completes employee feedback survey

Week 1: Creating content
  1. Writes first blog post about project experience
  2. Blog auto-approved, published
  3. Receives likes and comments
  4. Starts discussion thread
  5. Accumulates 50 points from activities
  6. Views leaderboard → Ranked #15

Month 1: Fully engaged
  1. Completes 2 courses → Earns certificates
  2. Sends recognitions to 5 colleagues
  3. 100+ points earned
  4. Redeems points for gift card reward
  5. Joins 3 interest-based groups
  6. Regular blogger (5 posts)
  7. Active in discussions (30+ comments)

Admin view:
  - Dashboard shows this user as "Highly Engaged"
  - Analytics: 90th percentile activity
  - Profile: "Top Contributor" badge
```

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js**: v14 or higher
- **MongoDB**: v4.4 or higher
- **npm** or **yarn**

### Backend Setup

1. **Clone repository**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create `.env` file in backend directory:

```env
# Server Configuration
PORT=5002
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/nirmitee_hub

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# NewsData.io API (optional)
NEWSDATA_API_KEY=your_newsdata_api_key_here

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-app-specific-password
```

4. **Start MongoDB**
```bash
# macOS (via Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# Or run directly
mongod --dbpath /path/to/data/directory
```

5. **Initialize database**
```bash
# Creates roles and test users
npm run dev
```

6. **Start server**
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

Server runs on `http://localhost:5002`

### Frontend Setup

1. **Navigate to frontend**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
Create `.env` file in frontend directory:

```env
VITE_API_URL=http://localhost:5002/api
```

4. **Start development server**
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

5. **Build for production**
```bash
npm run build
```

### Default Test Users

After initial setup, these users are created:

**Admin User**
- Email: `admin@nirmitee.io`
- Password: `admin123`
- Role: Admin

**Moderator User**
- Email: `moderator@nirmitee.io`
- Password: `moderator123`
- Role: Moderator

**Employee User**
- Email: `employee@nirmitee.io`
- Password: `employee123`
- Role: Employee

---

## 🔧 Environment Variables

### Backend Environment Variables

```env
# ================================
# SERVER CONFIGURATION
# ================================
PORT=5002
NODE_ENV=development

# ================================
# DATABASE
# ================================
MONGODB_URI=mongodb://localhost:27017/nirmitee_hub

# ================================
# AUTHENTICATION
# ================================
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# ================================
# CORS & FRONTEND
# ================================
FRONTEND_URL=http://localhost:5173

# ================================
# NEWS API (Optional)
# ================================
# Get free API key from https://newsdata.io
NEWSDATA_API_KEY=your_newsdata_api_key_here

# ================================
# EMAIL SERVICE (Optional)
# ================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@nirmitee.io

# ================================
# RATE LIMITING
# ================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ================================
# FILE UPLOAD (Optional)
# ================================
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf
```

### Frontend Environment Variables

```env
# ================================
# API CONFIGURATION
# ================================
VITE_API_URL=http://localhost:5002/api

# ================================
# OAUTH (Optional - if implementing)
# ================================
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GITHUB_CLIENT_ID=your-github-client-id

# ================================
# FEATURE FLAGS (Optional)
# ================================
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_NOTIFICATIONS=true

# ================================
# DEPLOYMENT
# ================================
VITE_APP_NAME=Nirmitee Hub
VITE_APP_VERSION=1.0.0
```

---

## 📊 Cron Jobs

### 1. Scheduled Announcements
- **Schedule**: Every minute (`* * * * *`)
- **File**: `backend/jobs/scheduledAnnouncements.js`
- **Function**: `publishScheduledAnnouncements()`
- **Purpose**: Publishes announcements scheduled for current time

> **Note**: RSS Feed Fetcher cron job was removed. News is now fetched live from external sources on each request.

---

## 🔍 Code Architecture Patterns

### Backend Patterns

#### 1. **MVC + Services Architecture**
```
Route → Controller → Service → Model → Database
```

- **Routes**: Define endpoints and validation
- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic and data operations
- **Models**: Database schemas and methods
- **Middleware**: Cross-cutting concerns (auth, validation, errors)

#### 2. **Standardized Responses**
```javascript
// Success response
sendSuccess(res, data, message, statusCode)

// Error response
sendError(res, message, statusCode)
```

#### 3. **Error Handling**
- Global error handler middleware
- Custom error classes
- Consistent error format
- Logging with Winston

### Frontend Patterns

#### 1. **Container/Presentational Components**
- Smart containers (pages) handle data fetching
- Dumb components (components) handle UI

#### 2. **Custom Hooks**
- `useAuthGuard`: Protect routes
- `useBlogMutations`: Blog CRUD operations
- `useBookmarks`: Bookmark management
- `useNewsFilter`: Filter news articles

#### 3. **Service Layer**
- Centralized API calls
- Axios instance configuration
- Request/response interceptors
- Error handling

---

## 📈 Performance Optimizations

### Backend
1. **Database Indexing**: Strategic indexes on frequently queried fields
2. **Query Optimization**: Populate only required fields
3. **Caching**: Node-cache for frequently accessed data
4. **Rate Limiting**: Prevent abuse and DoS attacks
5. **Pagination**: Limit response sizes

### Frontend
1. **Code Splitting**: React.lazy() for route-based splitting
2. **React Query**: Automatic caching and background refetching
3. **Image Optimization**: Lazy loading, appropriate formats
4. **Debouncing**: Search inputs, API calls
5. **Memoization**: useMemo, useCallback for expensive operations

---

## 🔒 Security Measures

1. **Authentication**: JWT with refresh tokens
2. **Password Hashing**: bcryptjs with salt rounds
3. **Input Validation**: Express-validator
4. **SQL/NoSQL Injection**: Mongoose sanitization
5. **XSS Protection**: DOMPurify on frontend, CSP headers
6. **CSRF Protection**: SameSite cookies
7. **Rate Limiting**: Express-rate-limit
8. **Helmet.js**: Security HTTP headers
9. **CORS**: Whitelist allowed origins
10. **HTTPS**: Required in production
11. **Sensitive Data**: Environment variables
12. **Role-Based Access**: Granular permissions

---

## 🧪 Testing Strategy

### Backend Testing
```bash
# Unit tests for services
npm test

# Integration tests for API endpoints
npm run test:integration

# Test coverage
npm run test:coverage
```

### Frontend Testing
```bash
# Component tests
npm test

# E2E tests
npm run test:e2e
```

---

## 📝 Code Standards

### Backend
- **Style**: JavaScript ES6+
- **Linting**: ESLint
- **Formatting**: Prettier
- **Naming**: camelCase for variables/functions, PascalCase for models

### Frontend
- **Style**: JSX, Functional components
- **Hooks**: Prefer hooks over class components
- **Styling**: TailwindCSS utility classes
- **File Structure**: Feature-based organization

---

## 🚨 Common Issues & Troubleshooting

### Issue 1: MongoDB Connection Failed
**Error**: `MongooseError: connect ECONNREFUSED`
**Solution**: 
- Ensure MongoDB is running: `sudo systemctl start mongod`
- Check MONGODB_URI in .env
- Verify MongoDB port (default 27017)

### Issue 2: JWT Token Invalid
**Error**: `401 Unauthorized`
**Solution**:
- Clear localStorage and re-login
- Check JWT_SECRET matches in backend
- Verify token expiration settings

### Issue 3: CORS Error
**Error**: `Access-Control-Allow-Origin`
**Solution**:
- Add frontend URL to allowedOrigins in server.js
- Ensure withCredentials: true in API calls

### Issue 4: Port Already in Use
**Error**: `EADDRINUSE`
**Solution**:
```bash
# Find process using port
lsof -ti:5002

# Kill process
lsof -ti:5002 | xargs kill -9
```

---

## 📚 Additional Resources

### Documentation
- [Express.js](https://expressjs.com/)
- [React](https://react.dev/)
- [MongoDB](https://www.mongodb.com/docs/)
- [Mongoose](https://mongoosejs.com/)
- [TailwindCSS](https://tailwindcss.com/)

### Tools
- [Postman](https://www.postman.com/) - API testing
- [MongoDB Compass](https://www.mongodb.com/products/compass) - Database GUI
- [VS Code](https://code.visualstudio.com/) - Recommended IDE

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open pull request

---

## 📄 License

This project is proprietary and confidential.

---

## 👥 Team & Support

For questions or support:
- **Email**: support@nirmitee.io
- **Internal Slack**: #nirmitee-hub-support

---

**Last Updated**: December 11, 2024
**Version**: 1.1.0
**Status**: Production Ready ✅

