import { useEffect, useRef, useCallback } from 'react'
import { useQuery } from 'react-query'
import { notificationApi } from '../services/notificationApi'

/**
 * Hook to update document title with unread notification count
 * Shows "(3) Nirmitee Hub" when there are 3 unread notifications
 */
export const useDocumentTitle = (baseTitle = 'Nirmitee Hub') => {
    const { data: unreadData } = useQuery(
        'unreadCount',
        () => notificationApi.getUnreadCount(),
        {
            refetchInterval: 30000 // Poll every 30 seconds
        }
    )

    const unreadCount = unreadData?.data?.data?.unreadCount || 0

    useEffect(() => {
        if (unreadCount > 0) {
            document.title = `(${unreadCount > 99 ? '99+' : unreadCount}) ${baseTitle}`
        } else {
            document.title = baseTitle
        }

        // Cleanup on unmount
        return () => {
            document.title = baseTitle
        }
    }, [unreadCount, baseTitle])

    return unreadCount
}

/**
 * Generate a notification "ding" sound using Web Audio API
 * More reliable than base64 audio files
 */
const playNotificationDing = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        if (!AudioContext) return

        const audioContext = new AudioContext()

        // Create oscillator for the main tone
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        // Pleasant notification sound (E6 note - 1318.51 Hz)
        oscillator.frequency.setValueAtTime(1318.51, audioContext.currentTime)
        oscillator.type = 'sine'

        // Quick fade in and out for a gentle "ding"
        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)

        // Clean up
        oscillator.onended = () => {
            oscillator.disconnect()
            gainNode.disconnect()
            audioContext.close()
        }
    } catch (e) {
        // Ignore audio errors (browser policy, etc.)
        console.log('Notification sound not available:', e.message)
    }
}

/**
 * Hook to play notification sound when new notifications arrive
 */
export const useNotificationSound = () => {
    const previousCount = useRef(0)
    const hasInteracted = useRef(false)

    // Track user interaction for autoplay policy
    useEffect(() => {
        const handleInteraction = () => {
            hasInteracted.current = true
        }

        document.addEventListener('click', handleInteraction, { once: true })
        document.addEventListener('keydown', handleInteraction, { once: true })

        return () => {
            document.removeEventListener('click', handleInteraction)
            document.removeEventListener('keydown', handleInteraction)
        }
    }, [])

    const { data: unreadData } = useQuery(
        'unreadCount',
        () => notificationApi.getUnreadCount(),
        {
            refetchInterval: 30000
        }
    )

    const currentCount = unreadData?.data?.data?.unreadCount || 0

    const playSound = useCallback(() => {
        if (hasInteracted.current) {
            playNotificationDing()
        }
    }, [])

    useEffect(() => {
        // Play sound only when count increases (new notification)
        if (currentCount > previousCount.current && previousCount.current !== 0) {
            playSound()
        }
        previousCount.current = currentCount
    }, [currentCount, playSound])

    return { playSound }
}

export default useDocumentTitle
