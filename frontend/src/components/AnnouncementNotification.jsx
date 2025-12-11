import { useState, useEffect, useRef } from 'react'
import { useQuery } from 'react-query'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { Bell, X } from 'lucide-react'

/**
 * Notification component for scheduled announcements
 * 
 * Features:
 * - Auto-dismisses after 3 seconds
 * - "Read More" click immediately dismisses the notification
 * - Slide-in animation
 */
const AnnouncementNotification = () => {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [dismissedIds, setDismissedIds] = useState(() => {
    const stored = localStorage.getItem('dismissedAnnouncements')
    return stored ? JSON.parse(stored) : []
  })
  const timersRef = useRef({})

  // Poll for new announcements
  const { data } = useQuery(
    'newAnnouncements',
    () => api.get('/announcements?limit=5&published=true').then((res) => res.data.data),
    {
      enabled: isAuthenticated,
      refetchInterval: isAuthenticated ? 60000 : false,
      refetchOnWindowFocus: isAuthenticated
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
    // Clear any existing timer for this notification
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id])
      delete timersRef.current[id]
    }
    
    const newDismissed = [...dismissedIds, id]
    setDismissedIds(newDismissed)
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed))
  }

  const handleReadMore = (announcement) => {
    const id = announcement._id || announcement.id
    handleDismiss(id)
    navigate(`/announcements/${id}`)
  }

  // Auto-dismiss after 3 seconds
  useEffect(() => {
    recentAnnouncements.forEach((announcement) => {
      const id = announcement._id || announcement.id
      
      // Only set timer if not already set
      if (!timersRef.current[id]) {
        timersRef.current[id] = setTimeout(() => {
          handleDismiss(id)
        }, 3000) // 3 seconds
      }
    })

    // Cleanup timers on unmount
    return () => {
      Object.values(timersRef.current).forEach(timer => clearTimeout(timer))
    }
  }, [recentAnnouncements])

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
            <button
              onClick={() => handleReadMore(announcement)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Read more →
            </button>
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
