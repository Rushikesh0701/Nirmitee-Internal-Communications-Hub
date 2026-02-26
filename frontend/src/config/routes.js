/**
 * Centralized route configuration with code splitting
 */

import { lazy } from 'react'

// Lazy load all page components for code splitting
const Dashboard = lazy(() => import('../pages/Dashboard'))
const NewsList = lazy(() => import('../pages/news/NewsList'))
const NewsDetail = lazy(() => import('../pages/news/NewsDetail'))
const Blogs = lazy(() => import('../pages/blogs/Blogs'))
const BlogDetail = lazy(() => import('../pages/blogs/BlogDetail'))
const CreateBlog = lazy(() => import('../pages/blogs/CreateBlog'))
const EditBlog = lazy(() => import('../pages/blogs/EditBlog'))
const Discussions = lazy(() => import('../pages/discussions/Discussions'))
const DiscussionDetail = lazy(() => import('../pages/discussions/DiscussionDetail'))
const CreateDiscussion = lazy(() => import('../pages/discussions/CreateDiscussion'))
const DiscussionForm = lazy(() => import('../pages/discussions/DiscussionForm'))
const RecognitionsFeed = lazy(() => import('../pages/recognitions/RecognitionsFeed'))
const RecognitionForm = lazy(() => import('../pages/recognitions/RecognitionForm'))
const RewardsCatalog = lazy(() => import('../pages/recognitions/RewardsCatalog'))
const Leaderboard = lazy(() => import('../pages/recognitions/Leaderboard'))
const PointsHistory = lazy(() => import('../pages/recognitions/PointsHistory'))
const SurveysList = lazy(() => import('../pages/surveys/SurveysList'))
const SurveyDetail = lazy(() => import('../pages/surveys/SurveyDetail'))
const SurveyForm = lazy(() => import('../pages/surveys/SurveyForm'))
const LearningList = lazy(() => import('../pages/learning/LearningList'))
const CourseDetail = lazy(() => import('../pages/learning/CourseDetail'))
const CourseForm = lazy(() => import('../pages/learning/CourseForm'))
const Analytics = lazy(() => import('../pages/analytics/Analytics'))
const AdminRewardsManagement = lazy(() => import('../pages/admin/AdminRewardsManagement'))
const RssManagement = lazy(() => import('../pages/admin/RssManagement'))
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'))
const EmployeeDirectory = lazy(() => import('../pages/directory/EmployeeDirectory'))
const NotificationsPage = lazy(() => import('../pages/notifications/NotificationsPage'))
const AnnouncementsList = lazy(() => import('../pages/announcements/AnnouncementsList'))
const AnnouncementDetail = lazy(() => import('../pages/announcements/AnnouncementDetail'))
const AnnouncementForm = lazy(() => import('../pages/announcements/AnnouncementForm'))
const GroupsList = lazy(() => import('../pages/groups/GroupsList'))
const GroupDetail = lazy(() => import('../pages/groups/GroupDetail'))
const GroupForm = lazy(() => import('../pages/groups/GroupForm'))
const SurveyAnalytics = lazy(() => import('../pages/surveys/SurveyAnalytics'))
const ModerationDashboard = lazy(() => import('../pages/moderation/ModerationDashboard'))
const BlogModeration = lazy(() => import('../pages/moderation/BlogModeration'))
const AnnouncementModeration = lazy(() => import('../pages/moderation/AnnouncementModeration'))
const AdminAnalytics = lazy(() => import('../pages/analytics/AdminAnalytics'))
const CertificateView = lazy(() => import('../pages/learning/CertificateView'))
const RedemptionManagement = lazy(() => import('../pages/admin/RedemptionManagement'))
const RedemptionHistory = lazy(() => import('../pages/recognitions/RedemptionHistory'))
const BlogAnalytics = lazy(() => import('../pages/blogs/BlogAnalytics'))
const DiscussionAnalytics = lazy(() => import('../pages/discussions/DiscussionAnalytics'))
const GroupAnalytics = lazy(() => import('../pages/groups/GroupAnalytics'))
const MyProgress = lazy(() => import('../pages/learning/MyProgress'))
const MyCertificates = lazy(() => import('../pages/learning/MyCertificates'))
const MentorshipDashboard = lazy(() => import('../pages/learning/MentorshipDashboard'))
const SearchResults = lazy(() => import('../pages/search/SearchResults'))
const ActivityFeed = lazy(() => import('../pages/activity/ActivityFeed'))
const Settings = lazy(() => import('../pages/settings/Settings'))
const Login = lazy(() => import('../pages/auth/Login'))
const Register = lazy(() => import('../pages/auth/Register'))
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'))
const PollsList = lazy(() => import('../pages/polls/PollsList'))
const PollForm = lazy(() => import('../pages/polls/PollForm'))
const FeedbackSubmit = lazy(() => import('../pages/feedback/FeedbackSubmit'))
const FeedbackDashboard = lazy(() => import('../pages/feedback/FeedbackDashboard'))
const AdminActivityDashboard = lazy(() => import('../pages/admin/AdminActivityDashboard'))

