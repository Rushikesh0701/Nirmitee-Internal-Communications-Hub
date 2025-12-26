import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'
import { Plus, Calendar, User, Tag, Filter, Megaphone, X, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { format } from 'date-fns'
import { useAuthStore } from '../../store/authStore'
import { useTheme } from '../../contexts/ThemeContext'
import { isAdmin } from '../../utils/userHelpers'
import Loading from '../../components/Loading'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

const AnnouncementsList = () => {
  const { user } = useAuthStore()
  const { theme } = useTheme()
  const userIsAdmin = isAdmin(user)
  
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ tags: '', scheduled: '', published: '' })
  const [showFilters, setShowFilters] = useState(false)

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: '12',
    ...(filters.tags && { tags: filters.tags }),
    ...(filters.scheduled && { scheduled: filters.scheduled }),
    ...(filters.published && { published: filters.published })
  })

  const { data, isLoading } = useQuery(
    ['announcements', page, filters],
    () => api.get(`/announcements?${queryParams}`).then((res) => res.data.data),
    { keepPreviousData: true, refetchOnMount: 'always' }
  )

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({ tags: '', scheduled: '', published: '' })
    setPage(1)
  }

  if (isLoading && !data) return <Loading fullScreen />

  const announcements = data?.announcements || []
  const pagination = data?.pagination || { total: 0, page: 1, limit: 12, pages: 1 }

  return (
    <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-600">
            <Megaphone size={20} className="text-white" />
          </div>
          <div>
            <h1 className={`text-xl sm:text-2xl font-bold transition-colors ${
              theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
            }`}>Company Announcements</h1>
            <p className={`text-xs mt-0.5 transition-colors ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>Stay updated with company news and updates</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-filter ${showFilters ? 'btn-filter-active' : ''}`}
            whileTap={{ scale: 0.98 }}
          >
            {showFilters ? <X size={16} /> : <Filter size={16} />}
            Filters
          </motion.button>
          {userIsAdmin && (
            <Link to="/announcements/new" className="btn-add">
              <Plus size={16} /> Create
            </Link>
          )}
        </div>
      </motion.div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            className="card space-y-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <h3 className={`font-semibold transition-colors ${
                theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
              }`}>Filters</h3>
              <button onClick={clearFilters} className="btn-filter">
                Clear all
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Tags</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Filter by tags"
                    value={filters.tags}
                    onChange={(e) => handleFilterChange('tags', e.target.value)}
                    className="input pl-11"
                  />
                </div>
              </div>
              {userIsAdmin && (
                <>
                  <div>
                    <label className="form-label">Scheduled</label>
                    <select value={filters.scheduled} onChange={(e) => handleFilterChange('scheduled', e.target.value)} className="filter-select">
                      <option value="">All</option>
                      <option value="true">Scheduled</option>
                      <option value="false">Not Scheduled</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Published</label>
                    <select value={filters.published} onChange={(e) => handleFilterChange('published', e.target.value)} className="filter-select">
                      <option value="">All</option>
                      <option value="true">Published</option>
                      <option value="false">Unpublished</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Announcements Grid */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" variants={containerVariants}>
        {announcements.map((announcement, index) => (
          <motion.div key={announcement._id || announcement.id} variants={itemVariants} custom={index} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
            <Link to={`/announcements/${announcement._id || announcement.id}`} className="card-hover block group overflow-hidden">
              {announcement.image && (
                <div className="relative -mx-4 -mt-4 mb-2 overflow-hidden rounded-t-lg">
                  <img src={announcement.image} alt={announcement.title} className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
              )}
              <div className="space-y-1.5">
                {announcement.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {announcement.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="badge badge-primary"><Tag size={10} /> {tag}</span>
                    ))}
                  </div>
                )}
                <h3 className={`text-lg font-semibold line-clamp-2 transition-colors ${
                  theme === 'dark'
                    ? 'text-slate-200 group-hover:text-blue-400'
                    : 'text-slate-800 group-hover:text-blue-600'
                }`}>
                  {announcement.title}
                </h3>
                <p className={`text-sm line-clamp-2 transition-colors ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {announcement.content?.replace(/<[^>]*>/g, '').substring(0, 150)}...
                </p>
                <div className={`flex items-center gap-4 text-xs pt-3 border-t transition-colors ${
                  theme === 'dark'
                    ? 'text-slate-500 border-slate-700/50'
                    : 'text-slate-400 border-slate-100'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <User size={14} />
                    <span>{announcement.createdBy?.firstName} {announcement.createdBy?.lastName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    <span>{format(new Date(announcement.scheduledAt || announcement.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                {announcement.scheduledAt && !announcement.isPublished && (
                  <span className="badge badge-warning">Scheduled</span>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Empty State */}
      {announcements.length === 0 && (
        <motion.div variants={itemVariants} className="empty-state">
          <Megaphone size={56} className="empty-state-icon" />
          <h3 className="empty-state-title">No announcements yet</h3>
          <p className="empty-state-text">Check back later for updates</p>
        </motion.div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <motion.div variants={itemVariants} className="pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="pagination-btn flex items-center gap-1">
            <ChevronLeft size={18} /> Previous
          </button>
          <div className="flex items-center gap-2">
            {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
              const pageNum = i + 1
              return (
                <button key={pageNum} onClick={() => setPage(pageNum)} className={`pagination-btn w-10 h-10 ${page === pageNum ? 'pagination-btn-active' : ''}`}>
                  {pageNum}
                </button>
              )
            })}
          </div>
          <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="pagination-btn flex items-center gap-1">
            Next <ChevronRight size={18} />
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}

export default AnnouncementsList
