// ============================================
// Nirmitee Hub — Service Worker
// Cache-First for static assets, Network-First for API
// ============================================

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `nirmitee-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `nirmitee-dynamic-${CACHE_VERSION}`;
const API_CACHE = `nirmitee-api-${CACHE_VERSION}`;

// Core app shell files to pre-cache on install
const APP_SHELL = [
    '/',
    '/index.html',
    '/manifest.json',
];

// File extensions that should use Cache-First strategy
const CACHEABLE_EXTENSIONS = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
    '.woff', '.woff2', '.ttf', '.eot', '.ico'
];

// Network timeout before falling back to cache (ms)
const NETWORK_TIMEOUT = 3000;

// ============================================
// INSTALL — Pre-cache app shell
// ============================================
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Pre-caching app shell');
                return cache.addAll(APP_SHELL);
            })
            .then(() => self.skipWaiting()) // Activate immediately
    );
});

// ============================================
// ACTIVATE — Clean up old caches
// ============================================
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => {
                            // Delete caches from older versions
                            return (
                                name.startsWith('nirmitee-') &&
                                name !== STATIC_CACHE &&
                                name !== DYNAMIC_CACHE &&
                                name !== API_CACHE
                            );
                        })
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim()) // Take control immediately
    );
});

// ============================================
// FETCH — Routing strategies
// ============================================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) return;

    // Skip Clerk auth requests (must always be fresh)
    if (url.hostname.includes('clerk') || url.hostname.includes('accounts')) return;

    // Route: API requests → Network-First
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request, API_CACHE));
        return;
    }

    // Route: Navigation requests → Network-First (always try fresh HTML)
    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request, DYNAMIC_CACHE));
        return;
    }

    // Route: Static assets → Cache-First
    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
        return;
    }

    // Route: Google Fonts and external CDN → Cache-First
    if (
        url.hostname === 'fonts.googleapis.com' ||
        url.hostname === 'fonts.gstatic.com'
    ) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
        return;
    }

    // Default: Network-First for everything else
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// ============================================
// STRATEGIES
// ============================================

/**
 * Cache-First: Try cache, fallback to network (and update cache)
 */
async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        // If both cache and network fail, return a basic offline response
        return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' },
        });
    }
}

/**
 * Network-First: Try network with timeout, fallback to cache
 */
async function networkFirst(request, cacheName) {
    try {
        const networkResponse = await Promise.race([
            fetch(request),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Network timeout')), NETWORK_TIMEOUT)
            ),
        ]);

        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }

        // For navigation requests, return cached index.html (SPA fallback)
        if (request.mode === 'navigate') {
            const fallback = await caches.match('/index.html');
            if (fallback) return fallback;
        }

        return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' },
        });
    }
}

// ============================================
// HELPERS
// ============================================

function isStaticAsset(pathname) {
    return CACHEABLE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}

// Listen for messages from the app (e.g., skip waiting on update)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
