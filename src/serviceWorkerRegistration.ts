// Max Executive Tires - Service Worker Registration & Offline Support
// Ensures seamless operation across Pichelin & Dominica mountain roads with intermittent signal

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

export function registerServiceWorker(config?: ServiceWorkerConfig): void {
  if (typeof window === 'undefined') return;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/sw.js';

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('[SW] ServiceWorker registered with scope:', registration.scope);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('[SW] New content is available; please refresh.');
                  if (config && config.onUpdate) {
                    config.onUpdate(registration);
                  }
                } else {
                  console.log('[SW] Content is cached for offline use in Pichelin!');
                  if (config && config.onSuccess) {
                    config.onSuccess(registration);
                  }
                }
              }
            };
          };

          // Cache the tyre catalog proactively in background
          try {
            fetch('/api/tyres')
              .then((res) => res.json())
              .then((data) => {
                if (data && data.tyres) {
                  localStorage.setItem('max_executive_offline_tyres_cache', JSON.stringify({
                    timestamp: Date.now(),
                    count: data.tyres.length,
                    tyres: data.tyres
                  }));
                }
              })
              .catch((err) => {
                console.log('[SW] Offline catalog background sync note:', err.message);
              });
          } catch (e) {
            // Ignore non-blocking local storage errors
          }
        })
        .catch((error) => {
          console.warn('[SW] Error during service worker registration:', error);
          if (config && config.onError) {
            config.onError(error);
          }
        });
    });
  }
}

export function unregisterServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
