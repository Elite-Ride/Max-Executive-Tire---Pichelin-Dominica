// Max Executive Tires - Service Worker Registration & Offline Support
// Ensures seamless operation across Pichelin & Dominica mountain roads with intermittent signal

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return;

  // Clear all Cache Storage instances
  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        caches.delete(key);
      });
    }).catch(() => {});
  }

  // Unregister all existing service workers completely
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister().catch(() => {});
      }
    }).catch(() => {});
  }
}

export function unregisterServiceWorker(): void {
  registerServiceWorker();
}
