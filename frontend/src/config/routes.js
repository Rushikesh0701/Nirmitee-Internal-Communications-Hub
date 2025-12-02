/**
 * Centralized route configuration
 */

import Dashboard from '../pages/Dashboard'
import NewsList from '../pages/news/NewsList'
import NewsDetail from '../pages/news/NewsDetail'
import NewsForm from '../pages/news/NewsForm'
import Blogs from '../pages/blogs/Blogs'
import BlogDetail from '../pages/blogs/BlogDetail'
import CreateBlog from '../pages/blogs/CreateBlog'
import EditBlog from '../pages/blogs/EditBlog'
import Discussions from '../pages/discussions/Discussions'
import DiscussionDetail from '../pages/discussions/DiscussionDetail'
import CreateDiscussion from '../pages/discussions/CreateDiscussion'
import DiscussionForm from '../pages/discussions/DiscussionForm'
import RecognitionsFeed from '../pages/recognitions/RecognitionsFeed'
import RecognitionForm from '../pages/recognitions/RecognitionForm'
import RewardsCatalog from '../pages/recognitions/RewardsCatalog'
import Leaderboard from '../pages/recognitions/Leaderboard'
import PointsHistory from '../pages/recognitions/PointsHistory'
import SurveysList from '../pages/surveys/SurveysList'
import SurveyDetail from '../pages/surveys/SurveyDetail'
import SurveyForm from '../pages/surveys/SurveyForm'
import LearningList from '../pages/learning/LearningList'
import CourseDetail from '../pages/learning/CourseDetail'
import CourseForm from '../pages/learning/CourseForm'
import RSSFeeds from '../pages/rss/RSSFeeds'
import Analytics from '../pages/analytics/Analytics'
import AdminRewardsManagement from '../pages/admin/AdminRewardsManagement'
import ProfilePage from '../pages/profile/ProfilePage'
import EmployeeDirectory from '../pages/directory/EmployeeDirectory'
import NotificationsPage from '../pages/notifications/NotificationsPage'
import AnnouncementsList from '../pages/announcements/AnnouncementsList'
import AnnouncementDetail from '../pages/announcements/AnnouncementDetail'
import AnnouncementForm from '../pages/announcements/AnnouncementForm'
import GroupsList from '../pages/groups/GroupsList'
import GroupDetail from '../pages/groups/GroupDetail'
import GroupForm from '../pages/groups/GroupForm'
import SurveyAnalytics from '../pages/surveys/SurveyAnalytics'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'

export const publicRoutes = [
  { path: '/login', component: Login },
  { path: '/register', component: Register }
]

export const protectedRoutes = [
  { path: '/dashboard', component: Dashboard },
  { path: '/news', component: NewsList },
  { path: '/news/:id', component: NewsDetail },
  { path: '/news/new', component: NewsForm, admin: true },
  { path: '/news/:id/edit', component: NewsForm, admin: true },
  { path: '/announcements', component: AnnouncementsList },
  { path: '/announcements/new', component: AnnouncementForm, admin: true },
  { path: '/announcements/:id', component: AnnouncementDetail },
  { path: '/announcements/:id/edit', component: AnnouncementForm, admin: true },
  { path: '/blogs', component: Blogs },
  { path: '/blogs/create', component: CreateBlog },
  { path: '/blogs/new', component: CreateBlog },
  { path: '/blogs/:id', component: BlogDetail },
  { path: '/blogs/:id/edit', component: EditBlog },
  { path: '/discussions', component: Discussions },
  { path: '/discussions/create', component: CreateDiscussion },
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
  { path: '/rss', component: RSSFeeds },
  { path: '/analytics', component: Analytics, admin: true },
  { path: '/admin/rewards', component: AdminRewardsManagement, admin: true },
  { path: '/profile', component: ProfilePage },
  { path: '/profile/:id', component: ProfilePage },
  { path: '/directory', component: EmployeeDirectory },
  { path: '/notifications', component: NotificationsPage },
  { path: '/groups', component: GroupsList },
  { path: '/groups/new', component: GroupForm, admin: true },
  { path: '/groups/:id', component: GroupDetail },
  { path: '/groups/:id/edit', component: GroupForm, admin: true },
]

