import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient, useMutation } from 'react-query'
import { Link, useNavigate } from 'react-router-dom'
import { notificationApi } from '../services/notificationApi'
import { playNotificationSound } from '../hooks/useNotificationEffects'
import { Bell, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

/**
 * Get navigation link based on notification type and metadata
 */
const getNotificationLink = (notification) => {
  const { type, metadata } = notification
  
  switch (type) {
    case 'ANNOUNCEMENT':
      return metadata?.announcementId ? `/announcements/${metadata.announcementId}` : '/announcements'
    case 'SURVEY_PUBLISHED':
      return metadata?.surveyId ? `/surveys/${metadata.surveyId}` : '/surveys'
    case 'GROUP_POST':
      // Check if it's a group creation notification or a post notification
      if (metadata?.contentType === 'group') {
        return metadata?.groupId ? `/groups/${metadata.groupId}` : '/groups'
      }
      return metadata?.postId ? `/groups` : '/groups'
    case 'RECOGNITION':
      return '/recognitions'
    case 'MENTION':
      return metadata?.postType === 'blog' ? '/blogs' : '/discussions'
    case 'COMMENT':
      // Navigate to the content that was commented on
      if (metadata?.contentType === 'blog') {
        return metadata?.blogId ? `/blogs/${metadata.blogId}` : '/blogs'
      }
      if (metadata?.contentType === 'discussion') {
        return metadata?.discussionId ? `/discussions/${metadata.discussionId}` : '/discussions'
      }
      return '/notifications'
    case 'LIKE':
      // Navigate to the content that was liked
      if (metadata?.contentType === 'blog') {
        return metadata?.contentId ? `/blogs/${metadata.contentId}` : '/blogs'
      }
      if (metadata?.contentType === 'discussion') {
        return metadata?.contentId ? `/discussions/${metadata.contentId}` : '/discussions'
      }
      return '/notifications'
    case 'SYSTEM':
      // Handle blog and discussion notifications
      if (metadata?.contentType === 'blog') {
        return metadata?.blogId ? `/blogs/${metadata.blogId}` : '/blogs'
      }
      if (metadata?.contentType === 'discussion') {
        return metadata?.discussionId ? `/discussions/${metadata.discussionId}` : '/discussions'
      }
      return '/notifications'
    default:
      return '/notifications'
  }
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: notificationsData } = useQuery('notifications', () =>
    notificationApi.getNotifications({ limit: 5 })
  )
  const { data: unreadData } = useQuery('unreadCount', () => notificationApi.getUnreadCount(), {
    refetchInterval: 30000
  })

  const notifications = notificationsData?.data?.data?.notifications || []
  const unreadCount = unreadData?.data?.data?.unreadCount || 0

  const deleteAllMutation = useMutation(notificationApi.deleteAllNotifications, {
    onSuccess: () => {
      queryClient.invalidateQueries('notifications')
      queryClient.invalidateQueries('unreadCount')
    }
  })

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = async (notification) => {
    // Mark as read
    await notificationApi.markAsRead(notification.id)
    queryClient.invalidateQueries('notifications')
    queryClient.invalidateQueries('unreadCount')
    
    // Navigate to the relevant page
    const link = getNotificationLink(notification)
    navigate(link)
    
    // Close dropdown
    setIsOpen(false)
  }

  const handleClearAll = async () => {
    deleteAllMutation.mutate()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={async () => {
                    await notificationApi.markAllAsRead()
                    queryClient.invalidateQueries('notifications')
                    queryClient.invalidateQueries('unreadCount')
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  disabled={deleteAllMutation.isLoading}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                  title="Clear all notifications"
                >
                  <Trash2 size={14} />
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <p className="text-sm text-gray-900">{notification.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t text-center">
            <Link
              to="/notifications"
              className="text-sm text-blue-600 hover:text-blue-700"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
