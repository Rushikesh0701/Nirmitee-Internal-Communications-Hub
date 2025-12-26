import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { notificationApi } from '../../services/notificationApi'
import { Bell, Check, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import Loading from '../../components/Loading'
import Pagination from '../../components/Pagination'

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
      return null
    case 'LIKE':
      // Navigate to the content that was liked
      if (metadata?.contentType === 'blog') {
        return metadata?.contentId ? `/blogs/${metadata.contentId}` : '/blogs'
      }
      if (metadata?.contentType === 'discussion') {
        return metadata?.contentId ? `/discussions/${metadata.contentId}` : '/discussions'
      }
      return null
    case 'SYSTEM':
      // Handle blog and discussion notifications
      if (metadata?.contentType === 'blog') {
        return metadata?.blogId ? `/blogs/${metadata.blogId}` : '/blogs'
      }
      if (metadata?.contentType === 'discussion') {
        return metadata?.discussionId ? `/discussions/${metadata.discussionId}` : '/discussions'
      }
      return null
    default:
      return null
  }
}

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all') // all, unread, read
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1)
  }, [filter])

  const { data, isLoading } = useQuery(
    ['notifications', filter, page, limit],
    () => notificationApi.getNotifications({ 
      isRead: filter === 'all' ? undefined : filter === 'read',
      page,
      limit
    })
  )

  const markAsReadMutation = useMutation(notificationApi.markAsRead, {
    onSuccess: () => {
      queryClient.invalidateQueries('notifications')
      queryClient.invalidateQueries('unreadCount')
    }
  })

  const markAllAsReadMutation = useMutation(notificationApi.markAllAsRead, {
    onSuccess: () => {
      queryClient.invalidateQueries('notifications')
      queryClient.invalidateQueries('unreadCount')
    }
  })

  const deleteAllMutation = useMutation(notificationApi.deleteAllNotifications, {
    onSuccess: () => {
      queryClient.invalidateQueries('notifications')
      queryClient.invalidateQueries('unreadCount')
    }
  })

  const notifications = data?.data?.data?.notifications || []
  const pagination = data?.data?.data?.pagination || { total: 0, page: 1, limit: 20, pages: 1 }

  const handleNotificationClick = async (notification) => {
    // Mark as read first
    if (!notification.isRead) {
      await markAsReadMutation.mutateAsync(notification.id)
    }
    
    // Navigate to the relevant page
    const link = getNotificationLink(notification)
    if (link) {
      navigate(link)
    }
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all notifications?')) {
      deleteAllMutation.mutate()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">Stay updated with all activities</p>
        </div>
        <div className="flex items-center gap-3">
          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={() => markAllAsReadMutation.mutate()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Check size={18} />
              Mark all as read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={deleteAllMutation.isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Trash2 size={18} />
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-b pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`btn-filter ${filter === 'all' ? 'btn-filter-active' : ''}`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`btn-filter ${filter === 'unread' ? 'btn-filter-active' : ''}`}
        >
          Unread
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`btn-filter ${filter === 'read' ? 'btn-filter-active' : ''}`}
        >
          Read
        </button>
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          {notifications.length > 0 ? (
            <>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow ${
                      !notification.isRead ? 'border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Bell className="text-blue-600" size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900">{notification.content}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsReadMutation.mutate(notification.id)
                          }}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
          ) : (
            <div className="text-center py-12 text-gray-500">No notifications found</div>
          )}
        </>
      )}
    </div>
  )
}
