import { useState, useEffect, useCallback, memo } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { isAdminOrModerator } from '../../utils/userHelpers'
import api from '../../services/api'
import { Plus, Users, Lock, Search, LogIn } from 'lucide-react'
import { format } from 'date-fns'
import { CardSkeleton } from '../../components/skeletons'
import Pagination from '../../components/Pagination'
import EmptyState from '../../components/EmptyState'

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

const GroupsList = () => {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(12)
  const queryClient = useQueryClient()

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [search, filter])

  const { data, isLoading } = useQuery(
    ['groups', search, filter, page, limit],
    () => {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      if (search) params.append('search', search)
      if (filter === 'public') params.append('isPublic', 'true')
      if (filter === 'private') params.append('isPublic', 'false')
      return api.get(`/groups?${params.toString()}`).then((res) => res.data.data)
    },
    { 
      keepPreviousData: true,
      staleTime: 0, // Always refetch when invalidated
      cacheTime: 5 * 60 * 1000, // 5 minutes - keep in cache
      refetchOnMount: true, // Refetch when component mounts
      refetchOnWindowFocus: false
    }
  )

  const joinMutation = useMutation((groupId) => api.post(`/groups/${groupId}/join`), {
    onSuccess: () => { toast.success('Joined group successfully'); queryClient.invalidateQueries(['groups', search, filter]); },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to join group')
  })

  const canCreateGroup = isAdminOrModerator(user)
  const handleJoin = useCallback((e, groupId) => { e.preventDefault(); e.stopPropagation(); joinMutation.mutate(groupId); }, [joinMutation])

  const groups = data?.groups || []
  const pagination = data?.pagination || { total: 0, page: 1, limit: 12, pages: 1 }

  return (
    <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#0a3a3c]">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Groups</h1>
            <p className="text-slate-500 text-xs mt-0.5">Join communities and start discussions</p>
          </div>
        </div>
        {canCreateGroup && (
          <Link to="/groups/new" className="btn-add">
            <Plus size={16} /> Create Group
          </Link>
        )}
      </motion.div>

      {/* Search and Filters */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input type="text" placeholder="Search groups..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-11" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select min-w-[160px]">
          <option value="all">All Groups</option>
          <option value="public">Public Groups</option>
          <option value="private">Private Groups</option>
          <option value="my-groups">My Groups</option>
        </select>
      </motion.div>

      {/* Groups Grid */}
      {isLoading && !data ? (
        <CardSkeleton count={6} />
      ) : groups.length > 0 ? (
        <>
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" variants={containerVariants}>
            {groups.map((group, index) => {
              const groupId = group.id || group._id
              return (
                <motion.div key={groupId} variants={itemVariants} custom={index} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                  <Link to={`/groups/${groupId}`} className="card-hover block group overflow-hidden">
                    <div className="relative -mx-4 -mt-4 mb-1.5 overflow-hidden rounded-t-lg">
                      {group.coverImage ? (
                        <img src={group.coverImage} alt={group.name} className="w-full h-20 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-20 bg-slate-100 flex items-center justify-center">
                          <Users size={32} className="text-pink-400/50" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between">
                        <h3 className="text-base font-semibold text-slate-800 flex-1 group-hover:text-pink-600 transition-colors">{group.name}</h3>
                        {!group.isPublic && <Lock size={14} className="text-slate-400 flex-shrink-0 ml-2" />}
                      </div>
                      <p className="text-slate-500 text-xs line-clamp-2">{group.description || 'No description'}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <div className="flex items-center gap-1"><Users size={12} /> {group.memberCount || 0} members</div>
                        <span>•</span>
                        <span>{group.postCount || 0} posts</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-400">Created {format(new Date(group.createdAt), 'MMM d, yyyy')}</span>
                        {group.isMember ? (
                          <span className="badge badge-success">Member</span>
                        ) : group.isPublic && user ? (
                          <button onClick={(e) => handleJoin(e, groupId)} disabled={joinMutation.isLoading} className="btn btn-primary text-xs px-3 py-1 flex items-center gap-1">
                            <LogIn size={14} /> Join
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
          {pagination.pages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={pagination.pages}
              onPageChange={setPage}
              limit={limit}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
              showLimitSelector={true}
            />
          )}
        </>
      ) : null}

      {/* Empty State */}
      {!isLoading && groups.length === 0 && (
        <EmptyState
          icon={Users}
          title="No groups found"
          message={search || filter !== 'all' ? 'Try adjusting your search' : 'No groups yet. Create one to get started!'}
        />
      )}
    </motion.div>
  )
}

export default memo(GroupsList)
