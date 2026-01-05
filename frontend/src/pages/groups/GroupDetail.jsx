import { memo } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { isAdminOrModerator } from '../../utils/userHelpers'
import api from '../../services/api'
import PostComposer from '../../components/PostComposer'
import CommentsComponent from '../../components/CommentsComponent'
import { ArrowLeft, Users, Lock, Pin, Heart, Trash2, LogOut, LogIn, Calendar, User } from 'lucide-react'
import { format } from 'date-fns'
import { DetailSkeleton } from '../../components/skeletons'
import EmptyState from '../../components/EmptyState'
import Loading from '../../components/Loading'

const GroupDetail = () => {
  const { id } = useParams()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: group, isLoading: groupLoading } = useQuery(['group', id], () => api.get(`/groups/${id}`).then((res) => res.data.data), { enabled: !!id })
  const { data: postsData, isLoading: postsLoading } = useQuery(['groupPosts', id], () => api.get(`/groups/${id}/posts`).then((res) => res.data.data), { enabled: !!id && !!group })

  const joinMutation = useMutation(() => api.post(`/groups/${id}/join`), {
    onSuccess: () => { toast.success('Joined group successfully'); queryClient.invalidateQueries(['group', id]); queryClient.invalidateQueries(['groups']); },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to join group')
  })

  const leaveMutation = useMutation(() => api.post(`/groups/${id}/leave`), {
    onSuccess: () => { toast.success('Left group successfully'); queryClient.invalidateQueries(['group', id]); queryClient.invalidateQueries(['groups']); },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to leave group')
  })

  const deletePostMutation = useMutation((postId) => api.delete(`/groups/posts/${postId}`), {
    onSuccess: () => { toast.success('Post deleted'); queryClient.invalidateQueries(['groupPosts', id]); queryClient.invalidateQueries(['group', id]); },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete post')
  })

  const toggleLikeMutation = useMutation((postId) => api.post(`/groups/posts/${postId}/like`), { onSuccess: () => queryClient.invalidateQueries(['groupPosts', id]) })

  const handleDeletePost = (postId) => { if (window.confirm('Delete this post?')) deletePostMutation.mutate(postId) }

  const renderContentWithMentions = (content) => {
    if (!content) return ''
    return content.split(/(@\w+\s*\w*)/g).map((part, index) => {
      if (part.startsWith('@')) return <span key={index} className="text-slate-700 font-medium">{part}</span>
      return <span key={index}>{part}</span>
    })
  }

  if (groupLoading) return <DetailSkeleton />
  if (!group) {
    return (
      <EmptyState
        icon={Users}
        title="Group not found"
        message="The group you're looking for doesn't exist or has been removed"
      />
    )
  }

  const posts = postsData?.posts || []
  const isMember = group.isMember
  const canPost = isMember || group.isPublic
  const userIsAdminOrModerator = isAdminOrModerator(user)
  const isGroupAdmin = group.memberRole === 'admin' || group.memberRole === 'moderator'

  return (
    <div className="w-full space-y-6">
      <Link to="/groups" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-4">
        <ArrowLeft size={18} />
        <span className="font-medium">Back to Groups</span>
      </Link>

      {/* Group Header */}
      <motion.div className="card overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {group.coverImage ? (
          <img src={group.coverImage} alt={group.name} className="w-full h-48 object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-48 bg-slate-100 flex items-center justify-center">
            <Users size={64} className="text-pink-400/50" />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-h1 text-slate-800">{group.name}</h1>
                {!group.isPublic && <Lock size={16} className="text-slate-400" />}
              </div>
              <p className="text-caption text-slate-500">{group.description || 'No description'}</p>
            </div>
            <div className="flex gap-2">
              {!isMember && group.isPublic && <button onClick={() => joinMutation.mutate()} className="btn btn-primary flex items-center gap-1.5 text-caption px-3 py-1.5"><LogIn size={14} /> Join Group</button>}
              {isMember && <button onClick={() => window.confirm('Leave this group?') && leaveMutation.mutate()} className="btn btn-secondary flex items-center gap-1.5 text-caption px-3 py-1.5"><LogOut size={14} /> Leave Group</button>}
            </div>
          </div>
          <div className="flex items-center gap-4 text-overline text-slate-500">
            <div className="flex items-center gap-1"><Users size={12} /> {group.memberCount || 0} members</div>
            <span>•</span><span>{group.postCount || 0} posts</span><span>•</span>
            <span className="flex items-center gap-1"><Calendar size={12} /> Created {format(new Date(group.createdAt), 'MMM d, yyyy')}</span>
          </div>
          {group.createdBy && <div className="mt-3 text-overline text-slate-400 flex items-center gap-1"><User size={12} /> Created by {group.createdBy.firstName} {group.createdBy.lastName}</div>}
        </div>
      </motion.div>

      {canPost && <PostComposer groupId={id} />}
      {!canPost && <div className="card p-3 text-center text-overline text-slate-500">Join this group to post and comment</div>}

      {/* Posts Feed */}
      <div className="space-y-3">
        {postsLoading ? <Loading size="md" /> : posts.map((post) => {
          const postId = post.id || post._id
          const isAuthor = user?.id === post.authorId?.id || user?._id === post.authorId?._id
          const canEdit = isAuthor || userIsAdminOrModerator || isGroupAdmin

          return (
            <motion.div key={postId} className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {post.isPinned && <div className="flex items-center gap-2 mb-4 text-amber-500"><Pin size={16} /><span className="text-caption">Pinned Post</span></div>}
              <div className="flex items-start gap-3 mb-3">
                {post.authorId?.avatar ? (
                  <img src={post.authorId.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff4701] to-[#ff5500] flex items-center justify-center ring-2 ring-slate-200">
                    <span className="text-white font-bold text-caption">
                      {post.authorId?.firstName && post.authorId?.lastName
                        ? `${post.authorId.firstName.charAt(0)}${post.authorId.lastName.charAt(0)}`.toUpperCase()
                        : (post.authorId?.firstName?.charAt(0) || post.authorId?.name?.charAt(0) || 'U').toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-caption text-h3 text-slate-800">{post.authorId?.firstName} {post.authorId?.lastName}</span>
                    <span className="text-overline text-slate-400">{format(new Date(post.createdAt), 'MMM d, yyyy HH:mm')}</span>
                    {post.isEdited && <span className="text-overline text-slate-400">(edited)</span>}
                  </div>
                  <p className="text-caption text-slate-600 whitespace-pre-wrap mb-2">{renderContentWithMentions(post.content)}</p>
                  {post.images?.length > 0 && <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">{post.images.map((image, idx) => <img key={idx} src={image} alt="" className="w-full h-32 object-cover rounded-lg" />)}</div>}
                  <div className="flex items-center gap-4">
                    <button onClick={() => toggleLikeMutation.mutate(postId)} className={`flex items-center gap-1 ${post.isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}><Heart size={18} fill={post.isLiked ? 'currentColor' : 'none'} /> {post.likes || 0}</button>
                    {canEdit && <button onClick={() => handleDeletePost(postId)} className="text-slate-400 hover:text-rose-500 flex items-center gap-1"><Trash2 size={16} /> Delete</button>}
                  </div>
                </div>
              </div>
              {canPost && <CommentsComponent postId={postId} />}
            </motion.div>
          )
        })}

        {!postsLoading && posts.length === 0 && (
          <EmptyState
            icon={Users}
            title="No posts yet"
            message="Be the first to post!"
            compact
          />
        )}
      </div>
    </div>
  )
}

export default memo(GroupDetail)
