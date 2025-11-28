import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import { Calendar, User, Heart, MessageCircle, Pin, Users } from 'lucide-react'
import { format } from 'date-fns'

const GroupPostCard = ({ item }) => {
  const queryClient = useQueryClient()
  const [isLiked, setIsLiked] = useState(item.isLiked || false)
  const [likesCount, setLikesCount] = useState(item.likes || 0)

  const toggleLikeMutation = useMutation(
    () => api.post(`/groups/posts/${item.id}/like`),
    {
      onSuccess: (response) => {
        const { isLiked: newIsLiked, likes: newLikes } = response.data.data
        setIsLiked(newIsLiked)
        setLikesCount(newLikes)
        // Invalidate feed query to refresh
        queryClient.invalidateQueries(['feed'])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to like post')
      }
    }
  )

  const handleLike = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleLikeMutation.mutate()
  }

  // Highlight mentions in content
  const renderContent = (content) => {
    if (!content) return ''
    const mentionRegex = /@(\w+)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = mentionRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index))
      }
      parts.push(
        <span key={match.index} className="text-primary-600 font-medium">
          {match[0]}
        </span>
      )
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex))
    }
    return parts.length > 0 ? parts : content
  }

  return (
    <Link
      to={`/groups/${item.group?._id || item.group}`}
      className="card hover:shadow-lg transition-shadow block"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-xs font-semibold rounded bg-indigo-100 text-indigo-800">
              Discussion
            </span>
            {item.isPinned && (
              <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800 flex items-center gap-1">
                <Pin size={12} />
                Pinned
              </span>
            )}
            {item.groupName && (
              <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-700 flex items-center gap-1">
                <Users size={12} />
                {item.groupName}
              </span>
            )}
          </div>
        </div>
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-700 whitespace-pre-wrap line-clamp-4">
            {renderContent(item.content)}
          </p>
        </div>
        {item.images && item.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {item.images.slice(0, 4).map((image, idx) => (
              <img
                key={idx}
                src={image}
                alt={`Post image ${idx + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
            ))}
          </div>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-500 pt-2 border-t">
          <div className="flex items-center gap-1">
            <User size={16} />
            <span>
              {item.author?.firstName} {item.author?.lastName}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={16} />
            <span>{format(new Date(item.createdAt), 'MMM d, yyyy')}</span>
          </div>
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 hover:text-primary-600 transition-colors ${
              isLiked ? 'text-primary-600' : 'text-gray-500'
            }`}
          >
            <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
            <span>{likesCount}</span>
          </button>
          <div className="flex items-center gap-1 text-gray-500">
            <MessageCircle size={16} />
            <span>{item.commentCount || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default React.memo(GroupPostCard)

