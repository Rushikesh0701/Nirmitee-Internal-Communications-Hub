import { useEffect, useRef } from 'react'
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
 * Hook to play notification sound when new notifications arrive
 */
export const useNotificationSound = () => {
    const previousCount = useRef(0)
    const audioRef = useRef(null)

    const { data: unreadData } = useQuery(
        'unreadCount',
        () => notificationApi.getUnreadCount(),
        {
            refetchInterval: 30000
        }
    )

    const currentCount = unreadData?.data?.data?.unreadCount || 0

    useEffect(() => {
        // Play sound only when count increases (new notification)
        if (currentCount > previousCount.current && previousCount.current !== 0) {
            playNotificationSound()
        }
        previousCount.current = currentCount
    }, [currentCount])

    const playNotificationSound = () => {
        try {
            // Create audio element if it doesn't exist
            if (!audioRef.current) {
                audioRef.current = new Audio()
                // Use a data URL for a simple notification sound (soft ding)
                audioRef.current.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQAJVqjZ5LiVJwADPpLd6sKoRAAAKHjN7te/YgAADluy3O/OpHUAABdKot3y06qGAAAQPpPZ7du4lgAACjSI1fTgy6YAAAR2xPHk07MAAAB0wO/p2bwAAACByO/r274AAACJ0O7t38EAAACNzfDt4cAAAACZzunw4L0AAACVy+Tu4bwAAACXzObu4LwAAACVzOjw4b0AAACW0Ony4r8AAACR0PDy4sAAAJDP8vLiv/'
                audioRef.current.volume = 0.3 // Subtle volume
            }
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(() => {
                // Ignore autoplay errors (browser policy)
            })
        } catch (e) {
            // Ignore audio errors
        }
    }

    return { playNotificationSound }
}

export default useDocumentTitle
