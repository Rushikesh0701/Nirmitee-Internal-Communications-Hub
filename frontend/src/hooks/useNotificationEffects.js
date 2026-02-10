import { useEffect, useRef } from 'react'
import { useQuery } from 'react-query'
import { useAuthStore } from '../store/authStore'
import { notificationApi } from '../services/notificationApi'
import notificationSound from '../assets/Sound.mp3'

/**
 * Global audio element for notification sound
 */
let audioElement = null

/**
 * Initialize audio element (lazy loading)
 */
const getAudioElement = () => {
    if (!audioElement) {
        audioElement = new Audio(notificationSound)
        audioElement.volume = 1.0
        audioElement.preload = 'auto'
    }
    return audioElement
}

/**
 * Play notification sound
 */
export const playNotificationSound = () => {
    try {
        const audio = getAudioElement()
        audio.currentTime = 0
        audio.play().catch(() => {
            // Silently handle autoplay restrictions
        })
    } catch (error) {
        console.error('Error playing notification sound:', error)
    }
}

/**
 * Request browser notification permission
 */
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        return false
    }

    if (Notification.permission === 'granted') {
        return true
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
    }

    return false
}

/**
 * Show browser notification (works even when tab is not focused)
 * Note: Sound is played separately by the notification hook
 */
export const showBrowserNotification = (title, body, onClick) => {
    if (Notification.permission !== 'granted') {
        return
    }

    try {
        const notification = new Notification(title, {
            body,
            icon: '/Logo.png',
            badge: '/Logo.png',
            tag: 'nirmitee-notification',
            requireInteraction: false,
            silent: true // Set to silent since we play sound separately
        })

        notification.onclick = () => {
            window.focus()
            if (onClick) onClick()
            notification.close()
        }

        // Auto close after 5 seconds
        setTimeout(() => notification.close(), 5000)
    } catch (error) {
        console.error('Error showing notification:', error)
    }
}

/**
 * Hook to update document title with unread notification count
 */
export const useDocumentTitle = (baseTitle = 'Nirmitee Hub') => {
    const { isAuthenticated } = useAuthStore()
    const { data: unreadData } = useQuery(
        'unreadCount',
        () => notificationApi.getUnreadCount(),
        {
            refetchInterval: 30000,
            staleTime: 20000,
            enabled: !!isAuthenticated
        }
    )

    const unreadCount = unreadData?.data?.data?.unreadCount || 0

    useEffect(() => {
        document.title = unreadCount > 0
            ? `(${unreadCount > 99 ? '99+' : unreadCount}) ${baseTitle}`
            : baseTitle

        return () => {
            document.title = baseTitle
        }
    }, [unreadCount, baseTitle])

    return unreadCount
}

/**
 * Hook to handle notification sound and browser notifications for new notifications
 * 
 * Features:
 * - Plays sound for ALL new notifications (regardless of visibility)
 * - Shows browser notification when tab is hidden
 * - Shows in-app toast when tab is visible
 * - Prevents duplicate sounds and notifications
 */
export const useNotificationSound = () => {
    const { isAuthenticated } = useAuthStore()
    const seenIds = useRef(new Set())
    const soundPlayedIds = useRef(new Set())
    const isFirstLoad = useRef(true)

    // Request notification permission on mount
    useEffect(() => {
        requestNotificationPermission()
    }, [])

    // Poll for notifications
    const { data } = useQuery(
        'notifications',
        () => notificationApi.getNotifications({ limit: 20 }),
        {
            refetchInterval: 10000,
            staleTime: 5000,
            enabled: !!isAuthenticated
        }
    )

    const notifications = data?.data?.data?.notifications || []

    useEffect(() => {
        if (notifications.length === 0) return

        // First load - just record existing IDs
        if (isFirstLoad.current) {
            notifications.forEach(n => {
                const id = n.id || n._id
                seenIds.current.add(id)
                soundPlayedIds.current.add(id)
            })
            isFirstLoad.current = false
            return
        }

        // Dynamic import for react-hot-toast to avoid bundling if not needed
        const processNotifications = async () => {
            // Import toast dynamically
            const { default: toast } = await import('react-hot-toast')

            // Check for new notifications
            notifications.forEach(n => {
                const id = n.id || n._id
                const content = n.content || 'You have a new notification'

                // Process truly new notifications (not seen before)
                if (!seenIds.current.has(id)) {
                    seenIds.current.add(id)

                    // 1. ALWAYS play sound for new notifications (once per notification)
                    if (!soundPlayedIds.current.has(id)) {
                        soundPlayedIds.current.add(id)
                        playNotificationSound()
                    }

                    // 2. Check tab visibility for notification display
                    if (document.hidden) {
                        // Tab is hidden - show browser notification (OS-level toast)
                        showBrowserNotification(
                            'Nirmitee Hub',
                            content,
                            () => {
                                window.location.href = '/notifications'
                            }
                        )
                    } else {
                        // Tab is visible - show in-app toast notification
                        toast(content, {
                            icon: '🔔',
                            duration: 4000,
                            position: 'top-right',
                            style: {
                                background: '#4F46E5',
                                color: '#fff',
                                padding: '16px',
                                borderRadius: '8px',
                            },
                            onClick: () => {
                                window.location.href = '/notifications'
                            }
                        })
                    }
                }
            })
        }

        processNotifications().catch(err => {
            console.error('Error processing notifications:', err)
        })
    }, [notifications])

    return { playSound: playNotificationSound }
}

export default useDocumentTitle
