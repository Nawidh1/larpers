// Service Worker for offline support and caching
// Optimized for low-connectivity areas in Belize

const CACHE_NAME = 'agritech-v2'
const STATIC_CACHE = 'agritech-static-v2'
const API_CACHE = 'agritech-api-v2'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icon-light-32x32.png',
  '/icon-dark-32x32.png',
  '/icon.svg',
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

// Fetch event - serve from cache, fallback to network
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

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached version if available
      if (cachedResponse) {
        return cachedResponse
      }

      // Fetch from network
      return fetch(request)
        .then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type === 'error') {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          // Cache API responses separately with shorter TTL
          if (url.pathname.startsWith('/api/')) {
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseToCache)
            })
          } else {
            // Cache static assets longer
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseToCache)
            })
          }

          return response
        })
        .catch(() => {
          // If offline and no cache, return a basic offline page
          if (request.destination === 'document') {
            return new Response(
              `
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Offline - Agritech Dashboard</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                </head>
                <body>
                  <h1>Je bent offline</h1>
                  <p>Controleer je internetverbinding en probeer het opnieuw.</p>
                </body>
              </html>
              `,
              {
                headers: { 'Content-Type': 'text/html' },
              }
            )
          }
        })
    })
  )
})
