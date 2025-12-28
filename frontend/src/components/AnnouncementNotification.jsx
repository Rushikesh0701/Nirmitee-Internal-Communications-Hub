import { useState, useEffect, useRef } from 'react'
import { useQuery } from 'react-query'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { playNotificationSound } from '../hooks/useNotificationEffects'
import { useTheme } from '../contexts/ThemeContext'
import { Bell, X } from 'lucide-react'

// Development-only debug logger
const debugLog = (...args) => {
    if (import.meta.env.DEV) {
        console.log(...args)
    }
}

/**
 * Notification component for scheduled announcements
 * 
 * Features:
 * - Auto-dismisses after 3 seconds
 * - "Read More" click immediately dismisses the notification
 * - Slide-in animation
 * - Excludes announcements created by the current user
 * - Plays sound only after user interaction (browser policy)
 */
const AnnouncementNotification = () => {
  const { isAuthenticated, user } = useAuthStore()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [dismissedIds, setDismissedIds] = useState(() => {
    const stored = localStorage.getItem('dismissedAnnouncements')
    return stored ? JSON.parse(stored) : []
  })
  const timersRef = useRef({})
  const soundPlayedRef = useRef(new Set())
  const userInteracted = useRef(false)

  // Track user interaction for audio playback
  useEffect(() => {
    const handleInteraction = () => {
      userInteracted.current = true
    }
    document.addEventListener('click', handleInteraction)
    document.addEventListener('keydown', handleInteraction)
    return () => {
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
    }
  }, [])

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
  
  // Get current user's MongoDB ID (could be in different places depending on user object structure)
  const currentUserId = user?.mongoUserId || user?._id || user?.id
  
  // Filter out dismissed announcements, announcements by current user, and show only recent ones (last 24 hours)
  const recentAnnouncements = announcements.filter((announcement) => {
    // Filter out dismissed
    if (dismissedIds.includes(announcement._id || announcement.id)) {
      return false
    }
    
    // Filter out announcements created by current user
    const creatorId = announcement.createdBy?._id || announcement.createdBy
    if (currentUserId && creatorId && creatorId.toString() === currentUserId.toString()) {
      return false
    }
    
    // Only show recent (last 24 hours)
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

  // Auto-dismiss after 3 seconds and play sound for new announcements
  useEffect(() => {
    recentAnnouncements.forEach((announcement) => {
      const id = announcement._id || announcement.id
      
      // Play sound for new announcements (only once per announcement)
      if (!soundPlayedRef.current.has(id)) {
        soundPlayedRef.current.add(id)
        debugLog('🔔 Playing sound for announcement card:', announcement.title)
        playNotificationSound()
      }
      
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
          onClick={() => handleReadMore(announcement)}
          className={`rounded-lg border-l-4 p-4 flex items-start gap-3 animate-slide-in cursor-pointer ${
            theme === 'dark'
              ? 'bg-[#0a0e17]/90 border-indigo-500'
              : 'bg-white border-primary-600'
          }`}
        >
          <div className={`p-2 rounded-full ${
            theme === 'dark' 
              ? 'bg-indigo-500/20' 
              : 'bg-primary-100'
          }`}>
            <Bell size={20} className={theme === 'dark' ? 'text-indigo-400' : 'text-primary-600'} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold mb-1 line-clamp-1 ${
              theme === 'dark' ? 'text-slate-200' : 'text-gray-900'
            }`}>
              {announcement.title}
            </h4>
            <p className={`text-sm line-clamp-2 mb-2 ${
              theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
            }`}>
              {announcement.content?.replace(/<[^>]*>/g, '').substring(0, 100)}...
            </p>
            <span className={`text-button ${
              theme === 'dark'
                ? 'text-indigo-400 hover:text-indigo-300'
                : 'text-primary-600 hover:text-primary-700'
            }`}>
              Read more →
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation() // Prevent card click from triggering
              handleDismiss(announcement._id || announcement.id)
            }}
            className={`transition-colors ${
              theme === 'dark'
                ? 'text-slate-500 hover:text-slate-300'
                : 'text-gray-400 hover:text-gray-600'
            }`}
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