export const publicRoutes = [
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/forgot-password', component: ForgotPassword },
  { path: '/reset-password/:token', component: ResetPassword }
]

export const protectedRoutes = [
  { path: '/dashboard', component: Dashboard },
  { path: '/news', component: NewsList },
  { path: '/news/:id', component: NewsDetail },
  { path: '/announcements', component: AnnouncementsList },
  { path: '/announcements/new', component: AnnouncementForm, admin: true },
  { path: '/announcements/:id', component: AnnouncementDetail },
  { path: '/announcements/:id/edit', component: AnnouncementForm, admin: true },
  { path: '/blogs', component: Blogs },
  { path: '/blogs/create', component: CreateBlog },
  { path: '/blogs/new', component: CreateBlog },
  { path: '/blogs/:id', component: BlogDetail },
  { path: '/blogs/:id/analytics', component: BlogAnalytics },
  { path: '/blogs/:id/edit', component: EditBlog },
  { path: '/discussions', component: Discussions },
  { path: '/discussions/create', component: CreateDiscussion },
  { path: '/discussions/analytics', component: DiscussionAnalytics },
  { path: '/discussions/:id', component: DiscussionDetail },
  { path: '/discussions/:id/edit', component: DiscussionForm },
  { path: '/recognitions', component: RecognitionsFeed },
  { path: '/recognitions/new', component: RecognitionForm },
  { path: '/recognitions/rewards', component: RewardsCatalog },
  { path: '/recognitions/leaderboard', component: Leaderboard },
  { path: '/recognitions/points', component: PointsHistory },
  { path: '/surveys', component: SurveysList },
  { path: '/surveys/create', component: SurveyForm, admin: true },
  { path: '/surveys/:id', component: SurveyDetail },
  { path: '/surveys/:id/edit', component: SurveyForm, admin: true },
  { path: '/surveys/:id/analytics', component: SurveyAnalytics, admin: true },
  { path: '/learning', component: LearningList },
  { path: '/learning/new', component: CourseForm, admin: true },
  { path: '/learning/:id', component: CourseDetail },
  { path: '/learning/:id/edit', component: CourseForm, admin: true },

  { path: '/analytics', component: Analytics, admin: true },
  { path: '/admin/analytics', component: AdminAnalytics, admin: true },
  { path: '/moderation', component: ModerationDashboard, admin: true },
  { path: '/moderation/blogs', component: BlogModeration, admin: true },
  { path: '/moderation/announcements', component: AnnouncementModeration, admin: true },
  { path: '/admin/rewards', component: AdminRewardsManagement, admin: true },
  { path: '/admin/redemptions', component: RedemptionManagement, admin: true },
  { path: '/admin/rss', component: RssManagement, admin: true },
  { path: '/learning/certificates/:certificateNumber', component: CertificateView },
  { path: '/recognitions/redemptions', component: RedemptionHistory },
  { path: '/profile', component: ProfilePage },
  { path: '/profile/:id', component: ProfilePage },
  { path: '/directory', component: EmployeeDirectory },
  { path: '/notifications', component: NotificationsPage },
  { path: '/groups', component: GroupsList },
  { path: '/groups/new', component: GroupForm, admin: true },
  { path: '/groups/:id', component: GroupDetail },
  { path: '/groups/:id/analytics', component: GroupAnalytics },
  { path: '/groups/:id/edit', component: GroupForm, admin: true },
  { path: '/learning/my-progress', component: MyProgress },
  { path: '/learning/my-certificates', component: MyCertificates },
  { path: '/learning/mentorships', component: MentorshipDashboard },
  { path: '/search', component: SearchResults },
  { path: '/activity', component: ActivityFeed },
  { path: '/settings', component: Settings },
  { path: '/polls', component: PollsList },
  { path: '/polls/create', component: PollForm },
  { path: '/feedback', component: FeedbackSubmit },
  { path: '/admin/feedback', component: FeedbackDashboard, admin: true },
  { path: '/admin/activity-dashboard', component: AdminActivityDashboard, admin: true },
]

