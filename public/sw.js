// Service Worker for offline support and caching
// Optimized for low-connectivity areas in Belize

const CACHE_NAME = 'agritech-v3'
const STATIC_CACHE = 'agritech-static-v3'
const API_CACHE = 'agritech-api-v3'
const IMAGE_CACHE = 'agritech-images-v3'

// Assets to cache immediately - critical for first load
const STATIC_ASSETS = [
  '/',
  '/login',
  '/dashboard',
  '/manifest.json',
  '/icon-light-32x32.png',
  '/icon-dark-32x32.png',
  '/icon.svg',
  '/apple-icon.png',
]

// Cache strategy: Cache First for static assets, Network First for API
const CACHE_FIRST_PATTERNS = [
  /\/_next\/static\//,
  /\.(?:png|jpg|jpeg|svg|gif|webp|avif|woff|woff2|ttf|eot)$/,
  /\/manifest\.json$/,
]

// Network first patterns (API calls that need fresh data)
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE && name !== API_CACHE)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch event - optimized caching strategy for slow connections
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Determine cache strategy based on URL pattern
  const isCacheFirst = CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))
  const isNetworkFirst = NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))
  const isImage = /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i.test(url.pathname)

  if (isNetworkFirst) {
    // Network First strategy for API calls
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone()
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseToCache)
            })
          }
          return response
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || new Response(JSON.stringify({ error: 'Offline' }), {
              headers: { 'Content-Type': 'application/json' },
            })
          })
        })
    )
  } else if (isCacheFirst || isImage) {
    // Cache First strategy for static assets and images
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }

        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type === 'error') {
              return response
            }

            const responseToCache = response.clone()
            const cacheName = isImage ? IMAGE_CACHE : STATIC_CACHE
            
            caches.open(cacheName).then((cache) => {
              cache.put(request, responseToCache)
            })

            return response
          })
          .catch(() => {
            // If offline and no cache, return offline response
            if (request.destination === 'document') {
              return new Response(
                `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - Agritech Dashboard</title>
  <style>
    body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; }
    h1 { color: #22c55e; }
  </style>
</head>
<body>
  <h1>Je bent offline</h1>
  <p>Controleer je internetverbinding en probeer het opnieuw.</p>
  <p>De app werkt offline met gecachte data waar mogelijk.</p>
</body>
</html>`,
                {
                  headers: { 'Content-Type': 'text/html' },
                }
              )
            }
            return new Response('Offline', { status: 503 })
          })
      })
    )
  } else {
    // Default: try cache, fallback to network
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request).catch(() => {
          return new Response('Offline', { status: 503 })
        })
      })
    )
  }
})
