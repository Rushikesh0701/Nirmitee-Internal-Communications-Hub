import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { Link } from 'react-router-dom'
import { notificationApi } from '../services/notificationApi'
import { Bell } from 'lucide-react'
import { format } from 'date-fns'

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const queryClient = useQueryClient()

  const { data: notificationsData } = useQuery('notifications', () =>
    notificationApi.getNotifications({ limit: 5 })
  )
  const { data: unreadData } = useQuery('unreadCount', () => notificationApi.getUnreadCount(), {
    refetchInterval: 30000 // Poll every 30 seconds
  })

  const notifications = notificationsData?.data?.data?.notifications || []
  const unreadCount = unreadData?.data?.data?.unreadCount || 0

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAsRead = async (notificationId) => {
    await notificationApi.markAsRead(notificationId)
    queryClient.invalidateQueries('notifications')
    queryClient.invalidateQueries('unreadCount')
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
                  onClick={() => handleMarkAsRead(notification.id)}
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

