// Service worker cleanup & cache purge
// Ensures the app always loads the latest build and never serves stale cached scripts or services

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Delete all existing caches
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      
      // Unregister self immediately
      try {
        await self.registration.unregister();
      } catch (err) {
        // Ignore unregister errors
      }

      // Take control and notify all clients to refresh if needed
      await self.clients.claim();
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        client.postMessage({ type: 'CACHE_PURGED' });
      }
    })()
  );
});

// Pass through all fetch requests directly to network without caching
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
