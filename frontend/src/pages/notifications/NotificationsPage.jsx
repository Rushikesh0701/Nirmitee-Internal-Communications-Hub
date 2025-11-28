import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { notificationApi } from '../../services/notificationApi'
import { Bell, Check } from 'lucide-react'
import { format } from 'date-fns'

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState('all') // all, unread, read

  const { data, isLoading } = useQuery(
    ['notifications', filter],
    () => notificationApi.getNotifications({ isRead: filter === 'all' ? undefined : filter === 'read' })
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

  const notifications = data?.data?.data?.notifications || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">Stay updated with all activities</p>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Check size={18} />
            Mark all as read
          </button>
        )}
      </div>

      <div className="flex gap-4 border-b">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 border-b-2 ${
            filter === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 border-b-2 ${
            filter === 'unread' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          Unread
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-4 py-2 border-b-2 ${
            filter === 'read' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          Read
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading notifications...</div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow p-6 ${
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
                    onClick={() => markAsReadMutation.mutate(notification.id)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="text-center py-12 text-gray-500">No notifications found</div>
      )}
    </div>
  )
}

