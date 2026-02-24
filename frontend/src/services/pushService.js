/**
 * Push Notification Service
 * Manages FCM token lifecycle, foreground message handling, and topic subscriptions
 */
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import api from './api';

// Firebase config — loaded from environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// ============================================
// Initialization
// ============================================

let firebaseApp = null;
let messaging = null;
let initialized = false;

const getFirebaseMessaging = () => {
    if (!firebaseApp) {
        firebaseApp = initializeApp(firebaseConfig);
    }
    if (!messaging) {
        messaging = getMessaging(firebaseApp);
    }
    return messaging;
};

// ============================================
// Storage helpers
// ============================================

const STORAGE_KEYS = {
    TOKEN: 'fcm_token',
    TIMESTAMP: 'fcm_token_timestamp'
};

const TOKEN_REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

const getStoredToken = () => localStorage.getItem(STORAGE_KEYS.TOKEN);
const getStoredTimestamp = () => parseInt(localStorage.getItem(STORAGE_KEYS.TIMESTAMP) || '0', 10);

const storeToken = (token) => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
};

// ============================================
// Device info detection
// ============================================

const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let browser = 'unknown';
    let platform = 'unknown';

    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edg')) browser = 'Edge';

    if (ua.includes('Windows')) platform = 'Windows';
    else if (ua.includes('Mac')) platform = 'macOS';
    else if (ua.includes('Linux')) platform = 'Linux';
    else if (ua.includes('Android')) platform = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) platform = 'iOS';

    return { browser, platform, appVersion: '1.0.0' };
};

// ============================================
// Core: Initialize Push Notifications
// ============================================

/**
 * Initialize push notifications:
 * 1. Wait for Service Worker to be ready
 * 2. Request notification permission
 * 3. Get FCM token
 * 4. Register token with backend (with reconciliation)
 * 5. Set up foreground message listener
 */
export const initializePush = async () => {
    // Guard: only initialize once per session
    if (initialized) return;

    // Check browser support
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
        console.warn('[Push] Push notifications not supported in this browser');
        return;
    }

    try {
        // 1. Register the FCM service worker
        const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/firebase-cloud-messaging-push-scope'
        });
        console.log('[Push] FCM Service Worker registered');

        // Wait for SW to be active
        await navigator.serviceWorker.ready;

        // 2. Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn('[Push] Notification permission denied');
            return;
        }

        // 3. Get FCM token
        const msg = getFirebaseMessaging();
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined;

        const currentToken = await getToken(msg, {
            vapidKey,
            serviceWorkerRegistration: swRegistration
        });

        if (!currentToken) {
            console.warn('[Push] Failed to get FCM token');
            return;
        }

        console.log('[Push] FCM token obtained');

        // 4. Token reconciliation
        const storedToken = getStoredToken();
        const storedTimestamp = getStoredTimestamp();
        const now = Date.now();
        const tokenChanged = storedToken !== currentToken;
        const tokenExpired = (now - storedTimestamp) > TOKEN_REFRESH_INTERVAL;

        if (tokenChanged || tokenExpired) {
            const deviceInfo = getDeviceInfo();

            await api.post('/push-notifications/register-token', {
                token: currentToken,
                ...deviceInfo
            });

            storeToken(currentToken);
            console.log('[Push] Token registered with backend', {
                reason: tokenChanged ? 'token_changed' : 'token_expired'
            });
        }

        // 5. Set up foreground message listener
        setupForegroundListener(msg, swRegistration);

        // 6. Listen for notification click messages from SW
        setupClickNavigation();

        initialized = true;
        console.log('[Push] Push notification service initialized');
    } catch (error) {
        console.error('[Push] Initialization failed:', error);
    }
};

// ============================================
// Foreground message handling
// ============================================

/**
 * Handle messages received while app is in the foreground.
 * Uses the Service Worker to show the notification (no toast UI).
 */
const setupForegroundListener = (msg, swRegistration) => {
    onMessage(msg, (payload) => {
        console.log('[Push] Foreground message received:', payload);

        const data = payload.data || {};

        const title = data.title || 'Nirmitee Hub';
        const options = {
            body: data.body || '',
            icon: data.image || '/favicon-192x192.png',
            badge: '/favicon-32x32.png',
            vibrate: [100, 50, 100],
            tag: data.notificationId || `nirmitee-fg-${Date.now()}`,
            renotify: true,
            data: {
                url: data.url || '/',
                notificationId: data.notificationId || '',
                module: data.module || '',
                type: data.type || ''
            }
        };

        // Try to play sound
        try {
            const audio = new Audio('/sounds/notification.mp3');
            audio.play().catch(e => console.warn('Could not play notification sound:', e));
        } catch (e) {
            // Ignore audio errors
        }

        // Show via Service Worker (consistent foreground/background behavior)
        if (swRegistration && swRegistration.showNotification) {
            swRegistration.showNotification(title, options);
        } else if (Notification.permission === 'granted') {
            // Fallback to standard Notification API if SW registration is somehow unavailable
            const notification = new Notification(title, options);
            notification.onclick = () => {
                window.focus();
                if (data.url) {
                    window.location.href = data.url;
                }
                notification.close();
            };
        }
    });
};

// ============================================
// Click navigation from SW messages
// ============================================

const setupClickNavigation = () => {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'NOTIFICATION_CLICK' && event.data.url) {
            // Use React Router navigation if available, else fallback
            window.location.href = event.data.url;
        }
    });
};

// ============================================
// Topic management
// ============================================

export const subscribeTopic = async (topic) => {
    try {
        await api.post('/push-notifications/subscribe', { topic });
        console.log(`[Push] Subscribed to topic: ${topic}`);
    } catch (error) {
        console.error(`[Push] Failed to subscribe to ${topic}:`, error);
    }
};

export const unsubscribeTopic = async (topic) => {
    try {
        await api.post('/push-notifications/unsubscribe', { topic });
        console.log(`[Push] Unsubscribed from topic: ${topic}`);
    } catch (error) {
        console.error(`[Push] Failed to unsubscribe from ${topic}:`, error);
    }
};

export default {
    initializePush,
    subscribeTopic,
    unsubscribeTopic
};
