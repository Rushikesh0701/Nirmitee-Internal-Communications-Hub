import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import MentionInput from './MentionInput'
import { useAuthStore } from '../store/authStore'
import { Heart, MessageSquare, Edit2, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

const CommentsComponent = ({ postId }) => {
  const { user } = useAuthStore()
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery(
    ['postComments', postId],
    () => api.get(`/groups/posts/${postId}/comments`).then((res) => res.data.data),
    { enabled: !!postId }
  )

  const createCommentMutation = useMutation(
    (commentData) => api.post(`/groups/posts/${postId}/comments`, commentData),
    {
      onSuccess: () => {
        toast.success('Comment added')
        queryClient.invalidateQueries(['postComments', postId])
        queryClient.invalidateQueries(['groupPosts'])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add comment')
      }
    }
  )

  const updateCommentMutation = useMutation(
    ({ commentId, content }) => api.put(`/groups/comments/${commentId}`, { content }),
    {
      onSuccess: () => {
        toast.success('Comment updated')
        setEditingId(null)
        setEditContent('')
        queryClient.invalidateQueries(['postComments', postId])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update comment')
      }
    }
  )

  const deleteCommentMutation = useMutation(
    (commentId) => api.delete(`/groups/comments/${commentId}`),
    {
      onSuccess: () => {
        toast.success('Comment deleted')
        queryClient.invalidateQueries(['postComments', postId])
        queryClient.invalidateQueries(['groupPosts'])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete comment')
      }
    }
  )

  const toggleLikeMutation = useMutation(
    (commentId) => api.post(`/groups/comments/${commentId}/like`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['postComments', postId])
      }
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const content = formData.get('content')
    
    if (!content.trim()) {
      toast.error('Please enter a comment')
      return
    }

    createCommentMutation.mutate({ content })
    e.target.reset()
  }

  const handleEdit = (comment) => {
    setEditingId(comment.id || comment._id)
    setEditContent(comment.content)
  }

  const handleUpdate = (commentId) => {
    if (!editContent.trim()) {
      toast.error('Comment cannot be empty')
      return
    }
    updateCommentMutation.mutate({ commentId, content: editContent })
  }

  const handleDelete = (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(commentId)
    }
  }

  const handleLike = (commentId) => {
    toggleLikeMutation.mutate(commentId)
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

  if (isLoading) {
    return <div className="text-center py-4">Loading comments...</div>
  }

  const comments = data?.comments || []

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MessageSquare size={20} />
        Comments ({comments.length})
      </h3>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <MentionInput
          name="content"
          placeholder="Write a comment... Type @ to mention someone"
          className="resize-none"
        />
        <button type="submit" className="btn btn-primary btn-sm">
          Post Comment
        </button>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => {
          const commentId = comment.id || comment._id
          const isAuthor = user?.id === comment.authorId?.id || user?._id === comment.authorId?._id
          const isEditing = editingId === commentId

          return (
            <div key={commentId} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  {comment.authorId?.avatar ? (
                    <img
                      src={comment.authorId.avatar}
                      alt={`${comment.authorId.firstName} ${comment.authorId.lastName}`}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <span className="text-primary-600 font-semibold">
                      {comment.authorId?.firstName?.[0]}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-2">
                      <MentionInput
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(commentId)}
                          className="btn btn-primary btn-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null)
                            setEditContent('')
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {comment.authorId?.firstName} {comment.authorId?.lastName}
                        </span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(comment.createdAt), 'MMM d, yyyy HH:mm')}
                        </span>
                        {comment.isEdited && (
                          <span className="text-xs text-gray-400">(edited)</span>
                        )}
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap mb-2">
                        {renderContentWithMentions(comment.content)}
                      </p>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleLike(commentId)}
                          className={`flex items-center gap-1 text-sm ${
                            comment.likedBy?.some(
                              (id) => id === user?.id || id === user?._id
                            )
                              ? 'text-red-500'
                              : 'text-gray-500 hover:text-red-500'
                          }`}
                        >
                          <Heart
                            size={16}
                            fill={
                              comment.likedBy?.some(
                                (id) => id === user?.id || id === user?._id
                              )
                                ? 'currentColor'
                                : 'none'
                            }
                          />
                          {comment.likes || 0}
                        </button>
                        {isAuthor && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(comment)}
                              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                            >
                              <Edit2 size={14} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(commentId)}
                              className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
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

        {comments.length === 0 && (
          <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  )
}

export default CommentsComponent

