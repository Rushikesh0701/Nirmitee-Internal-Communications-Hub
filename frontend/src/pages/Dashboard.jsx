import { useQuery } from 'react-query'
import { useMemo, useCallback, memo } from 'react'
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
import EmptyState from '../components/EmptyState'

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

  const quickLinks = useMemo(() => [
    { path: '/news', icon: Newspaper, label: 'News' },
    { path: '/blogs', icon: BookOpen, label: 'Blogs' },
    { path: '/discussions', icon: MessageSquare, label: 'Discussions' },
    { path: '/recognitions', icon: Award, label: 'Recognitions' },
    { path: '/surveys', icon: ClipboardList, label: 'Surveys' },
    { path: '/learning', icon: GraduationCap, label: 'Learning' }
  ], [])

  const statCards = useMemo(() => [
    { label: 'Total News', value: stats?.overview?.totalNews || 0, icon: Newspaper },
    { label: 'Total Blogs', value: stats?.overview?.totalBlogs || 0, icon: BookOpen },
    { label: 'Active Users', value: stats?.overview?.totalUsers || 0, icon: Users },
    { label: 'Discussions', value: stats?.overview?.totalDiscussions || 0, icon: MessageSquare }
  ], [stats])

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning !!'
    if (hour < 17) return 'Good afternoon !!'
    return 'Good evening !!'
  }, [])

  const getUserDisplayName = useCallback(() => {
    if (!user) return 'User'
    
    // Combine firstName and lastName if both exist
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    
    // Fallback to other name fields
    return user.displayName || user.name || user.firstName || 'User'
  }, [user])

  return (
    <div className="relative min-h-screen">
      <motion.div className="relative space-y-3" variants={containerVariants} initial="hidden" animate="visible">
        {/* Enhanced Welcome Header */}
        <motion.div variants={itemVariants}>
          <div className={`rounded-lg p-3 border transition-all duration-200 ${
            theme === 'dark'
              ? 'bg-[#052829] border-[#0a3a3c]'
              : 'bg-white border-slate-200'
          }`}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-1.5 rounded-lg border transition-all duration-200 ${
                  theme === 'dark' 
                    ? 'bg-[#0a3a3c] border-[#0a3a3c]' 
                    : 'bg-slate-100 border-slate-200'
                }`}>
                  <Sparkles size={14} className={theme === 'dark' ? 'text-slate-500' : 'text-slate-700'} />
                </div>
                <span className={`text-xs font-medium transition-colors ${
                  theme === 'dark' ? 'text-slate-500' : 'text-slate-700'
                }`}>
                  {getGreeting()}
                </span>
              </div>
              
              <h1 className={`text-lg sm:text-xl lg:text-2xl font-bold mb-1 transition-colors ${
                theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
              }`}>
                Welcome back,{' '}
                <span className="text-slate-700">
                  {getUserDisplayName()}
                </span>
                !
              </h1>
              
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
                      ? 'bg-[#052829]/50 border-[#0a3a3c]/50' 
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
                    className={`group relative h-20 rounded-lg border overflow-hidden transition-all duration-200 ${
                      theme === 'dark'
                        ? 'bg-[#052829] border-[#0a3a3c]'
                        : 'bg-white border-slate-200'
                    }`}
                    whileHover={{ 
                      y: -2,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <div className="h-full flex flex-col justify-between p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-xs font-semibold uppercase tracking-wider mb-1 transition-colors ${
                            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {stat.label}
                          </p>
                          <p className={`text-lg font-bold transition-colors ${
                            theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                          }`}>
                            {stat.value.toLocaleString()}
                          </p>
                        </div>
                        <div className={`p-2 rounded-lg bg-[#1a1a1a]`}>
                          <Icon className="text-white" size={16} />
                        </div>
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
          <div className={`rounded-lg p-3 border transition-all duration-200 ${
            theme === 'dark'
              ? 'bg-[#052829] border-[#0a3a3c]'
              : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#0a3a3c]">
                  <Megaphone size={18} className="text-white" />
                </div>
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
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs group transition-all duration-200 ${
                  theme === 'dark' 
                    ? 'text-slate-500 hover:text-white hover:bg-[#ff4701] border border-[#ff4701]' 
                    : 'text-slate-700 hover:text-white hover:bg-[#ff4701] border border-[#ff4701]'
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
                        className={`group relative block p-3 rounded-lg border transition-all duration-200 ${
                          theme === 'dark'
                            ? 'bg-[#052829] border-[#0a3a3c] hover:border-[#ff4701]'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        
                        <div className="relative z-10 flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`text-sm font-bold truncate transition-colors ${
                                theme === 'dark'
                                  ? 'text-slate-100 group-hover:text-slate-500'
                                  : 'text-slate-900 group-hover:text-slate-700'
                              }`}>
                                {announcement.title}
                              </h3>
                              {announcement.isPriority && (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ff4701] text-white">
                                  Priority
                                </span>
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
                                ? 'text-slate-600 group-hover:text-slate-700'
                                : 'text-slate-300 group-hover:text-slate-500'
                            }`} />
                          </motion.div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Megaphone}
                  title="No announcements available"
                  message="Check back later for updates"
                  compact
                />
              )}
            </div>
          </div>
        </motion.section>

        {/* Enhanced News Section */}
        <motion.section variants={itemVariants}>
          <div className={`rounded-lg p-3 border transition-all duration-200 ${
            theme === 'dark'
              ? 'bg-[#052829] border-[#0a3a3c]'
              : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#0a3a3c]">
                  <Newspaper size={18} className="text-white" />
                </div>
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
                    ? 'text-slate-500 hover:text-white hover:bg-slate-600/20 border border-slate-600/30' 
                    : 'text-slate-700 hover:text-white hover:bg-[#ff4701] border border-[#ff4701]'
                }`}
              >
                View All 
                <ArrowUpRight size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>
            </div>
            
            {newsLoading ? (
              <div className="flex items-center justify-center py-4">
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
                        className={`relative rounded-lg overflow-hidden border transition-all duration-200 h-full flex flex-col ${
                          theme === 'dark'
                            ? 'bg-[#052829] border-[#0a3a3c] hover:border-[#ff4701]'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => link && window.open(link, '_blank', 'noopener,noreferrer')}
                      >
                        
                        <div className={`aspect-[4/3] relative overflow-hidden flex-shrink-0 ${
                          theme === 'dark' ? 'bg-[#052829]/50' : 'bg-slate-100'
                        }`}>
                          {imageUrl ? (
                            <motion.img 
                              src={imageUrl} 
                              alt={title} 
                              className="w-full h-full object-cover" 
                              loading="lazy"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const placeholder = e.target.parentElement?.querySelector('.news-placeholder');
                                if (placeholder) placeholder.classList.remove('hidden');
                              }}
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.5 }}
                            />
                          ) : null}
                          <div className={`w-full h-full flex items-center justify-center bg-slate-100 news-placeholder ${imageUrl ? 'hidden' : ''}`}>
                            <Newspaper size={20} className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} />
                          </div>
                        </div>
                        <div className="relative z-10 p-2 flex flex-col flex-1 min-h-[60px]">
                          <h3 className={`text-xs font-bold line-clamp-2 mb-1 transition-colors flex-shrink-0 ${
                            theme === 'dark'
                              ? 'text-slate-100 group-hover:text-slate-500'
                              : 'text-slate-900 group-hover:text-slate-700'
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
              <EmptyState
                icon={Newspaper}
                title="No news available"
                message="Check back later for latest updates"
                compact
              />
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
                    className={`group flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                      theme === 'dark'
                        ? 'bg-[#052829] border-[#0a3a3c] hover:border-[#ff4701]'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="bg-[#0a3a3c] p-2 rounded-lg">
                      <Icon className="text-white" size={18} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-sm mb-0.5 transition-colors ${
                        theme === 'dark'
                          ? 'text-slate-100'
                          : 'text-slate-900'
                      }`}>
                        {link.label}
                      </h3>
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] font-medium transition-colors ${
                          theme === 'dark'
                            ? 'text-slate-400'
                            : 'text-slate-500'
                        }`}>
                          Explore
                        </span>
                        <ArrowUpRight 
                          size={10} 
                          className={`transition-colors ${
                            theme === 'dark'
                              ? 'text-slate-400'
                              : 'text-slate-500'
                          }`} 
                        />
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

export default memo(Dashboard)
