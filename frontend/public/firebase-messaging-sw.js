// ============================================
// Firebase Cloud Messaging — Service Worker
// Handles background push notifications
// ============================================

// Firebase v9+ compat SDK for service worker context
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Firebase config — injected from environment variables at build time
firebase.initializeApp({
    apiKey: '__VITE_FIREBASE_API_KEY__',
    authDomain: '__VITE_FIREBASE_AUTH_DOMAIN__',
    projectId: '__VITE_FIREBASE_PROJECT_ID__',
    storageBucket: '__VITE_FIREBASE_STORAGE_BUCKET__',
    messagingSenderId: '__VITE_FIREBASE_MESSAGING_SENDER_ID__',
    appId: '__VITE_FIREBASE_APP_ID__'
});

const messaging = firebase.messaging();

// ============================================
// Default notification options
// ============================================
const DEFAULT_ICON = '/favicon-192x192.png';
const DEFAULT_BADGE = '/favicon-32x32.png';

// ============================================
// Background message handler
// Fires when app is in background or closed
// ============================================
messaging.onBackgroundMessage((payload) => {
    console.log('[FCM SW] Background message received:', payload);

    // Data-only payload — all fields are in payload.data
    const data = payload.data || {};

    const title = data.title || 'Nirmitee Hub';
    const options = {
        body: data.body || '',
        icon: data.image || DEFAULT_ICON,
        badge: DEFAULT_BADGE,
        image: data.image || undefined,
        vibrate: [100, 50, 100],
        tag: data.notificationId || `nirmitee-${Date.now()}`,
        renotify: true,
        data: {
            url: data.url || '/',
            notificationId: data.notificationId || '',
            module: data.module || '',
            type: data.type || ''
        },
        actions: [
            { action: 'open', title: 'Open' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };

    // High priority notifications require interaction
    if (data.priority === 'high') {
        options.requireInteraction = true;
    }

    return self.registration.showNotification(title, options);
});

// ============================================
// Notification click handler
// ============================================
self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const data = notification.data || {};
    const action = event.action;

    notification.close();

    // Dismiss action — do nothing
    if (action === 'dismiss') return;

    // Build target URL
    const baseUrl = self.location.origin;
    const targetUrl = data.url ? `${baseUrl}${data.url}` : baseUrl;

    event.waitUntil(
        (async () => {
            // Track click analytics
            if (data.notificationId) {
                try {
                    // Determine API base URL
                    const apiBase = baseUrl.includes('localhost')
                        ? 'http://localhost:5002/api'
                        : `${baseUrl}/api`;

                    await fetch(`${apiBase}/push-notifications/track-click`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ notificationId: data.notificationId }),
                        keepalive: true
                    });
                } catch (err) {
                    console.warn('[FCM SW] Click tracking failed:', err);
                }
            }

            // Focus existing tab or open new one
            const clientList = await self.clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            });

            // Try to find an existing tab with the app
            for (const client of clientList) {
                if (client.url.startsWith(baseUrl) && 'focus' in client) {
                    await client.focus();
                    // Navigate to the target URL
                    client.postMessage({
                        type: 'NOTIFICATION_CLICK',
                        url: data.url || '/',
                        notificationId: data.notificationId
                    });
                    return;
                }
            }

            // No existing tab — open a new one
            if (self.clients.openWindow) {
                await self.clients.openWindow(targetUrl);
            }
        })()
    );
});

// ============================================
// Handle push subscription change
// ============================================
self.addEventListener('pushsubscriptionchange', (event) => {
    console.log('[FCM SW] Push subscription changed');
    // Subscription renewal is handled by Firebase SDK
});
