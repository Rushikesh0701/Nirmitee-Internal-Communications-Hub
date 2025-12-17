import { useEffect, useRef } from 'react'
import { useQuery } from 'react-query'
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
            silent: false
        })

        // Play custom sound
        playNotificationSound()

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
    const { data: unreadData } = useQuery(
        'unreadCount',
        () => notificationApi.getUnreadCount(),
        {
            refetchInterval: 30000,
            staleTime: 20000
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
 */
export const useNotificationSound = () => {
    const seenIds = useRef(new Set())
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
            staleTime: 5000
        }
    )

    const notifications = data?.data?.data?.notifications || []

    useEffect(() => {
        if (notifications.length === 0) return

        // First load - just record existing IDs
        if (isFirstLoad.current) {
            notifications.forEach(n => seenIds.current.add(n.id || n._id))
            isFirstLoad.current = false
            return
        }

        // Check for new notifications
        notifications.forEach(n => {
            const id = n.id || n._id
            if (!seenIds.current.has(id)) {
                seenIds.current.add(id)

                // Only show browser notification when tab is not focused
                // When tab is focused, in-app notification card will be shown
                if (document.hidden) {
                    showBrowserNotification(
                        'Nirmitee Hub',
                        n.content || 'You have a new notification',
                        () => {
                            window.location.href = '/notifications'
                        }
                    )
                }
            }
        })
    }, [notifications])

    return { playSound: playNotificationSound }
}

export default useDocumentTitle
