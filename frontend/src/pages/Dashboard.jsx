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
  Zap,
  Sparkles,
  Activity
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import Loading from '../components/Loading'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
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

  const getUserDisplayName = () => {
    if (!user) return 'User'
    
    // Combine firstName and lastName if both exist
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    
    // Fallback to other name fields
    return user.displayName || user.name || user.firstName || 'User'
  }

  return (
    <div className="relative min-h-screen">
      {/* Futuristic Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className={`absolute inset-0 transition-opacity duration-1000 ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-[#0a0e17] via-[#0f172a] to-[#1e1b4b]' 
            : 'bg-gradient-to-br from-[#ebf3ff] via-[#f0f4ff] to-[#f5f7ff]'
        }`} />
        <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl transition-opacity duration-1000 ${
          theme === 'dark' 
            ? 'bg-indigo-500/20' 
            : 'bg-indigo-400/30'
        }`} />
        <div className={`absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl transition-opacity duration-1000 ${
          theme === 'dark' 
            ? 'bg-purple-500/20' 
            : 'bg-purple-400/30'
        }`} />
      </div>

      <motion.div className="relative space-y-4" variants={containerVariants} initial="hidden" animate="visible">
        {/* Enhanced Welcome Header */}
        <motion.div variants={itemVariants} className="relative">
          <div className={`relative backdrop-blur-xl rounded-xl p-4 border transition-all duration-500 ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 border-slate-700/50 shadow-2xl shadow-indigo-500/10'
              : 'bg-gradient-to-br from-white/90 via-white/80 to-indigo-50/50 border-slate-200/50 shadow-xl shadow-indigo-500/5'
          }`}>
            {/* Animated background gradient */}
            <div className={`absolute inset-0 rounded-xl opacity-50 transition-opacity duration-1000 ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10'
                : 'bg-gradient-to-r from-indigo-100/30 via-purple-100/30 to-pink-100/30'
            }`} />
            
            <div className="relative z-10">
              <motion.div 
                className="flex items-center gap-2 mb-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div 
                  className={`p-2 rounded-lg backdrop-blur-sm border transition-all duration-300 ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/30 shadow-lg shadow-indigo-500/20' 
                      : 'bg-gradient-to-br from-indigo-100 to-purple-100 border-indigo-200 shadow-md'
                  }`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Sparkles size={16} className={theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} />
                </motion.div>
                <motion.span 
                  className={`text-xs font-semibold tracking-wide transition-colors ${
                    theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {getGreeting()}
                </motion.span>
              </motion.div>
              
              <motion.h1 
                className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-2 transition-colors ${
                  theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Welcome back,{' '}
                <span className="relative inline-block">
                  <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                    {getUserDisplayName()}
                  </span>
                  <motion.span
                    className={`absolute -bottom-1 left-0 right-0 h-0.5 ${
                      theme === 'dark' 
                        ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500' 
                        : 'bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400'
                    }`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                  />
                </span>
                !
              </motion.h1>
              
              <motion.p 
                className={`text-sm transition-colors ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                Here&apos;s what&apos;s happening in your organization today
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Admin Stats Cards */}
        {isAdminOrModerator && (
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {statsLoading ? (
              [...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  variants={cardVariants}
                  className={`relative h-24 rounded-xl backdrop-blur-xl border animate-pulse transition-colors ${
                    theme === 'dark' 
                      ? 'bg-slate-800/50 border-slate-700/50' 
                      : 'bg-white/60 border-slate-200/50'
                  }`}
                />
              ))
            ) : stats ? (
              statCards.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <motion.div
                    key={stat.label}
                    variants={cardVariants}
                    custom={index}
                    className={`group relative h-24 rounded-xl backdrop-blur-xl border overflow-hidden transition-all duration-500 ${
                      theme === 'dark'
                        ? 'bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-900/80 border-slate-700/50 shadow-xl shadow-indigo-500/10'
                        : 'bg-gradient-to-br from-white/90 via-white/80 to-white/60 border-slate-200/50 shadow-lg shadow-indigo-500/5'
                    }`}
                    whileHover={{ 
                      y: -4, 
                      scale: 1.02,
                      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
                    }}
                  >
                    {/* Animated gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                    
                    {/* Glowing border effect on hover */}
                    <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                      theme === 'dark'
                        ? 'bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20'
                        : 'bg-gradient-to-r from-indigo-100/50 via-purple-100/50 to-pink-100/50'
                    }`} />
                    
                    <div className="relative z-10 h-full flex flex-col justify-between p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-xs font-semibold uppercase tracking-wider mb-1 transition-colors ${
                            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {stat.label}
                          </p>
                          <motion.p 
                            className={`text-xl font-bold transition-colors ${
                              theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                            }`}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + index * 0.1, type: "spring", stiffness: 200 }}
                          >
                            {stat.value.toLocaleString()}
                          </motion.p>
                        </div>
                        <motion.div 
                          className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}
                          whileHover={{ rotate: 5 }}
                        >
                          <Icon className="text-white" size={16} />
                        </motion.div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 mt-1">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Activity size={10} className="text-emerald-500" />
                        </motion.div>
                        <span className="text-xs font-semibold text-emerald-500">Live</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            ) : null}
          </motion.div>
        )}

        {/* Enhanced Announcement Section */}
        <motion.section variants={itemVariants}>
          <div className={`relative backdrop-blur-xl rounded-xl p-4 border transition-all duration-500 ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 border-slate-700/50 shadow-2xl shadow-purple-500/10'
              : 'bg-gradient-to-br from-white/90 via-white/80 to-purple-50/30 border-slate-200/50 shadow-xl shadow-purple-500/5'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <motion.div 
                  className="p-2 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 shadow-lg shadow-purple-500/30"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Megaphone size={18} className="text-white" />
                </motion.div>
                <div>
                  <h2 className={`text-lg sm:text-xl font-bold transition-colors ${
                    theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                  }`}>
                    Announcements
                  </h2>
                  <p className={`text-xs mt-0.5 transition-colors ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Latest updates from your organization
                  </p>
                </div>
              </div>
              <Link 
                to="/announcements" 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-xs group transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'text-indigo-400 hover:text-white hover:bg-indigo-500/20 border border-indigo-500/30' 
                    : 'text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200'
                }`}
              >
                View All 
                <ArrowUpRight size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>
            </div>
            
            <div className="min-h-[120px]">
              {announcementsLoading ? (
                <div className="flex items-center justify-center h-full min-h-[100px]">
                  <Loading size="md" />
                </div>
              ) : announcements.length > 0 ? (
                <div className="space-y-2">
                  {announcements.slice(0, 3).map((announcement, index) => (
                    <motion.div
                      key={announcement._id || announcement.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                    >
                      <Link
                        to={`/announcements/${announcement._id || announcement.id}`}
                        className={`group relative block p-3 rounded-lg backdrop-blur-sm border transition-all duration-300 overflow-hidden ${
                          index === 0 
                            ? theme === 'dark'
                              ? 'bg-gradient-to-r from-indigo-900/40 via-indigo-800/30 to-transparent border-indigo-700/50 hover:border-indigo-600/70 hover:shadow-lg hover:shadow-indigo-500/20'
                              : 'bg-gradient-to-r from-indigo-50 via-indigo-50/50 to-transparent border-indigo-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10'
                            : theme === 'dark'
                              ? 'bg-slate-800/40 border-slate-700/50 hover:border-indigo-700/50 hover:bg-slate-800/60 hover:shadow-lg hover:shadow-indigo-500/10'
                              : 'bg-white/60 border-slate-200 hover:border-indigo-200 hover:bg-white/80 hover:shadow-lg hover:shadow-indigo-500/5'
                        }`}
                      >
                        {/* Hover gradient effect */}
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                          theme === 'dark'
                            ? 'bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent'
                            : 'bg-gradient-to-r from-indigo-100/30 via-purple-100/30 to-transparent'
                        }`} />
                        
                        <div className="relative z-10 flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`text-sm font-bold truncate transition-colors ${
                                theme === 'dark'
                                  ? 'text-slate-100 group-hover:text-indigo-400'
                                  : 'text-slate-900 group-hover:text-indigo-600'
                              }`}>
                                {announcement.title}
                              </h3>
                              {announcement.isPriority && (
                                <motion.span 
                                  className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg"
                                  whileHover={{ scale: 1.1 }}
                                >
                                  Priority
                                </motion.span>
                              )}
                            </div>
                            <p className={`text-xs line-clamp-2 mb-2 transition-colors ${
                              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                              {announcement.content?.replace(/<[^>]*>/g, '') || '---'}
                            </p>
                            <div className={`flex items-center gap-3 text-[10px] transition-colors ${
                              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                            }`}>
                              {announcement.createdAt && (
                                <span className="flex items-center gap-1">
                                  <Clock size={10} />
                                  {format(new Date(announcement.createdAt), 'MMM d, yyyy')}
                                </span>
                              )}
                              {announcement.Author && (
                                <span className="flex items-center gap-1">
                                  <User size={10} />
                                  {announcement.Author.firstName} {announcement.Author.lastName}
                                </span>
                              )}
                            </div>
                          </div>
                          <motion.div
                            className="flex-shrink-0"
                            whileHover={{ x: 5 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            <ChevronRight size={16} className={`transition-colors ${
                              theme === 'dark'
                                ? 'text-slate-600 group-hover:text-indigo-400'
                                : 'text-slate-300 group-hover:text-indigo-500'
                            }`} />
                          </motion.div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className={`flex flex-col items-center justify-center h-full min-h-[120px] transition-colors ${
                  theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  <Megaphone size={32} className="mb-2 opacity-30" />
                  <p className="text-xs font-medium">No announcements available</p>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Enhanced News Section */}
        <motion.section variants={itemVariants}>
          <div className={`relative backdrop-blur-xl rounded-xl p-4 border transition-all duration-500 ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 border-slate-700/50 shadow-2xl shadow-blue-500/10'
              : 'bg-gradient-to-br from-white/90 via-white/80 to-blue-50/30 border-slate-200/50 shadow-xl shadow-blue-500/5'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <motion.div 
                  className="p-2 rounded-lg bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 shadow-lg shadow-blue-500/30"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Newspaper size={18} className="text-white" />
                </motion.div>
                <div>
                  <h2 className={`text-lg sm:text-xl font-bold transition-colors ${
                    theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                  }`}>
                    Latest News
                  </h2>
                  <p className={`text-xs mt-0.5 transition-colors ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Stay updated with trending stories
                  </p>
                </div>
              </div>
              <Link 
                to="/news" 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-xs group transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'text-blue-400 hover:text-white hover:bg-blue-500/20 border border-blue-500/30' 
                    : 'text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200'
                }`}
              >
                View All 
                <ArrowUpRight size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>
            </div>
            
            {newsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loading size="md" />
              </div>
            ) : newsArticles.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 items-stretch">
                {newsArticles.slice(0, 6).map((article, index) => {
                  const title = article.title
                  const imageUrl = article.imageUrl || article.image_url
                  const date = article.publishedAt || article.pubDate || article.createdAt
                  const link = article.sourceUrl || article.link

                  return (
                    <motion.div
                      key={article._id || article.article_id || `news-${index}`}
                      className="group cursor-pointer h-full"
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ y: -4, scale: 1.02 }}
                    >
                      <div 
                        className={`relative rounded-lg overflow-hidden border backdrop-blur-sm transition-all duration-500 h-full flex flex-col ${
                          theme === 'dark'
                            ? 'bg-slate-800/60 border-slate-700/50 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/20'
                            : 'bg-white/80 border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10'
                        }`}
                        onClick={() => link && window.open(link, '_blank', 'noopener,noreferrer')}
                      >
                        {/* Gradient overlay on hover */}
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 ${
                          theme === 'dark'
                            ? 'bg-gradient-to-t from-blue-500/20 via-transparent to-transparent'
                            : 'bg-gradient-to-t from-blue-100/30 via-transparent to-transparent'
                        }`} />
                        
                        <div className={`aspect-[4/3] relative overflow-hidden flex-shrink-0 ${
                          theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-100'
                        }`}>
                          {imageUrl ? (
                            <motion.img 
                              src={imageUrl} 
                              alt={title} 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const placeholder = e.target.parentElement?.querySelector('.news-placeholder');
                                if (placeholder) placeholder.classList.remove('hidden');
                              }}
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.5 }}
                            />
                          ) : null}
                          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 news-placeholder ${imageUrl ? 'hidden' : ''}`}>
                            <Newspaper size={20} className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} />
                          </div>
                        </div>
                        <div className="relative z-10 p-2 flex flex-col flex-1 min-h-[60px]">
                          <h3 className={`text-xs font-bold line-clamp-2 mb-1 transition-colors flex-shrink-0 ${
                            theme === 'dark'
                              ? 'text-slate-100 group-hover:text-blue-400'
                              : 'text-slate-900 group-hover:text-blue-600'
                          }`}>
                            {title}
                          </h3>
                          <div className="mt-auto">
                            {date && (
                              <p className={`text-[10px] flex items-center gap-1 transition-colors ${
                                theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                              }`}>
                                <Clock size={9} />
                                {format(new Date(date), 'MMM d')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 items-stretch">
                {[...Array(6)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`rounded-lg overflow-hidden border backdrop-blur-sm animate-pulse ${
                      theme === 'dark'
                        ? 'border-slate-700/50 bg-slate-800/50'
                        : 'border-slate-200 bg-white/60'
                    }`}
                  >
                    <div className={`aspect-[4/3] ${
                      theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-100'
                    }`} />
                    <div className="p-2">
                      <div className={`h-3 rounded w-3/4 mb-1 ${
                        theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-100'
                      }`} />
                      <div className={`h-2 rounded w-1/2 ${
                        theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-50'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.section>

        {/* Enhanced Quick Access Links */}
        <motion.div variants={itemVariants}>
          <div className="mb-3">
            <h2 className={`text-lg sm:text-xl font-bold mb-1 transition-colors ${
              theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
            }`}>
              Quick Access
            </h2>
            <p className={`text-xs transition-colors ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Navigate to your favorite sections instantly
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickLinks.map((link, index) => {
              const Icon = link.icon
              return (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    to={link.path}
                    className={`group relative flex items-center gap-3 p-3 rounded-xl backdrop-blur-xl border overflow-hidden transition-all duration-500 ${
                      theme === 'dark'
                        ? 'bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-900/80 border-slate-700/50 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/20'
                        : 'bg-gradient-to-br from-white/90 via-white/80 to-white/60 border-slate-200/50 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10'
                    }`}
                  >
                    {/* Animated gradient background on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${link.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                    
                    {/* Glowing border effect */}
                    <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                      theme === 'dark'
                        ? 'bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20'
                        : 'bg-gradient-to-r from-indigo-100/50 via-purple-100/50 to-pink-100/50'
                    }`} />
                    
                    <motion.div 
                      className={`relative z-10 bg-gradient-to-br ${link.gradient} p-2 rounded-lg shadow-lg group-hover:shadow-xl transition-all duration-300`}
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Icon className="text-white" size={18} />
                    </motion.div>
                    
                    <div className="relative z-10 flex-1 min-w-0">
                      <h3 className={`font-bold text-sm mb-0.5 transition-colors ${
                        theme === 'dark'
                          ? 'text-slate-100 group-hover:text-white'
                          : 'text-slate-900 group-hover:text-white'
                      }`}>
                        {link.label}
                      </h3>
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] font-medium transition-colors ${
                          theme === 'dark'
                            ? 'text-slate-400 group-hover:text-white/80'
                            : 'text-slate-500 group-hover:text-white/80'
                        }`}>
                          Explore
                        </span>
                        <motion.div
                          animate={{ x: [0, 4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <ArrowUpRight 
                            size={10} 
                            className={`transition-colors ${
                              theme === 'dark'
                                ? 'text-slate-400 group-hover:text-white'
                                : 'text-slate-500 group-hover:text-white'
                            }`} 
                          />
                        </motion.div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Dashboard
