# Nirmitee Internal Communications Hub — Backend

Express.js REST API powering the Nirmitee Internal Communications Hub. Uses **MongoDB** (Mongoose), **Firebase Cloud Messaging** (Push Notifications), **Clerk SSO** for authentication, and provides numerous API route groups for all platform features.

## 📁 Project Structure

```
backend/
├── config/
│   ├── database.js              # MongoDB connection via Mongoose
│   └── initializeData.js        # Seed roles & initial data on startup
├── constants/
│   └── roles.js                 # Role definitions (admin, moderator, user)
├── controllers/                 # 21 request handlers
│   ├── authController.js
│   ├── blogController.js
│   ├── discussionController.js
│   ├── groupController.js
│   ├── newsController.js
│   ├── newsPreferencesController.js
│   ├── announcementController.js
│   ├── surveyController.js
│   ├── learningController.js
│   ├── analyticsController.js
│   ├── adminAnalyticsController.js
│   ├── adminRewardController.js
│   ├── recognitionRewardController.js
│   ├── moderationController.js
│   ├── notificationController.js
│   ├── userController.js
│   ├── profileController.js
│   ├── themeController.js
│   ├── rssController.js
│   ├── rssCategoryController.js
│   └── webhookController.js
├── jobs/
│   ├── newsJob.js               # News prefetch cron (every 15 min)
│   └── scheduledAnnouncements.js # Publish scheduled announcements (every 1 min)
├── middleware/
│   ├── auth.js                  # Clerk JWT verification & user resolution
│   ├── rbac.js                  # Role-based access control
│   ├── rateLimiter.js           # Express rate limiting
│   └── errorHandler.js          # Global error handler
├── models/                      # 28 Mongoose schemas (see Data Models below)
├── routes/                      # 16 route groups (see API Reference below)
├── scripts/                     # Utility & seed scripts (see Scripts below)
├── services/                    # 16 business-logic modules
├── utils/
│   ├── logger.js                # Structured logging
│   ├── constants.js             # Shared constants
│   ├── responseHelpers.js       # Standard API response helpers
│   ├── errorHandlers.js         # Error formatting utilities
│   ├── idHelpers.js             # MongoDB ID utilities
│   ├── userMapping.js           # User mapping helpers
│   ├── userMappingHelper.js     # Extended user mapping
│   └── newsDataHelpers.js       # NewsData.io API helpers
├── Dockerfile                   # Node 20 Alpine container
├── package.json
├── server.js                    # Entry point
└── .env                         # Environment variables (see below)
```

## 📡 API Reference

Base URL: `/api`

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | ❌ | Login with email/password |
| POST | `/auth/register` | ❌ | Register a new account |
| POST | `/auth/clerk-login` | ❌ | Authenticate via Clerk SSO |
| GET | `/auth/me` | ✅ | Get current authenticated user |
| GET | `/auth/validate` | ✅ | Validate JWT / Clerk token |
| POST | `/auth/forgot-password` | ❌ | Request password reset email |
| POST | `/auth/reset-password` | ❌ | Reset password with token |

### News (`/api/news`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/news` | ✅ | Fetch news articles (paginated, filtered) |
| GET | `/news/:id` | ✅ | Get single news article |
| GET | `/news/categories` | ✅ | List available news categories |
| GET | `/news/preferences` | ✅ | Get user news preferences |
| PUT | `/news/preferences` | ✅ | Update user news preferences |

### Blogs (`/api/blogs`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/blogs` | ✅ | List all blogs (paginated) |
| GET | `/blogs/:id` | ✅ | Get blog detail |
| POST | `/blogs` | ✅ | Create a new blog |
| PUT | `/blogs/:id` | ✅ | Update a blog |
| DELETE | `/blogs/:id` | ✅ | Delete a blog |
| POST | `/blogs/:id/comments` | ✅ | Add comment |
| POST | `/blogs/:id/bookmark` | ✅ | Toggle bookmark |

