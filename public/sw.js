// Max Executive Tires - Service Worker for Pichelin Offline & Intermittent Connectivity
// Caches essential static assets, app shell, and the tyre catalog

const CACHE_VERSION = 'v1.1.0';
const STATIC_CACHE = `max-tires-static-${CACHE_VERSION}`;
const CATALOG_CACHE = `max-tires-catalog-${CACHE_VERSION}`;
const IMAGES_CACHE = `max-tires-images-${CACHE_VERSION}`;

// Essential static assets & catalog endpoint for offline functionality
const ESSENTIAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  '/api/tyres',
  '/api/health'
];

// 1. Install event: Pre-cache essential static assets & tyre catalog
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      // Pre-cache static assets
      const staticCache = await caches.open(STATIC_CACHE);
      const catalogCache = await caches.open(CATALOG_CACHE);

      // Cache core assets safely (individual try-catch to avoid one failure breaking install)
      await Promise.allSettled(
        ESSENTIAL_ASSETS.map(async (url) => {
          try {
            const targetCache = url.startsWith('/api/tyres') ? catalogCache : staticCache;
            const response = await fetch(url, { cache: 'no-cache' });
            if (response && (response.status === 200 || response.type === 'opaque')) {
              await targetCache.put(url, response);
            }
          } catch (err) {
            console.warn(`[SW] Pre-cache skip for ${url}:`, err);
          }
        })
      );

      // Activate immediately without waiting for existing clients to close
      return self.skipWaiting();
    })()
  );
});

// 2. Activate event: Clean up old cache versions & take immediate control
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, CATALOG_CACHE, IMAGES_CACHE];
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key.startsWith('max-tires-') && !currentCaches.includes(key)) {
            console.log('[SW] Deleting stale cache:', key);
            return caches.delete(key);
          }
          return null;
        })
      );
      // Claim all clients immediately
      return self.clients.claim();
    })()
  );
});

// 3. Fetch event: Robust routing with offline support for Pichelin terrain
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Strategy A: Tyre Catalog API (/api/tyres, /api/health)
  // Network-First with fallback to cached catalog so offline users in Pichelin see all inventory
  if (url.pathname.startsWith('/api/tyres') || url.pathname.startsWith('/api/health')) {
    event.respondWith(
      (async () => {
        const catalogCache = await caches.open(CATALOG_CACHE);
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            catalogCache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          console.log('[SW] Network unavailable in Pichelin, serving cached tyre catalog for:', request.url);
          const cachedResponse = await catalogCache.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback if specific URL not matched: try matching base '/api/tyres'
          const baseCached = await catalogCache.match('/api/tyres');
          if (baseCached) {
            return baseCached;
          }
          // As ultimate fallback, return an offline JSON response
          return new Response(
            JSON.stringify({
              status: 'offline',
              offline: true,
              message: 'Operating in Pichelin offline cache mode.',
              location: 'Maranatha Square, Pichelin, Dominica',
              phone: '+1 (767) 616-0155'
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      })()
    );
    return;
  }

  // Strategy B: Navigation requests (HTML pages)
  // Network-First, fall back to cached /index.html or /
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            const staticCache = await caches.open(STATIC_CACHE);
            staticCache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          console.log('[SW] Navigation offline fallback for:', request.url);
          const staticCache = await caches.open(STATIC_CACHE);
          const cachedHtml = (await staticCache.match(request)) || 
                             (await staticCache.match('/index.html')) || 
                             (await staticCache.match('/'));
          if (cachedHtml) {
            return cachedHtml;
          }
          throw error;
        }
      })()
    );
    return;
  }

  // Strategy C: Static images (Unsplash tyre photos or local SVGs/PNGs)
  // Cache-First with Network fallback and background caching
  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico)$/i) ||
    url.hostname.includes('unsplash.com')
  ) {
    event.respondWith(
      (async () => {
        const imagesCache = await caches.open(IMAGES_CACHE);
        const cachedResponse = await imagesCache.match(request);
        if (cachedResponse) {
          // Return cached image immediately, refresh in background
          fetch(request)
            .then((res) => {
              if (res && (res.status === 200 || res.type === 'opaque')) {
                imagesCache.put(request, res);
              }
            })
            .catch(() => {
              // Ignore background fetch error when offline
            });
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            imagesCache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          // If network fails and it's an SVG logo, fallback to cached logo.svg
          if (url.pathname.endsWith('.svg')) {
            const staticCache = await caches.open(STATIC_CACHE);
            const fallbackLogo = await staticCache.match('/logo.svg');
            if (fallbackLogo) return fallbackLogo;
          }
          return new Response('', { status: 408, statusText: 'Image unavailable offline' });
        }
      })()
    );
    return;
  }

  // Strategy D: Static assets (JS chunks, CSS stylesheets, web fonts)
  // Stale-While-Revalidate: Return cached fast, update in background
  if (
    url.origin === self.location.origin ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      (async () => {
        const staticCache = await caches.open(STATIC_CACHE);
        const cachedResponse = await staticCache.match(request);

        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
              staticCache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((err) => {
            // Offline in Pichelin
            return null;
          });

        return cachedResponse || (await fetchPromise);
      })()
    );
    return;
  }

  // Default: Normal fetch with offline catch
  event.respondWith(
    fetch(request).catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      return new Response('Offline content unavailable', { status: 503, statusText: 'Service Unavailable Offline' });
    })
  );
});

// 4. Message handler for skip waiting & manual cache invalidation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CACHE_CATALOG') {
    // Manually force caching of catalog
    caches.open(CATALOG_CACHE).then(async (cache) => {
      try {
        const res = await fetch('/api/tyres');
        if (res.status === 200) {
          await cache.put('/api/tyres', res);
        }
      } catch (e) {
        console.warn('[SW] Manual catalog cache failed:', e);
      }
    });
  }
});
