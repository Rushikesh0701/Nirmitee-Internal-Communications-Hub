import { useState } from 'react'
import { useQuery } from 'react-query'
import { recognitionRewardApi } from '../../services/recognitionRewardApi'
import { Users, Trophy, Flame, TrendingUp, Search, ChevronDown, ChevronUp, Star, Award } from 'lucide-react'
import Loading from '../../components/Loading'

const ACTIVITY_ICONS = {
  BLOG_POST: '📝', BLOG_COMMENT: '💬', BLOG_LIKE: '❤️',
  DISCUSSION_CREATE: '🗣️', DISCUSSION_REPLY: '💭',
  POLL_VOTE: '🗳️', POLL_CREATE: '📊',
  COURSE_COMPLETE: '🎓', DAILY_LOGIN: '👋', STREAK_BONUS: '🔥'
}

export default function AdminActivityDashboard() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('totalPoints')
  const [sortOrder, setSortOrder] = useState('desc')
  const [expandedUser, setExpandedUser] = useState(null)
  const limit = 15

  const { data, isLoading } = useQuery(
    ['adminActivityDashboard', page, search, sortBy, sortOrder],
    () => recognitionRewardApi.getAdminActivityDashboard({ page, limit, search, sortBy, sortOrder }),
    { keepPreviousData: true }
  )

  const dashboardData = data?.data?.data || {}
  const users = dashboardData.users || []
  const pagination = dashboardData.pagination || {}
  const stats = dashboardData.platformStats || {}

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setPage(1)
  }

  const handleSearch = (e) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <ChevronDown size={14} className="opacity-30" />
    return sortOrder === 'desc'
      ? <ChevronDown size={14} className="text-[#ff4701]" />
      : <ChevronUp size={14} className="text-[#ff4701]" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Activity Dashboard</h1>
        <p className="text-gray-600 mt-1">Monitor all users' engagement, points, streaks, and levels</p>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-lg"><Users size={20} className="text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers || 0}</p>
              <p className="text-xs text-gray-500">Total Users</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-50 rounded-lg"><Star size={20} className="text-yellow-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{(stats.totalPointsAwarded || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Points Awarded</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 rounded-lg"><TrendingUp size={20} className="text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{(stats.totalActivities || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Activities</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 rounded-lg"><Award size={20} className="text-purple-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.averagePointsPerUser || 0}</p>
              <p className="text-xs text-gray-500">Avg Points / User</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={handleSearch}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4701]/20 focus:border-[#ff4701] text-sm"
        />
      </div>

      {/* Users Table */}
      {isLoading ? (
        <Loading />
      ) : users.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('totalPoints')}>
                    <div className="flex items-center justify-center gap-1">Points <SortIcon field="totalPoints" /></div>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('level')}>
                    <div className="flex items-center justify-center gap-1">Level <SortIcon field="level" /></div>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('currentStreak')}>
                    <div className="flex items-center justify-center gap-1">Streak <SortIcon field="currentStreak" /></div>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('totalActivities')}>
                    <div className="flex items-center justify-center gap-1">Activities <SortIcon field="totalActivities" /></div>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <>
                    <tr
                      key={user._id}
                      className={`border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors ${
                        expandedUser === user._id ? 'bg-blue-50/30' : ''
                      }`}
                      onClick={() => setExpandedUser(expandedUser === user._id ? null : user._id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                            {user.avatar ? (
                              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-semibold text-gray-600">
                                {(user.firstName?.[0] || '') + (user.lastName?.[0] || '')}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-yellow-700 bg-yellow-50 px-2.5 py-1 rounded-full">
                          <Star size={12} /> {user.totalPoints}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
                          <Trophy size={12} /> Lv.{user.level} — {user.levelTitle}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full">
                          <Flame size={12} /> {user.currentStreak}d
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-medium text-gray-700">{user.totalActivities}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-gray-500">
                          {user.lastActiveDate
                            ? new Date(user.lastActiveDate).toLocaleDateString()
                            : 'Never'}
                        </span>
                      </td>
                    </tr>
                    {/* Expanded activity breakdown */}
                    {expandedUser === user._id && user.activityBreakdown?.length > 0 && (
                      <tr key={`${user._id}-details`}>
                        <td colSpan={6} className="px-4 py-4 bg-gray-50/80">
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            {user.activityBreakdown.map((item) => (
                              <div key={item.type} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100">
                                <span className="text-lg">{ACTIVITY_ICONS[item.type] || '⭐'}</span>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-gray-700 truncate">{item.label}</p>
                                  <p className="text-xs text-gray-500">{item.count}× • {item.totalPoints} pts</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.pages} • {pagination.total} users
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Users className="text-gray-300 mx-auto mb-4" size={48} />
          <p className="text-gray-500">No users found</p>
        </div>
      )}
    </div>
  )
}
