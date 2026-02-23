// ============================================
// Nirmitee Hub — Service Worker
// Cache-First for static assets, Network-First for API
// ============================================

const CACHE_VERSION = 'v3';
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
const NETWORK_TIMEOUT = 10000; // 10s - generous for production cold starts
const API_NETWORK_TIMEOUT = 15000; // Longer timeout for API calls (external APIs can be slow)

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

    // Skip cross-origin requests entirely (e.g., API calls to Render backend)
    // The SW can't reliably cache these and timeouts cause false 503 errors
    if (url.origin !== self.location.origin) return;

    // Route: API requests → Network-First
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request, API_CACHE, API_NETWORK_TIMEOUT));
        return;
    }

    // Route: Navigation requests → Network-First (always try fresh HTML)
    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request, DYNAMIC_CACHE, NETWORK_TIMEOUT));
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
    event.respondWith(networkFirst(request, DYNAMIC_CACHE, NETWORK_TIMEOUT));
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
        // Always return the actual server response (even errors)
        return networkResponse;
    } catch (error) {
        // True network failure (offline, DNS failure, etc.)
        return offlineResponse();
    }
}

/**
 * Network-First: Try network with timeout, fallback to cache
 */
async function networkFirst(request, cacheName, timeout = NETWORK_TIMEOUT) {
    try {
        const networkResponse = await Promise.race([
            fetch(request),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Network timeout')), timeout)
            ),
        ]);

        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        // Return actual server response even if not ok (e.g. real 500s)
        // This prevents the SW from masking real errors with a synthetic 503
        return networkResponse;
    } catch (error) {
        // Only reach here on true network failure or timeout
        console.warn('[SW] Network failed for:', request.url, error.message);

        const cached = await caches.match(request);
        if (cached) {
            console.log('[SW] Serving from cache:', request.url);
            return cached;
        }

        // For navigation requests, return cached index.html (SPA fallback)
        if (request.mode === 'navigate') {
            const fallback = await caches.match('/index.html');
            if (fallback) return fallback;
        }

        return offlineResponse();
    }
}

// ============================================
// HELPERS
// ============================================

function isStaticAsset(pathname) {
    return CACHEABLE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}

/**
 * Generate a user-friendly offline response instead of a bare 503
 */
function offlineResponse() {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline — Nirmitee Hub</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
               display: flex; align-items: center; justify-content: center;
               min-height: 100vh; background: #0f172a; color: #e2e8f0; text-align: center; padding: 2rem; }
        .container { max-width: 420px; }
        .icon { font-size: 4rem; margin-bottom: 1rem; }
        h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #f8fafc; }
        p { color: #94a3b8; line-height: 1.6; margin-bottom: 1.5rem; }
        button { background: #3b82f6; color: #fff; border: none; padding: 0.75rem 2rem;
                 border-radius: 0.5rem; font-size: 1rem; cursor: pointer; transition: background 0.2s; }
        button:hover { background: #2563eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">📡</div>
        <h1>You're Offline</h1>
        <p>It looks like your connection is down or the server is waking up. Please check your internet and try again.</p>
        <button onclick="location.reload()">Retry</button>
    </div>
</body>
</html>`;
    return new Response(html, {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/html' },
    });
}

// Listen for messages from the app (e.g., skip waiting on update)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
