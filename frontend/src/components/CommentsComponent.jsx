import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import MentionInput from './MentionInput'
import { useAuthStore } from '../store/authStore'
import { useCreationStore } from '../store/creationStore'
import { Heart, MessageSquare, Edit2, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import Loading from './Loading'

const CommentsComponent = ({ postId }) => {
  const { user } = useAuthStore()
  const { startCommentPosting, endCommentPosting, isAnyCommentPosting } = useCreationStore()
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery(['postComments', postId], () => api.get(`/groups/posts/${postId}/comments`).then((res) => res.data.data), { enabled: !!postId })

  const createCommentMutation = useMutation((commentData) => api.post(`/groups/posts/${postId}/comments`, commentData), {
    onSuccess: () => { toast.success('Comment added'); queryClient.invalidateQueries(['postComments', postId]); queryClient.invalidateQueries(['groupPosts']); endCommentPosting(); },
    onError: (error) => { endCommentPosting(); toast.error(error.response?.data?.message || 'Failed to add comment'); }
  })

  const updateCommentMutation = useMutation(({ commentId, content }) => api.put(`/groups/comments/${commentId}`, { content }), {
    onSuccess: () => { toast.success('Comment updated'); setEditingId(null); setEditContent(''); queryClient.invalidateQueries(['postComments', postId]); },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to update')
  })

  const deleteCommentMutation = useMutation((commentId) => api.delete(`/groups/comments/${commentId}`), {
    onSuccess: () => { toast.success('Comment deleted'); queryClient.invalidateQueries(['postComments', postId]); queryClient.invalidateQueries(['groupPosts']); },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete')
  })

  const toggleLikeMutation = useMutation((commentId) => api.post(`/groups/comments/${commentId}/like`), { onSuccess: () => queryClient.invalidateQueries(['postComments', postId]) })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (createCommentMutation.isLoading || isAnyCommentPosting()) return
    if (!startCommentPosting('group')) return
    const formData = new FormData(e.target)
    const content = formData.get('content')
    if (!content.trim()) { endCommentPosting(); return }
    createCommentMutation.mutate({ content })
    e.target.reset()
  }

  const handleEdit = (comment) => { setEditingId(comment.id || comment._id); setEditContent(comment.content) }
  const handleUpdate = (commentId) => { if (!editContent.trim()) return; updateCommentMutation.mutate({ commentId, content: editContent }) }
  const handleDelete = (commentId) => { if (window.confirm('Delete this comment?')) deleteCommentMutation.mutate(commentId) }

  const renderContentWithMentions = (content) => {
    if (!content) return ''
    return content.split(/(@\w+\s*\w*)/g).map((part, index) => {
      if (part.startsWith('@')) return <span key={index} className="text-indigo-600 font-medium">{part}</span>
      return <span key={index}>{part}</span>
    })
  }

  if (isLoading) return <Loading size="sm" />

  const comments = data?.comments || []

  return (
    <div className="space-y-4 border-t border-slate-200 pt-4 mt-4">
      <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><MessageSquare size={18} /> Comments ({comments.length})</h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        <MentionInput name="content" placeholder="Write a comment..." className="resize-none" disabled={isAnyCommentPosting()} />
        <button type="submit" disabled={isAnyCommentPosting()} className="btn btn-primary text-sm py-1.5 px-4">{isAnyCommentPosting() ? 'Posting...' : 'Post Comment'}</button>
      </form>

      <div className="space-y-3">
        {comments.map((comment) => {
          const commentId = comment.id || comment._id
          const isAuthor = user?.id === comment.authorId?.id || user?._id === comment.authorId?._id
          const isEditing = editingId === commentId
          const isLiked = comment.likedBy?.some((id) => id === user?.id || id === user?._id)

          return (
            <div key={commentId} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-start gap-3">
                {comment.authorId?.avatar ? (
                  <img src={comment.authorId.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ff4701] to-[#ff5500] flex items-center justify-center ring-2 ring-slate-200">
                    <span className="text-white font-bold text-xs">
                      {comment.authorId?.firstName && comment.authorId?.lastName
                        ? `${comment.authorId.firstName.charAt(0)}${comment.authorId.lastName.charAt(0)}`.toUpperCase()
                        : (comment.authorId?.firstName?.charAt(0) || comment.authorId?.name?.charAt(0) || 'U').toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-2">
                      <MentionInput value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdate(commentId)} className="btn btn-primary text-xs py-1 px-3">Save</button>
                        <button onClick={() => { setEditingId(null); setEditContent(''); }} className="btn btn-secondary text-xs py-1 px-3">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-800 text-sm">{comment.authorId?.firstName} {comment.authorId?.lastName}</span>
                        <span className="text-xs text-slate-400">{format(new Date(comment.createdAt), 'MMM d, HH:mm')}</span>
                        {comment.isEdited && <span className="text-xs text-slate-400">(edited)</span>}
                      </div>
                      <p className="text-slate-600 text-sm whitespace-pre-wrap mb-2">{renderContentWithMentions(comment.content)}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <button onClick={() => toggleLikeMutation.mutate(commentId)} className={`flex items-center gap-1 ${isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}><Heart size={14} fill={isLiked ? 'currentColor' : 'none'} /> {comment.likes || 0}</button>
                        {isAuthor && (
                          <div className="flex gap-3">
                            <button onClick={() => handleEdit(comment)} className="text-slate-400 hover:text-indigo-600 flex items-center gap-1"><Edit2 size={12} /> Edit</button>
                            <button onClick={() => handleDelete(commentId)} className="text-slate-400 hover:text-rose-500 flex items-center gap-1"><Trash2 size={12} /> Delete</button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {comments.length === 0 && <p className="text-slate-400 text-center py-6 text-sm">No comments yet</p>}
      </div>
    </div>
  )
}

export default CommentsComponent
