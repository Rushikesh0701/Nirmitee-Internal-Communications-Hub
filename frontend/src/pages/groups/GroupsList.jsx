import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { isAdminOrModerator } from '../../utils/userHelpers'
import api from '../../services/api'
import { Plus, Users, Lock, Search, LogIn } from 'lucide-react'
import { format } from 'date-fns'
import Loading from '../../components/Loading'

const GroupsList = () => {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all, public, private, my-groups
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery(
    ['groups', search, filter],
    () => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (filter === 'public') params.append('isPublic', 'true')
      if (filter === 'private') params.append('isPublic', 'false')
      return api.get(`/groups?${params.toString()}`).then((res) => res.data.data)
    }
  )

  const joinMutation = useMutation(
    (groupId) => api.post(`/groups/${groupId}/join`),
    {
      onSuccess: () => {
        toast.success('Joined group successfully')
        queryClient.invalidateQueries(['groups', search, filter])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to join group')
      }
    }
  )

  const canCreateGroup = isAdminOrModerator(user)

  const handleJoin = (e, groupId) => {
    e.preventDefault()
    e.stopPropagation()
    joinMutation.mutate(groupId)
  }

  if (isLoading) {
    return <Loading fullScreen />
  }

  const groups = data?.groups || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
          <p className="text-gray-600 mt-1">Join communities and start discussions</p>
        </div>
        {canCreateGroup && (
          <Link to="/groups/new" className="btn btn-primary flex items-center gap-2">
            <Plus size={18} />
            Create Group
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Groups</option>
          <option value="public">Public Groups</option>
          <option value="private">Private Groups</option>
          <option value="my-groups">My Groups</option>
        </select>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => {
          const groupId = group.id || group._id
          return (
            <Link
              key={groupId}
              to={`/groups/${groupId}`}
              className="card hover:shadow-lg transition-shadow block"
            >
              {group.coverImage && (
                <img
                  src={group.coverImage}
                  alt={group.name}
                  className="w-full h-32 object-cover rounded-t-lg"
                />
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900 flex-1">
                    {group.name}
                  </h3>
                  {!group.isPublic && (
                    <Lock size={18} className="text-gray-400 flex-shrink-0 ml-2" />
                  )}
                </div>
                <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                  {group.description || 'No description'}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Users size={16} />
                    {group.memberCount || 0} members
                  </div>
                  <span>•</span>
                  <span>{group.postCount || 0} posts</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Created {format(new Date(group.createdAt), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-2">
                    {group.isMember ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-primary-100 text-primary-800">
                        Member
                      </span>
                    ) : group.isPublic && user ? (
                      <button
                        onClick={(e) => handleJoin(e, groupId)}
                        disabled={joinMutation.isLoading}
                        className="px-3 py-1 text-xs font-semibold rounded bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        <LogIn size={14} />
                        Join
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {groups.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {search || filter !== 'all' ? 'No groups found matching your criteria' : 'No groups yet. Create one to get started!'}
        </div>
      )}
    </div>
  )
}

export default GroupsList

