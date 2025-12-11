import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { Bell, X } from 'lucide-react'

/**
 * Notification component for scheduled announcements
 * 
 * This component checks for newly published scheduled announcements
 * and displays card-style notifications to users.
 * 
 * Note: In a production environment, you would implement:
 * - WebSocket/SSE for real-time notifications
 * - Push notifications via browser API
 * - Email notifications
 * - In-app notification center
 */
const AnnouncementNotification = () => {
  const { isAuthenticated } = useAuthStore()
  const [dismissedIds, setDismissedIds] = useState(() => {
    // Load dismissed notifications from localStorage
    const stored = localStorage.getItem('dismissedAnnouncements')
    return stored ? JSON.parse(stored) : []
  })

  // Poll for new announcements (in production, use WebSocket/SSE)
  // Only fetch when user is authenticated
  const { data } = useQuery(
    'newAnnouncements',
    () => api.get('/announcements?limit=5&published=true').then((res) => res.data.data),
    {
      enabled: isAuthenticated, // Only fetch when authenticated
      refetchInterval: isAuthenticated ? 60000 : false, // Check every minute when authenticated
      refetchOnWindowFocus: isAuthenticated // Only refetch on focus when authenticated
    }
  )

  const announcements = data?.announcements || []
  
  // Filter out dismissed announcements and show only recent ones (last 24 hours)
  const recentAnnouncements = announcements.filter((announcement) => {
    if (dismissedIds.includes(announcement._id || announcement.id)) {
      return false
    }
    const createdAt = new Date(announcement.publishedAt || announcement.createdAt)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return createdAt > oneDayAgo
  })

  const handleDismiss = (id) => {
    const newDismissed = [...dismissedIds, id]
    setDismissedIds(newDismissed)
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed))
  }

  if (recentAnnouncements.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {recentAnnouncements.slice(0, 3).map((announcement) => (
        <div
          key={announcement._id || announcement.id}
          className="bg-white rounded-lg shadow-lg border-l-4 border-primary-600 p-4 flex items-start gap-3 animate-slide-in"
        >
          <div className="p-2 bg-primary-100 rounded-full">
            <Bell size={20} className="text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">
              {announcement.title}
            </h4>
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
              {announcement.content?.replace(/<[^>]*>/g, '').substring(0, 100)}...
            </p>
            <Link
              to={`/announcements/${announcement._id || announcement.id}`}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Read more →
            </Link>
          </div>
          <button
            onClick={() => handleDismiss(announcement._id || announcement.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss notification"
          >
            <X size={18} />
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default AnnouncementNotification

