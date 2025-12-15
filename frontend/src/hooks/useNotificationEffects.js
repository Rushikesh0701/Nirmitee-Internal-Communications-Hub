import { useEffect, useRef, useCallback } from 'react'
import { useQuery } from 'react-query'
import { notificationApi } from '../services/notificationApi'
import notificationSound from '../assets/Sound.mp3'

// Global audio element
let audioElement = null

/**
 * Initialize and get the audio element
 */
const initAudio = () => {
    if (!audioElement) {
        audioElement = new Audio(notificationSound)
        audioElement.volume = 1.0
        audioElement.preload = 'auto'

        audioElement.addEventListener('canplaythrough', () => {
            console.log('✅ Notification sound loaded and ready!')
        })

        audioElement.addEventListener('error', (e) => {
            console.error('❌ Error loading notification sound:', e)
        })
    }
    return audioElement
}

// Initialize audio immediately
initAudio()

/**
 * Play notification sound
 */
export const playNotificationSound = () => {
    const audio = initAudio()

    if (!audio) return

    audio.currentTime = 0
    audio.play()
        .then(() => console.log('🔊 Sound played!'))
        .catch(err => console.log('🔇 Sound blocked:', err.message))
}

/**
 * Request browser notification permission
 */
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.log('Browser does not support notifications')
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
        console.log('🔇 Notification permission not granted')
        return
    }

    try {
        const notification = new Notification(title, {
            body,
            icon: '/Logo.png', // Use your app logo
            badge: '/Logo.png',
            tag: 'nirmitee-notification', // Prevents duplicate notifications
            requireInteraction: false,
            silent: false // Allow system sound
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

        console.log('📢 Browser notification shown:', title)
    } catch (e) {
        console.error('Error showing notification:', e)
    }
}

/**
 * Hook to update document title with unread notification count
 */
export const useDocumentTitle = (baseTitle = 'Nirmitee Hub') => {
    const { data: unreadData } = useQuery(
        'unreadCount',
        () => notificationApi.getUnreadCount(),
        { refetchInterval: 30000 }
    )

    const unreadCount = unreadData?.data?.data?.unreadCount || 0

    useEffect(() => {
        document.title = unreadCount > 0
            ? `(${unreadCount > 99 ? '99+' : unreadCount}) ${baseTitle}`
            : baseTitle

        return () => { document.title = baseTitle }
    }, [unreadCount, baseTitle])

    return unreadCount
}

/**
 * Hook to play notification sound and show browser notification for ALL new notifications
 */
export const useNotificationSound = () => {
    const seenIds = useRef(new Set())
    const isFirstLoad = useRef(true)

    // Request notification permission on mount
    useEffect(() => {
        requestNotificationPermission().then(granted => {
            if (granted) {
                console.log('✅ Browser notification permission granted!')
            } else {
                console.log('⚠️ Browser notification permission not granted')
            }
        })
    }, [])

    // Poll for notifications
    const { data } = useQuery(
        'notifications',
        () => notificationApi.getNotifications({ limit: 20 }),
        { refetchInterval: 10000 } // Every 10 seconds
    )

    const notifications = data?.data?.data?.notifications || []

    useEffect(() => {
        if (notifications.length === 0) return

        // First load - just record IDs
        if (isFirstLoad.current) {
            notifications.forEach(n => seenIds.current.add(n.id || n._id))
            console.log('📋 Loaded', seenIds.current.size, 'existing notifications')
            isFirstLoad.current = false
            return
        }

        // Check for new notifications
        notifications.forEach(n => {
            const id = n.id || n._id
            if (!seenIds.current.has(id)) {
                seenIds.current.add(id)
                console.log('🆕 New notification:', n.content?.substring(0, 50))

                // Only show browser notification when tab is NOT focused (user is on another site)
                // When user is on this site, they'll see the in-app notification card
                if (document.hidden) {
                    showBrowserNotification(
                        'Nirmitee Hub',
                        n.content || 'You have a new notification',
                        () => {
                            window.location.href = '/notifications'
                        }
                    )
                } else {
                    console.log('📱 Tab is focused - showing in-app notification only')
                }
            }
        })
    }, [notifications])

    return { playSound: playNotificationSound }
}

export default useDocumentTitle
