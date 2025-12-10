import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { Plus, Calendar, User, Clock, Tag, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { useAuthStore } from '../../store/authStore'
import { isAdmin } from '../../utils/userHelpers'
import Loading from '../../components/Loading'

const AnnouncementsList = () => {
  const { user } = useAuthStore()
  const userIsAdmin = isAdmin(user)
  
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    tags: '',
    scheduled: '',
    published: ''
  })
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
    { keepPreviousData: true }
  )

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1) // Reset to first page when filter changes
  }

  const clearFilters = () => {
    setFilters({ tags: '', scheduled: '', published: '' })
    setPage(1)
  }

  // Show loading immediately if we're loading and don't have cached data yet
  if (isLoading && !data) {
    return <Loading fullScreen />
  }

  const announcements = data?.announcements || []
  const pagination = data?.pagination || { total: 0, page: 1, limit: 12, pages: 1 }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Announcements</h1>
          <p className="text-gray-600 mt-1">Stay updated with company news and updates</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Filter size={18} />
            Filters
          </button>
          {userIsAdmin && (
            <Link to="/announcements/new" className="btn btn-primary flex items-center gap-2">
              <Plus size={18} />
              Create Announcement
            </Link>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Clear all
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <input
                type="text"
                placeholder="Filter by tags"
                value={filters.tags}
                onChange={(e) => handleFilterChange('tags', e.target.value)}
                className="input"
              />
            </div>
            {userIsAdmin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled
                  </label>
                  <select
                    value={filters.scheduled}
                    onChange={(e) => handleFilterChange('scheduled', e.target.value)}
                    className="input"
                  >
                    <option value="">All</option>
                    <option value="true">Scheduled</option>
                    <option value="false">Not Scheduled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Published
                  </label>
                  <select
                    value={filters.published}
                    onChange={(e) => handleFilterChange('published', e.target.value)}
                    className="input"
                  >
                    <option value="">All</option>
                    <option value="true">Published</option>
                    <option value="false">Unpublished</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Announcements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {announcements.map((announcement) => (
          <Link
            key={announcement._id || announcement.id}
            to={`/announcements/${announcement._id || announcement.id}`}
            className="card hover:shadow-lg transition-shadow"
          >
            {announcement.image && (
              <img
                src={announcement.image}
                alt={announcement.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            <div className="space-y-2">
              {announcement.tags && announcement.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {announcement.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded bg-primary-100 text-primary-800"
                    >
                      <Tag size={12} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                {announcement.title}
              </h3>
              <p className="text-gray-600 line-clamp-3 text-sm">
                {announcement.content?.replace(/<[^>]*>/g, '').substring(0, 150)}...
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500 pt-2 border-t">
                <div className="flex items-center gap-1">
                  <User size={16} />
                  <span>
                    {announcement.createdBy?.firstName} {announcement.createdBy?.lastName}
                  </span>
                </div>
                {announcement.scheduledAt ? (
                  <div className="flex items-center gap-1 text-orange-600">
                    <Clock size={16} />
                    <span>{format(new Date(announcement.scheduledAt), 'MMM d, yyyy')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    <span>{format(new Date(announcement.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>
              {announcement.scheduledAt && !announcement.isPublished && (
                <div className="mt-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                  Scheduled
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {announcements.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No announcements available yet
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default AnnouncementsList

