import { useEffect, useRef, useCallback } from 'react'
import { useQuery } from 'react-query'
import { notificationApi } from '../services/notificationApi'
import notificationSound from '../assets/Sound.mp3'

// Global audio element
let audioElement = null
let audioInitialized = false

/**
 * Initialize and get the audio element
 */
const initAudio = () => {
    if (!audioElement) {
        audioElement = new Audio(notificationSound)
        audioElement.volume = 1.0
        audioElement.preload = 'auto'

        // Log when audio is ready
        audioElement.addEventListener('canplaythrough', () => {
            console.log('✅ Notification sound loaded and ready!')
            audioInitialized = true
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
 * Play notification sound - exported for use anywhere
 */
export const playNotificationSound = () => {
    const audio = initAudio()

    if (!audio) {
        console.log('❌ No audio element')
        return
    }

    // Reset and play
    audio.currentTime = 0
    const playPromise = audio.play()

    if (playPromise !== undefined) {
        playPromise
            .then(() => console.log('🔊 Sound played!'))
            .catch(err => console.log('🔇 Autoplay blocked:', err.message))
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
 * Hook to play notification sound for ALL new notifications
 */
export const useNotificationSound = () => {
    const seenIds = useRef(new Set())
    const isFirstLoad = useRef(true)
    const userClicked = useRef(false)

    // Unlock audio on first user interaction
    useEffect(() => {
        const unlock = () => {
            userClicked.current = true
            // Try to play and immediately pause to unlock audio
            const audio = initAudio()
            if (audio) {
                audio.play().then(() => {
                    audio.pause()
                    audio.currentTime = 0
                    console.log('🔓 Audio unlocked!')
                }).catch(() => { })
            }
        }

        document.addEventListener('click', unlock, { once: true })
        document.addEventListener('keydown', unlock, { once: true })

        return () => {
            document.removeEventListener('click', unlock)
            document.removeEventListener('keydown', unlock)
        }
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
        let newCount = 0
        notifications.forEach(n => {
            const id = n.id || n._id
            if (!seenIds.current.has(id)) {
                seenIds.current.add(id)
                newCount++
                console.log('🆕 New notification:', n.content?.substring(0, 50))
            }
        })

        // Play sound for each new notification
        if (newCount > 0 && userClicked.current) {
            console.log(`🔔 Playing ${newCount} notification sound(s)`)
            for (let i = 0; i < Math.min(newCount, 3); i++) { // Max 3 sounds
                setTimeout(() => playNotificationSound(), i * 400)
            }
        }
    }, [notifications])

    return { playSound: playNotificationSound }
}

export default useDocumentTitle
