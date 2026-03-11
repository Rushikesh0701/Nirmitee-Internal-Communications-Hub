# Nirmitee Internal Communications Hub — Frontend

React single-page application built with **Vite**, **TailwindCSS**, and **Clerk** authentication. Features 18 page modules, 50+ components, and Zustand state management.

## 📁 Project Structure

```
frontend/
├── public/                      # Static assets (favicons, images)
├── src/
│   ├── App.jsx                  # Root component (routing, auth, interceptors)
│   ├── main.jsx                 # Entry point (ClerkProvider, ThemeProvider)
│   ├── index.css                # Global styles & TailwindCSS
│   │
│   ├── config/
│   │   └── routes.js            # Centralized route config (public, protected, admin)
│   │
│   ├── contexts/
│   │   └── ThemeContext.jsx      # Organization theme context provider
│   │
│   ├── store/                   # Zustand state management
│   │   ├── authStore.js         # Auth state, user session, Clerk integration
│   │   └── creationStore.js     # Content creation state
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuthGuard.js      # Route protection logic
│   │   ├── useBlogMutations.js  # Blog CRUD operations
│   │   ├── useBookmarks.js      # Bookmark management
│   │   ├── useNewsFilter.js     # News filtering & search
│   │   ├── useNewsPreferences.js # User news preferences
│   │   └── useNotificationEffects.js # Notification side effects
│   │
│   ├── services/                # API communication layer
│   │   ├── api.js               # Axios instance (base URL, interceptors)
│   │   ├── blogApi.js
│   │   ├── discussionApi.js
│   │   ├── learningApi.js
│   │   ├── moderationApi.js
│   │   ├── notificationApi.js
│   │   ├── recognitionRewardApi.js
│   │   ├── redemptionApi.js
│   │   ├── surveyApi.js
│   │   ├── themeApi.js
│   │   ├── userApi.js
│   │   └── adminAnalyticsApi.js
│   │
│   ├── components/              # Reusable UI components
│   │   ├── AdminRoute.jsx       # Admin-only route wrapper
│   │   ├── ProtectedRoute.jsx   # Authenticated route wrapper
│   │   ├── PublicRoute.jsx      # Unauthenticated route wrapper
│   │   ├── RootRedirect.jsx     # Root path redirect logic
│   │   ├── Loading.jsx          # Loading spinner
│   │   ├── EmptyState.jsx       # Empty data placeholder
│   │   ├── Pagination.jsx       # Pagination controls
│   │   ├── NotificationBell.jsx # Header notification icon & dropdown
│   │   ├── AnnouncementNotification.jsx # Toast-style announcement alerts
│   │   ├── PostComposer.jsx     # Post creation widget
│   │   ├── CommentsComponent.jsx # Comments thread
│   │   ├── MentionInput.jsx     # @mention input
│   │   ├── RoleBadge.jsx        # Role indicator badges
│   │   ├── SkeletonLoader.jsx   # Generic skeleton loader
│   │   ├── analytics/           # Analytics chart components
│   │   ├── blog/                # Blog-specific UI (cards, lists, filters)
│   │   ├── discussion/          # Discussion components
│   │   ├── editor/              # Rich text editor (TipTap)
│   │   ├── layout/              # Layout components
│   │   ├── moderation/          # Moderation UI
│   │   ├── news/                # News cards, filters
│   │   ├── skeletons/           # Page-specific skeleton loaders
│   │   ├── theme/               # Theme customization UI
│   │   └── ui/                  # General UI primitives
│   │
│   ├── layouts/
│   │   ├── Layout.jsx           # Main app layout (sidebar, header)
│   │   └── AuthLayout.jsx       # Authentication pages layout
│   │
│   ├── pages/                   # Page components (see Page Modules below)
│   ├── styles/                  # Additional stylesheets
│   └── utils/                   # Utility functions
│
├── Dockerfile                   # Multi-stage build (Vite → Nginx)
├── nginx.conf                   # Nginx SPA config for production
├── vite.config.js               # Vite dev server & build config
├── tailwind.config.js           # TailwindCSS configuration
├── index.html                   # HTML entry point
└── package.json
```

## 📄 Page Modules

