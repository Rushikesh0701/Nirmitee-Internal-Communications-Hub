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
  Users,
  ChevronRight,
  Clock,
  User,
  Megaphone
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import Loading from '../components/Loading'

const Dashboard = () => {
  const { user } = useAuthStore()
  const isAdminOrModerator = ['Admin', 'Moderator'].includes(user?.Role?.name)

  // Fetch dashboard stats for admin
  const { data: stats, isLoading: statsLoading } = useQuery(
    'dashboard-stats',
    () => api.get('/analytics/dashboard').then((res) => res.data.data),
    { enabled: isAdminOrModerator }
  )

  // Fetch latest announcements (at least 3)
  const { data: announcementsData, isLoading: announcementsLoading } = useQuery(
    'dashboard-announcements',
    () => api.get('/announcements?limit=3&sortBy=createdAt&sortOrder=desc').then((res) => res.data.data),
    { staleTime: 60000 }
  )

  // Fetch news articles
  const { data: newsData, isLoading: newsLoading } = useQuery(
    'dashboard-news',
    () => api.get('/news?limit=6&language=en').then((res) => res.data.data || res.data),
    { staleTime: 60000 }
  )

  const announcements = announcementsData?.announcements || announcementsData || []
  const newsArticles = newsData?.results || newsData?.news || []

  const quickLinks = [
    { path: '/news', icon: Newspaper, label: 'News', color: 'from-blue-500 to-blue-600' },
    { path: '/blogs', icon: BookOpen, label: 'Blogs', color: 'from-green-500 to-emerald-600' },
    { path: '/discussions', icon: MessageSquare, label: 'Discussions', color: 'from-purple-500 to-indigo-600' },
    { path: '/recognitions', icon: Award, label: 'Recognitions', color: 'from-yellow-500 to-orange-500' },
    { path: '/surveys', icon: ClipboardList, label: 'Surveys', color: 'from-pink-500 to-rose-600' },
    { path: '/learning', icon: GraduationCap, label: 'Learning & Development', color: 'from-indigo-500 to-purple-600' }
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="px-2 sm:px-0">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
          Welcome back, {user?.firstName || 'User'}!
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Here&apos;s what&apos;s happening in your organization
        </p>
      </div>

      {/* Admin Stats Cards */}
      {isAdminOrModerator && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {statsLoading ? (
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

      {/* Announcement Section - Shows 3 announcements */}
      <section className="bg-white rounded-xl border-2 border-gray-300 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-red-600 flex items-center gap-2">
            <Megaphone size={24} />
            Announcement
          </h2>
          <Link
            to="/announcements"
            className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
          >
            View All <ChevronRight size={16} />
          </Link>
        </div>
        <div className="border-2 border-gray-300 rounded-lg p-4 min-h-[200px]">
          {announcementsLoading ? (
            <div className="flex items-center justify-center h-full min-h-[150px]">
              <Loading size="md" />
            </div>
          ) : announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.slice(0, 3).map((announcement, index) => (
                <Link
                  key={announcement._id || announcement.id || index}
                  to={`/announcements/${announcement._id || announcement.id}`}
                  className={`block p-4 rounded-lg hover:bg-gray-50 transition-colors border ${
                    index === 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {announcement.title}
                        </h3>
                        {announcement.isPriority && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full flex-shrink-0">
                            Priority
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {announcement.content?.replace(/<[^>]*>/g, '') || '---'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {announcement.createdAt && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {format(new Date(announcement.createdAt), 'MMM d, yyyy')}
                          </span>
                        )}
                        {announcement.Author && (
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {announcement.Author.firstName} {announcement.Author.lastName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[150px]">
              <p className="text-gray-500">No announcements available</p>
            </div>
          )}
        </div>
      </section>

      {/* News Section */}
      <section className="bg-white rounded-xl border-2 border-gray-300 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-red-600">NEWS</h2>
          <Link
            to="/news"
            className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
          >
            View All <ChevronRight size={16} />
          </Link>
        </div>
        
        {newsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loading size="md" />
          </div>
        ) : newsArticles.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {newsArticles.slice(0, 6).map((article, index) => {
              const title = article.title
              const imageUrl = article.imageUrl || article.image_url
              const date = article.publishedAt || article.pubDate || article.createdAt
              const link = article.sourceUrl || article.link

              return (
                <div
                  key={article._id || article.article_id || `news-${index}`}
                  className="border-2 border-gray-300 rounded-lg overflow-hidden cursor-pointer 
                             hover:border-gray-400 hover:shadow-md transition-all group bg-white"
                  onClick={() => {
                    if (link) {
                      window.open(link, '_blank', 'noopener,noreferrer')
                    }
                  }}
                >
                  <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <Newspaper size={32} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 
                                   group-hover:text-red-600 transition-colors">
                      {title}
                    </h3>
                    {date && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Clock size={10} />
                        {format(new Date(date), 'MMM d')}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white"
              >
                <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                  <Newspaper size={32} className="text-gray-300" />
                </div>
                <div className="p-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Access Links */}
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
    </div>
  )
}

export default Dashboard
