import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { isAdminOrModerator } from '../../utils/userHelpers'
import api from '../../services/api'
import PostComposer from '../../components/PostComposer'
import CommentsComponent from '../../components/CommentsComponent'
import { ArrowLeft, Users, Lock, Pin, Heart, Trash2, LogOut, LogIn } from 'lucide-react'
import { format } from 'date-fns'
import Loading from '../../components/Loading'

const GroupDetail = () => {
  const { id } = useParams()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: group, isLoading: groupLoading } = useQuery(
    ['group', id],
    () => api.get(`/groups/${id}`).then((res) => res.data.data),
    { enabled: !!id }
  )

  const { data: postsData, isLoading: postsLoading } = useQuery(
    ['groupPosts', id],
    () => api.get(`/groups/${id}/posts`).then((res) => res.data.data),
    { enabled: !!id && !!group }
  )

  const joinMutation = useMutation(
    () => api.post(`/groups/${id}/join`),
    {
      onSuccess: () => {
        toast.success('Joined group successfully')
        queryClient.invalidateQueries(['group', id])
        queryClient.invalidateQueries(['groups'])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to join group')
      }
    }
  )

  const leaveMutation = useMutation(
    () => api.post(`/groups/${id}/leave`),
    {
      onSuccess: () => {
        toast.success('Left group successfully')
        queryClient.invalidateQueries(['group', id])
        queryClient.invalidateQueries(['groups'])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to leave group')
      }
    }
  )

  const deletePostMutation = useMutation(
    (postId) => api.delete(`/groups/posts/${postId}`),
    {
      onSuccess: () => {
        toast.success('Post deleted')
        queryClient.invalidateQueries(['groupPosts', id])
        queryClient.invalidateQueries(['group', id])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete post')
      }
    }
  )

  const toggleLikeMutation = useMutation(
    (postId) => api.post(`/groups/posts/${postId}/like`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['groupPosts', id])
      }
    }
  )

  const handleJoin = () => {
    joinMutation.mutate()
  }

  const handleLeave = () => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      leaveMutation.mutate()
    }
  }

  const handleDeletePost = (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deletePostMutation.mutate(postId)
    }
  }

  const handleLike = (postId) => {
    toggleLikeMutation.mutate(postId)
  }

  // Highlight mentions in content
  const renderContentWithMentions = (content) => {
    if (!content) return ''
    const parts = content.split(/(@\w+\s*\w*)/g)
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-primary-600 font-medium">
            {part}
          </span>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  if (groupLoading) {
    return <Loading fullScreen />
  }

  if (!group) {
    return <div className="text-center py-12">Group not found</div>
  }

  const posts = postsData?.posts || []
  const isMember = group.isMember
  const canPost = isMember || group.isPublic
  const userIsAdminOrModerator = isAdminOrModerator(user)
  const isGroupAdmin = group.memberRole === 'admin' || group.memberRole === 'moderator'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/groups"
        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
      >
        <ArrowLeft size={18} />
        Back to Groups
      </Link>

      {/* Group Header */}
      <div className="card">
        {group.coverImage && (
          <img
            src={group.coverImage}
            alt={group.name}
            className="w-full h-48 object-cover rounded-t-lg"
          />
        )}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
                {!group.isPublic && <Lock size={20} className="text-gray-400" />}
              </div>
              <p className="text-gray-600">{group.description || 'No description'}</p>
            </div>
            <div className="flex gap-2">
              {!isMember && group.isPublic && (
                <button onClick={handleJoin} className="btn btn-primary flex items-center gap-2">
                  <LogIn size={18} />
                  Join Group
                </button>
              )}
              {isMember && (
                <button onClick={handleLeave} className="btn btn-secondary flex items-center gap-2">
                  <LogOut size={18} />
                  Leave Group
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users size={18} />
              {group.memberCount || 0} members
            </div>
            <span>•</span>
            <span>{group.postCount || 0} posts</span>
            <span>•</span>
            <span>Created {format(new Date(group.createdAt), 'MMM d, yyyy')}</span>
          </div>
          {group.createdBy && (
            <div className="mt-4 text-sm text-gray-500">
              Created by {group.createdBy.firstName} {group.createdBy.lastName}
            </div>
          )}
        </div>
      </div>

      {/* Post Composer */}
      {canPost && (
        <PostComposer groupId={id} />
      )}

      {!canPost && (
        <div className="card p-6 text-center text-gray-500">
          Join this group to post and comment
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-6">
        {postsLoading ? (
          <div className="text-center py-8"><Loading size="sm" /></div>
        ) : (
          posts.map((post) => {
            const postId = post.id || post._id
            const isAuthor = user?.id === post.authorId?.id || user?._id === post.authorId?._id
            const canEdit = isAuthor || userIsAdminOrModerator || isGroupAdmin

            return (
              <div key={postId} className="card">
                {post.isPinned && (
                  <div className="flex items-center gap-2 mb-4 text-yellow-600">
                    <Pin size={16} />
                    <span className="text-sm font-semibold">Pinned Post</span>
                  </div>
                )}

                <div className="flex items-start gap-4 mb-4">
                  {post.authorId?.avatar ? (
                    <img
                      src={post.authorId.avatar}
                      alt={`${post.authorId.firstName} ${post.authorId.lastName}`}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-600 font-semibold">
                        {post.authorId?.firstName?.[0]}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        {post.authorId?.firstName} {post.authorId?.lastName}
                      </span>
                      <span className="text-sm text-gray-500">
                        {format(new Date(post.createdAt), 'MMM d, yyyy HH:mm')}
                      </span>
                      {post.isEdited && (
                        <span className="text-xs text-gray-400">(edited)</span>
                      )}
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap mb-3">
                      {renderContentWithMentions(post.content)}
                    </p>
                    {post.images && post.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                        {post.images.map((image, idx) => (
                          <img
                            key={idx}
                            src={image}
                            alt={`Post image ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}
                    {post.mentions && post.mentions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.mentions.map((mention, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs rounded bg-primary-100 text-primary-800"
                          >
                            @{mention.firstName} {mention.lastName}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(postId)}
                        className={`flex items-center gap-1 ${
                          post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                        }`}
                      >
                        <Heart size={18} fill={post.isLiked ? 'currentColor' : 'none'} />
                        {post.likes || 0}
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => handleDeletePost(postId)}
                          className="text-gray-500 hover:text-red-500 flex items-center gap-1"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Comments */}
                {canPost && <CommentsComponent postId={postId} />}
              </div>
            )
          })
        )}

        {!postsLoading && posts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No posts yet. Be the first to post!
          </div>
        )}
      </div>
    </div>
  )
}

export default GroupDetail