| Module | Pages | Description |
|--------|-------|-------------|
| **Dashboard** | `Dashboard.jsx` | Main overview with activity feed, stats |
| **Auth** | Login, Register, ForgotPassword, ResetPassword, SSOCallback | Authentication flows (Clerk SSO + email) |
| **News** | NewsList, NewsDetail | Tech news feed with category filters |
| **Announcements** | AnnouncementsList, AnnouncementDetail, AnnouncementForm | Company-wide announcements |
| **Blogs** | Blogs, BlogDetail, CreateBlog, EditBlog, BlogAnalytics | Blog authoring & reading |
| **Discussions** | Discussions, DiscussionDetail, CreateDiscussion, DiscussionForm, DiscussionAnalytics | Forum discussions |
| **Groups** | GroupsList, GroupDetail, GroupForm, GroupAnalytics | Interest-based groups |
| **Surveys** | SurveysList, SurveyDetail, SurveyForm, SurveyAnalytics | Employee surveys |
| **Learning** | LearningList, CourseDetail, CourseForm, MyProgress, MyCertificates, CertificateView, MentorshipDashboard | LMS with progress tracking |
| **Recognition** | RecognitionsFeed, RecognitionForm, RewardsCatalog, Leaderboard, PointsHistory, RedemptionHistory | Peer recognition & rewards |
| **Moderation** | ModerationDashboard, BlogModeration, AnnouncementModeration | Content moderation (Admin) |
| **Analytics** | Analytics, AdminAnalytics | Engagement dashboards (Admin) |
| **Admin** | AdminRewardsManagement, RedemptionManagement, RssManagement | Admin tools |
| **Profile** | ProfilePage | User profile view & edit |
| **Directory** | EmployeeDirectory | Employee search & browse |
| **Notifications** | NotificationsPage | Full notification history |
| **Search** | SearchResults | Global search results |
| **Activity** | ActivityFeed | Recent activity timeline |
| **Settings** | Settings | User & theme settings |

## 🧩 Key Libraries

| Library | Purpose |
|---------|---------|
| `react` 18 | UI framework |
| `vite` | Build tool & dev server |
| `tailwindcss` | Utility-first CSS |
| `@clerk/clerk-react` | SSO authentication (Google) |
| `firebase` | Cloud messaging / notifications |
| `zustand` | Lightweight state management |
| `react-query` | Server state & caching |
| `react-router-dom` | Client-side routing |
| `framer-motion` | Animations & transitions |
| `recharts` | Data visualization charts |
| `@ckeditor/*` | Rich text editor for specialized content |
| `@tiptap/*` | Extensible rich text editor |
| `lucide-react` | Icon library |
| `react-hot-toast` | Toast notifications |
| `react-hook-form` | Form handling |
| `dompurify` | HTML sanitization |
| `date-fns` | Date utilities |
| `react-loading-skeleton` | Skeleton loaders |
| `axios` | HTTP client |

## 🔀 Routing

Routes are centralized in `src/config/routes.js` and use **lazy loading** for code splitting.

| Type | Guard | Description |
|------|-------|-------------|
| **Public** | `PublicRoute` | Login, Register, ForgotPassword, ResetPassword — redirects to dashboard if logged in |
| **Protected** | `ProtectedRoute` | All feature pages — requires authentication |
| **Admin** | `AdminRoute` | Admin-only pages — requires admin role |
| **SSO Callback** | None | `/sso-callback` — Clerk SSO completion |

## 🔐 Environment Variables

Create a `.env` file (copy from `.env.example`):

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key |
| `VITE_CLERK_REDIRECT_URL` | ❌ | Redirect URL for Clerk auth flows |
| `VITE_CLERK_AFTER_SIGN_OUT_URL` | ❌ | Redirect URL after sign-out (default: `/`) |
| `VITE_API_BASE_URL` | ✅ | Backend API base URL (e.g. `https://your-backend.onrender.com/api`) |
| `VITE_FIREBASE_API_KEY` | ✅ | Firebase API key for notifications |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| ✅ | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | ✅ | Firebase App ID |
| `VITE_FIREBASE_VAPID_KEY` | ✅ | Firebase VAPID key for web push notifications |

> **Note:** In local development, the Vite proxy in `vite.config.js` forwards `/api` requests to `http://localhost:5002`, so `VITE_API_BASE_URL` can be left empty for local dev.

## 🚀 Running

```bash
# Install dependencies
npm install --legacy-peer-deps

# Development (hot reload on http://localhost:5173)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## 🐳 Docker

The Dockerfile uses a **multi-stage build**:

1. **Build stage** — Installs dependencies and runs `vite build`
2. **Production stage** — Serves the `dist/` folder via Nginx on port 80

```bash
docker build -t nirmitee-frontend .
docker run -p 3000:80 nirmitee-frontend
```

---

← [Back to Project Root](../README.md)