### Discussions (`/api/discussions`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/discussions` | ✅ | List discussions |
| GET | `/discussions/:id` | ✅ | Get discussion detail |
| POST | `/discussions` | ✅ | Create discussion |
| PUT | `/discussions/:id` | ✅ | Update discussion |
| DELETE | `/discussions/:id` | ✅ | Delete discussion |
| POST | `/discussions/:id/comments` | ✅ | Add comment |

### Announcements (`/api/announcements`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/announcements` | ✅ | List announcements |
| GET | `/announcements/:id` | ✅ | Get announcement detail |
| POST | `/announcements` | 🔒 Admin | Create announcement |
| PUT | `/announcements/:id` | 🔒 Admin | Update announcement |
| DELETE | `/announcements/:id` | 🔒 Admin | Delete announcement |

### Groups (`/api/groups`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/groups` | ✅ | List groups |
| GET | `/groups/:id` | ✅ | Get group detail |
| POST | `/groups` | 🔒 Admin | Create group |
| PUT | `/groups/:id` | 🔒 Admin | Update group |
| DELETE | `/groups/:id` | 🔒 Admin | Delete group |
| POST | `/groups/:id/join` | ✅ | Join group |
| POST | `/groups/:id/posts` | ✅ | Create group post |
| POST | `/groups/:id/posts/:postId/comments` | ✅ | Comment on post |

### Surveys (`/api/surveys`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/surveys` | ✅ | List surveys |
| GET | `/surveys/:id` | ✅ | Get survey detail |
| POST | `/surveys` | 🔒 Admin | Create survey |
| PUT | `/surveys/:id` | 🔒 Admin | Update survey |
| DELETE | `/surveys/:id` | 🔒 Admin | Delete survey |
| POST | `/surveys/:id/respond` | ✅ | Submit survey response |

### Learning (`/api/learning`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/learning` | ✅ | List courses |
| GET | `/learning/:id` | ✅ | Get course detail |
| POST | `/learning` | 🔒 Admin | Create course |
| PUT | `/learning/:id` | 🔒 Admin | Update course |
| POST | `/learning/:id/enroll` | ✅ | Enroll in course |
| POST | `/learning/:id/progress` | ✅ | Update module progress |

### Recognition & Rewards (`/api/recognitions`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/recognitions` | ✅ | List recognitions |
| POST | `/recognitions` | ✅ | Give recognition |
| GET | `/recognitions/leaderboard` | ✅ | Points leaderboard |
| GET | `/recognitions/rewards` | ✅ | Rewards catalog |
| POST | `/recognitions/redeem` | ✅ | Redeem points for reward |

### Users (`/api/users`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users` | ✅ | List / search users |
| GET | `/users/:id` | ✅ | Get user profile |
| PUT | `/users/:id` | ✅ | Update profile |

### Notifications (`/api/notifications`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | ✅ | Get user notifications |
| PUT | `/notifications/:id/read` | ✅ | Mark as read |
| PUT | `/notifications/read-all` | ✅ | Mark all as read |

### Analytics (`/api/analytics`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/analytics` | 🔒 Admin | Platform analytics |

### Admin (`/api/admin`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/analytics` | 🔒 Admin | Detailed admin analytics dashboard |
| GET | `/admin/rewards` | 🔒 Admin | Manage rewards catalog |
| POST | `/admin/rewards` | 🔒 Admin | Add reward |
| PUT | `/admin/rewards/:id` | 🔒 Admin | Update reward |
| DELETE | `/admin/rewards/:id` | 🔒 Admin | Remove reward |

### Moderation (`/api/moderation`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/moderation/pending` | 🔒 Admin | Pending content for review |
| PUT | `/moderation/:id/approve` | 🔒 Admin | Approve content |
| PUT | `/moderation/:id/reject` | 🔒 Admin | Reject content |

