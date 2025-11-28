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
  TrendingUp,
  Users
} from 'lucide-react'
import { Link } from 'react-router-dom'

const Dashboard = () => {
  const { user } = useAuthStore()
  const isAdminOrModerator = ['Admin', 'Moderator'].includes(user?.Role?.name)

  const { data: stats } = useQuery(
    'dashboard-stats',
    () => api.get('/analytics/dashboard').then((res) => res.data.data),
    { enabled: isAdminOrModerator }
  )

  const quickLinks = [
    { path: '/news', icon: Newspaper, label: 'News & Announcements', color: 'bg-blue-500' },
    { path: '/blogs', icon: BookOpen, label: 'Blogs', color: 'bg-green-500' },
    { path: '/discussions', icon: MessageSquare, label: 'Discussions', color: 'bg-purple-500' },
    { path: '/recognitions', icon: Award, label: 'Recognitions', color: 'bg-yellow-500' },
    { path: '/surveys', icon: ClipboardList, label: 'Surveys', color: 'bg-pink-500' },
    { path: '/learning', icon: GraduationCap, label: 'Learning & Development', color: 'bg-indigo-500' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening in your organization
        </p>
      </div>

      {isAdminOrModerator && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total News</p>
                <p className="text-2xl font-bold">{stats.overview?.totalNews || 0}</p>
              </div>
              <Newspaper className="text-blue-500" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Blogs</p>
                <p className="text-2xl font-bold">{stats.overview?.totalBlogs || 0}</p>
              </div>
              <BookOpen className="text-green-500" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{stats.overview?.totalUsers || 0}</p>
              </div>
              <Users className="text-purple-500" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Discussions</p>
                <p className="text-2xl font-bold">{stats.overview?.totalDiscussions || 0}</p>
              </div>
              <MessageSquare className="text-indigo-500" size={32} />
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.path}
                to={link.path}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className={`${link.color} p-3 rounded-lg`}>
                    <Icon className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{link.label}</h3>
                    <p className="text-sm text-gray-600">View all</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {isAdminOrModerator && stats?.recentContent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Recent News</h3>
            <div className="space-y-3">
              {stats.recentContent.news?.slice(0, 5).map((news) => (
                <Link
                  key={news.id}
                  to={`/news/${news.id}`}
                  className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium text-gray-900">{news.title}</p>
                  <p className="text-sm text-gray-600">
                    By {news.Author?.firstName} {news.Author?.lastName}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Recent Blogs</h3>
            <div className="space-y-3">
              {stats.recentContent.blogs?.slice(0, 5).map((blog) => {
                const blogId = blog._id || blog.id;
                if (!blogId) return null;
                return (
                <Link
                  key={blogId}
                  to={`/blogs/${blogId}`}
                  className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium text-gray-900">{blog.title}</p>
                  <p className="text-sm text-gray-600">
                    By {blog.Author?.firstName} {blog.Author?.lastName}
                  </p>
                </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard

