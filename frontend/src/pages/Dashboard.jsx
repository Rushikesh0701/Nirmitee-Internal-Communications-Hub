import { useQuery } from 'react-query'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import {
  Newspaper,
  BookOpen,
  MessageSquare,
  Award,
  ClipboardList,
  GraduationCap,
  Users
} from 'lucide-react'
import { Link } from 'react-router-dom'

const Dashboard = () => {
  const { user } = useAuthStore()
  const isAdminOrModerator = ['Admin', 'Moderator'].includes(user?.Role?.name)

  const { data: stats, isLoading } = useQuery(
    'dashboard-stats',
    () => api.get('/analytics/dashboard').then((res) => res.data.data),
    { enabled: isAdminOrModerator }
  )

  const quickLinks = [
    { path: '/news', icon: Newspaper, label: 'News & Announcements', color: 'from-blue-500 to-blue-600' },
    { path: '/blogs', icon: BookOpen, label: 'Blogs', color: 'from-green-500 to-emerald-600' },
    { path: '/discussions', icon: MessageSquare, label: 'Discussions', color: 'from-purple-500 to-indigo-600' },
    { path: '/recognitions', icon: Award, label: 'Recognitions', color: 'from-yellow-500 to-orange-500' },
    { path: '/surveys', icon: ClipboardList, label: 'Surveys', color: 'from-pink-500 to-rose-600' },
    { path: '/learning', icon: GraduationCap, label: 'Learning & Development', color: 'from-indigo-500 to-purple-600' }
  ]

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Welcome Header - Responsive */}
      <div className="px-2 sm:px-0">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
          Welcome back, {user?.firstName || 'User'}!
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Here&apos;s what&apos;s happening in your organization
        </p>
      </div>

      {/* Admin Stats Cards - Responsive Grid */}
      {isAdminOrModerator && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {isLoading ? (
            // Loading Skeletons
            [...Array(4)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))
          ) : stats ? (
            <>
              <div className="card card-hover">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Total News</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                      {stats.overview?.totalNews || 0}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <Newspaper className="text-blue-600" size={28} />
                  </div>
                </div>
              </div>

              <div className="card card-hover">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Blogs</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                      {stats.overview?.totalBlogs || 0}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-xl">
                    <BookOpen className="text-green-600" size={28} />
                  </div>
                </div>
              </div>

              <div className="card card-hover">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Active Users</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                      {stats.overview?.totalUsers || 0}
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-xl">
                    <Users className="text-purple-600" size={28} />
                  </div>
                </div>
              </div>

              <div className="card card-hover">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Discussions</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                      {stats.overview?.totalDiscussions || 0}
                    </p>
                  </div>
                  <div className="bg-indigo-100 p-3 rounded-xl">
                    <MessageSquare className="text-indigo-600" size={28} />
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Quick Access Links - Responsive Grid */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 px-2 sm:px-0">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.path}
                to={link.path}
                className="card card-hover group"
              >
                <div className="flex items-center gap-4">
                  <div className={`bg-gradient-to-br ${link.color} p-3 sm:p-4 rounded-xl 
                                   shadow-md group-hover:shadow-lg transition-all duration-300`}>
                    <Icon className="text-white" size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                      {link.label}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">View all</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Content - Responsive Grid */}
      {isAdminOrModerator && stats?.recentContent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent News */}
          <div className="card">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
              <Newspaper size={20} className="text-blue-600" />
              Recent News
            </h3>
            <div className="space-y-3">
              {stats.recentContent.news?.slice(0, 5).map((news) => (
                <Link
                  key={news.id}
                  to={`/news/${news.id}`}
                  className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                >
                  <p className="font-medium text-gray-900 text-sm sm:text-base line-clamp-1">
                    {news.title}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    By {news.Author?.firstName} {news.Author?.lastName}
                  </p>
                </Link>
              ))}
              {(!stats.recentContent.news || stats.recentContent.news.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">No recent news</p>
              )}
            </div>
          </div>

          {/* Recent Blogs */}
          <div className="card">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen size={20} className="text-green-600" />
              Recent Blogs
            </h3>
            <div className="space-y-3">
              {stats.recentContent.blogs?.slice(0, 5).map((blog) => {
                const blogId = blog._id || blog.id;
                if (!blogId) return null;
                return (
                  <Link
                    key={blogId}
                    to={`/blogs/${blogId}`}
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                  >
                    <p className="font-medium text-gray-900 text-sm sm:text-base line-clamp-1">
                      {blog.title}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      By {blog.Author?.firstName} {blog.Author?.lastName}
                    </p>
                  </Link>
                );
              })}
              {(!stats.recentContent.blogs || stats.recentContent.blogs.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">No recent blogs</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
