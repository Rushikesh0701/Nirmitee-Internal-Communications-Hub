import { useQuery } from 'react-query'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { useTheme } from '../contexts/ThemeContext'
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
  Megaphone,
  TrendingUp,
  ArrowUpRight,
  Zap
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import Loading from '../components/Loading'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
}

const Dashboard = () => {
  const { user } = useAuthStore()
  const { theme } = useTheme()
  const isAdminOrModerator = ['Admin', 'Moderator'].includes(user?.Role?.name)

  const { data: stats, isLoading: statsLoading } = useQuery(
    'dashboard-stats',
    () => api.get('/analytics/dashboard').then((res) => res.data.data),
    { enabled: isAdminOrModerator }
  )

  const { data: announcementsData, isLoading: announcementsLoading } = useQuery(
    'dashboard-announcements',
    () => api.get('/announcements?limit=3&sortBy=createdAt&sortOrder=desc').then((res) => res.data.data),
    { staleTime: 60000 }
  )

  const { data: newsData, isLoading: newsLoading } = useQuery(
    'dashboard-news',
    () => api.get('/news?limit=6&language=en').then((res) => res.data.data || res.data),
    { staleTime: 60000 }
  )

  const announcements = announcementsData?.announcements || announcementsData || []
  const newsArticles = newsData?.results || newsData?.news || []

  const quickLinks = [
    { path: '/news', icon: Newspaper, label: 'News', gradient: 'from-blue-500 to-cyan-500' },
    { path: '/blogs', icon: BookOpen, label: 'Blogs', gradient: 'from-emerald-500 to-teal-500' },
    { path: '/discussions', icon: MessageSquare, label: 'Discussions', gradient: 'from-violet-500 to-purple-500' },
    { path: '/recognitions', icon: Award, label: 'Recognitions', gradient: 'from-amber-500 to-orange-500' },
    { path: '/surveys', icon: ClipboardList, label: 'Surveys', gradient: 'from-rose-500 to-pink-500' },
    { path: '/learning', icon: GraduationCap, label: 'Learning', gradient: 'from-indigo-500 to-blue-500' }
  ]

  const statCards = [
    { label: 'Total News', value: stats?.overview?.totalNews || 0, icon: Newspaper, gradient: 'from-blue-500 to-cyan-500' },
    { label: 'Total Blogs', value: stats?.overview?.totalBlogs || 0, icon: BookOpen, gradient: 'from-emerald-500 to-teal-500' },
    { label: 'Active Users', value: stats?.overview?.totalUsers || 0, icon: Users, gradient: 'from-violet-500 to-purple-500' },
    { label: 'Discussions', value: stats?.overview?.totalDiscussions || 0, icon: MessageSquare, gradient: 'from-indigo-500 to-blue-500' }
  ]

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning !!'
    if (hour < 17) return 'Good afternoon !!'
    return 'Good evening !!'
  }

  return (
    <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="visible">
      {/* Welcome Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-lg border transition-colors ${
            theme === 'dark' 
              ? 'bg-indigo-900/30 border-indigo-700/50' 
              : 'bg-indigo-100 border-indigo-200'
          }`}>
            <Zap size={14} className={theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} />
          </div>
          <span className={`text-sm font-medium transition-colors ${
            theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'
          }`}>{getGreeting()}</span>
        </div>
        <h1 className={`text-3xl sm:text-4xl font-bold transition-colors ${
          theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
        }`}>
          Welcome back, <span className="text-gradient">{user?.displayName || user?.name || user?.firstName || 'User'}</span>!
        </h1>
        <p className={`mt-2 transition-colors ${
          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
        }`}>Here&apos;s what&apos;s happening in your organization today</p>
      </motion.div>

      {/* Admin Stats Cards */}
      {isAdminOrModerator && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className={`h-16 rounded-xl transition-colors ${
                  theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-100'
                }`} />
              </div>
            ))
          ) : stats ? (
            statCards.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  className="card group hover:shadow-lg"
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium transition-colors ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>{stat.label}</p>
                      <motion.p 
                        className={`text-3xl font-bold mt-1 transition-colors ${
                          theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                        }`}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
                      >
                        {stat.value.toLocaleString()}
                      </motion.p>
                      <div className="flex items-center gap-1 mt-2">
                        <TrendingUp size={12} className="text-emerald-500" />
                        <span className="text-xs text-emerald-500 font-medium">Active</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                      <Icon className="text-white" size={24} />
                    </div>
                  </div>
                </motion.div>
              )
            })
          ) : null}
        </motion.div>
      )}

      {/* Announcement Section */}
      <motion.section variants={itemVariants} className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
              <Megaphone size={20} className="text-white" />
            </div>
            <h2 className={`text-xl font-bold transition-colors ${
              theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
            }`}>Announcements</h2>
          </div>
          <Link to="/announcements" className={`flex items-center gap-1 font-medium text-sm group transition-colors ${
            theme === 'dark' 
              ? 'text-indigo-400 hover:text-indigo-300' 
              : 'text-indigo-600 hover:text-indigo-700'
          }`}>
            View All <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
        
        <div className="min-h-[200px]">
          {announcementsLoading ? (
            <div className="flex items-center justify-center h-full min-h-[150px]">
              <Loading size="md" />
            </div>
          ) : announcements.length > 0 ? (
            <div className="space-y-3">
              {announcements.slice(0, 3).map((announcement, index) => (
                <motion.div
                  key={announcement._id || announcement.id || index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={`/announcements/${announcement._id || announcement.id}`}
                    className={`block p-4 rounded-xl transition-all border group ${
                      index === 0 
                        ? theme === 'dark'
                          ? 'border-indigo-700/50 bg-indigo-900/20 hover:bg-indigo-900/30'
                          : 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100'
                        : theme === 'dark'
                          ? 'border-slate-700/50 hover:border-indigo-700/50 hover:bg-slate-800/50'
                          : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className={`text-base font-semibold truncate transition-colors ${
                            theme === 'dark'
                              ? 'text-slate-200 group-hover:text-indigo-400'
                              : 'text-slate-800 group-hover:text-indigo-600'
                          }`}>
                            {announcement.title}
                          </h3>
                          {announcement.isPriority && (
                            <span className="badge badge-warning">Priority</span>
                          )}
                        </div>
                        <p className={`text-sm line-clamp-2 transition-colors ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          {announcement.content?.replace(/<[^>]*>/g, '') || '---'}
                        </p>
                        <div className={`flex items-center gap-4 mt-2.5 text-xs transition-colors ${
                          theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                        }`}>
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
                      <ChevronRight size={18} className={`flex-shrink-0 mt-1 transition-colors ${
                        theme === 'dark'
                          ? 'text-slate-600 group-hover:text-indigo-400'
                          : 'text-slate-300 group-hover:text-indigo-500'
                      }`} />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className={`flex flex-col items-center justify-center h-full min-h-[150px] transition-colors ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <Megaphone size={32} className="mb-2 opacity-50" />
              <p>No announcements available</p>
            </div>
          )}
        </div>
      </motion.section>

      {/* News Section */}
      <motion.section variants={itemVariants} className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
              <Newspaper size={20} className="text-white" />
            </div>
            <h2 className={`text-xl font-bold transition-colors ${
              theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
            }`}>Latest News</h2>
          </div>
          <Link to="/news" className={`flex items-center gap-1 font-medium text-sm group transition-colors ${
            theme === 'dark'
              ? 'text-blue-400 hover:text-blue-300'
              : 'text-blue-600 hover:text-blue-700'
          }`}>
            View All <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
        
        {newsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loading size="md" />
          </div>
        ) : newsArticles.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {newsArticles.slice(0, 6).map((article, index) => {
              const title = article.title
              const imageUrl = article.imageUrl || article.image_url
              const date = article.publishedAt || article.pubDate || article.createdAt
              const link = article.sourceUrl || article.link

              return (
                <motion.div
                  key={article._id || article.article_id || `news-${index}`}
                  className="group cursor-pointer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  onClick={() => link && window.open(link, '_blank', 'noopener,noreferrer')}
                >
                  <div className={`rounded-xl overflow-hidden border transition-all ${
                    theme === 'dark'
                      ? 'border-slate-700/50 bg-slate-800/50 hover:border-blue-600/50 hover:shadow-md'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'
                  }`}>
                    <div className={`aspect-[4/3] relative overflow-hidden transition-colors ${
                      theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-100'
                    }`}>
                      {imageUrl ? (
                        <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.style.display = 'none' }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Newspaper size={24} className={theme === 'dark' ? 'text-slate-600' : 'text-slate-300'} />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className={`text-sm font-medium line-clamp-2 transition-colors ${
                        theme === 'dark'
                          ? 'text-slate-200 group-hover:text-blue-400'
                          : 'text-slate-700 group-hover:text-blue-600'
                      }`}>{title}</h3>
                      {date && (
                        <p className={`text-xs mt-1.5 flex items-center gap-1 transition-colors ${
                          theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          <Clock size={10} />
                          {format(new Date(date), 'MMM d')}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`rounded-xl overflow-hidden border transition-colors ${
                theme === 'dark'
                  ? 'border-slate-700/50 bg-slate-800/50'
                  : 'border-slate-200 bg-white'
              }`}>
                <div className={`aspect-[4/3] transition-colors ${
                  theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-100'
                }`} />
                <div className="p-3">
                  <div className={`h-4 rounded w-3/4 mb-2 transition-colors ${
                    theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-100'
                  }`} />
                  <div className={`h-3 rounded w-1/2 transition-colors ${
                    theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-50'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Quick Access Links */}
      <motion.div variants={itemVariants}>
        <h2 className={`text-xl font-bold mb-4 transition-colors ${
          theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
        }`}>Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link, index) => {
            const Icon = link.icon
            return (
              <motion.div
                key={link.path}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <Link
                  to={link.path}
                  className={`flex items-center gap-4 p-5 rounded-2xl border transition-all group ${
                    theme === 'dark'
                      ? 'bg-slate-800/50 border-slate-700/50 hover:border-indigo-700/50 hover:shadow-md'
                      : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-md'
                  }`}
                >
                  <div className={`bg-gradient-to-br ${link.gradient} p-3.5 rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="text-white" size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold transition-colors ${
                      theme === 'dark'
                        ? 'text-slate-200 group-hover:text-indigo-400'
                        : 'text-slate-700 group-hover:text-indigo-600'
                    }`}>{link.label}</h3>
                    <p className={`text-sm transition-colors ${
                      theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                    }`}>View all →</p>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Dashboard
