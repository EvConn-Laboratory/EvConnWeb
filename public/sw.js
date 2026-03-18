// EvConn Laboratory — PWA Service Worker
// Cache strategy: network-first for navigation/API, cache-first for static assets

const CACHE_NAME = 'evconn-v1';
const STATIC_ASSETS = ['/', '/login', '/programs', '/news'];

// ─── Install ────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        // Non-fatal: some routes may not be pre-renderable in all environments
        console.warn('[SW] Pre-cache partial failure:', err);
      });
    }).then(() => {
      // Skip waiting so the new SW activates immediately
      return self.skipWaiting();
    })
  );
});

// ─── Activate ───────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// ─── Fetch ──────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // ── Cache-first for static assets ─────────────────────────────────────────
  // Next.js static chunks, icons, images
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          // Clone and cache successful responses
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // ── Network-first for API routes ───────────────────────────────────────────
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/data/')
  ) {
    event.respondWith(
      fetch(request).catch(() => {
        // Return a JSON error response when offline
        return new Response(
          JSON.stringify({ error: 'You are offline. Please check your connection.' }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
    return;
  }

  // ── Network-first for HTML navigation ─────────────────────────────────────
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Serve cached version when offline
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            // Fall back to the cached homepage
            return caches.match('/') || new Response(
              '<html><body><h1>EvConn Lab</h1><p>You are offline.</p></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          });
        })
    );
    return;
  }
});

// ─── Background Sync ────────────────────────────────────────────────────────
// Placeholder: queues failed submission requests for retry when back online

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-submissions') {
    event.waitUntil(
      // TODO: Retrieve queued submissions from IndexedDB and retry
      Promise.resolve().then(() => {
        console.log('[SW] Background sync: submissions');
      })
    );
  }
});

// ─── Push Notifications ─────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  let data = { title: 'EvConn Lab', body: 'You have a new notification.' };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch {
    console.warn('[SW] Could not parse push payload');
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag ?? 'evconn-notification',
    data: data.url ? { url: data.url } : undefined,
    actions: data.actions ?? [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url ?? '/lms/dashboard';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus an existing window if one is open on that URL
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});