### Settings (`/api/settings`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/settings/theme` | ✅ | Get organization theme |
| PUT | `/settings/theme` | ✅ | Update theme configuration |

### Webhooks (`/api/webhooks`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/webhooks/clerk` | Svix | Clerk webhook (user sync) |

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | ❌ | Server health check |

## 📦 Data Models

| Model | Description |
|-------|-------------|
| `User` | User accounts with roles and profile data |
| `Role` | Role definitions (admin, moderator, user) |
| `Blog` | Blog posts with rich content |
| `BlogComment` | Comments on blogs |
| `Discussion` | Discussion threads |
| `DiscussionComment` | Comments on discussions |
| `Announcement` | Company announcements (with scheduling) |
| `Group` | Interest-based groups |
| `GroupPost` | Posts within groups |
| `GroupComment` | Comments on group posts |
| `GroupMember` | Group membership records |
| `SurveyModel` | Survey definitions with questions |
| `SurveyResponse` | Individual survey responses |
| `Course` | Learning courses |
| `Module` | Course modules / lessons |
| `UserCourse` | User enrollment and progress |
| `Certificate` | Course completion certificates |
| `Mentorship` | Mentorship pairings |
| `Recognition` | Peer recognitions |
| `UserPoints` | Accumulated reward points |
| `RewardCatalog` | Available rewards |
| `Redemption` | Points redemption history |
| `Notification` | User notifications |
| `Analytics` | Engagement analytics data |
| `RssSource` | RSS feed sources |
| `RssCategory` | News category definitions |
| `OrganizationThemeConfig` | Theme / branding settings |

## ⚙️ Middleware

| Middleware | File | Description |
|------------|------|-------------|
| **Auth** | `auth.js` | Verifies Clerk JWTs, resolves user from DB |
| **RBAC** | `rbac.js` | Role-based access control (admin, moderator) |
| **Rate Limiter** | `rateLimiter.js` | Express rate limiting per IP |
| **Error Handler** | `errorHandler.js` | Global error formatting & response |

## ⏰ Cron Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| News Prefetch | Every 15 minutes | Fetches and caches latest tech news from NewsData.io |
| Scheduled Announcements | Every 1 minute | Publishes announcements that have reached their scheduled time |

## 🔧 Utility Scripts

```bash
npm run dev                      # Run in development mode with nodemon
npm start                        # Run in production mode
npm run create:test-user         # Create a test user
npm run check:auth               # Verify auth configuration
node scripts/validateEnv.js      # Validate all environment variables
node scripts/seedCategories.js   # Seed RSS news categories
node scripts/seedRssSources.js   # Seed RSS feed sources
node scripts/checkDatabases.js   # Test database connections
node scripts/generateSecrets.js  # Generate JWT secrets
node scripts/testNewsAPI.js      # Test NewsData.io integration
node scripts/testWebhook.js      # Test Clerk webhook
```

## 🔐 Environment Variables

Create a `.env` file (copy from `.env.example`):

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | ✅ | Server port (default: `5002`) |
| `NODE_ENV` | ✅ | `development` or `production` |
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret key |
| `CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key |
| `CLERK_WEBHOOK_SECRET` | ✅ | Svix webhook signing secret |
| `CLERK_ORGANIZATION_ID` | ✅ | Default Clerk organization ID |
| `JWT_SECRET` | ✅ | JWT signing secret |
| `NEWSDATA_API_KEY` | ❌ | NewsData.io API key (falls back to RSS) |
| `FRONTEND_URL` | ✅ | Allowed CORS origin for frontend |
| `EMAIL_HOST` | ❌ | SMTP host for email notifications |
| `EMAIL_USER` | ❌ | SMTP username |
| `EMAIL_PASS` | ❌ | SMTP password |
| `LOG_LEVEL` | ❌ | Logging verbosity (trace, debug, info, warn, error, fatal) |

## 🚀 Running

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

The server starts on `http://localhost:5002` by default.

---

← [Back to Project Root](../README.md)
