// Service Worker for Madrasah Teacher Portal Web Push Notifications, Broadcasts & Offline Caching
const CACHE_NAME = 'madrasah-portal-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Initial offline cache warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Network-First with Cache Fallback for offline support
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Skip Firestore, Firebase Auth, Google APIs, and live websockets
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('googleapis.com') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  // Navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const rootCached = await caches.match('/');
          if (rootCached) return rootCached;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Same-origin static assets (.js, .css, fonts, images)
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            if (request.headers.get('accept')?.includes('text/html')) {
              return caches.match('/index.html');
            }
            return new Response('Network offline and asset not cached', { status: 503, statusText: 'Offline' });
          });
        })
    );
  }
});

// Listen for Push Events
self.addEventListener('push', (event) => {
  let data = {
    title: 'Pengumuman Madrasah',
    body: 'Ada informasi terbaru dari Madrasah.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'madrasah-announcement',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || 'https://api.iconify.design/lucide:megaphone.svg?color=%23f59e0b',
    badge: data.badge || 'https://api.iconify.design/lucide:bell.svg?color=%234f46e5',
    tag: data.tag || 'madrasah-announcement',
    renotify: true,
    vibrate: [200, 100, 200, 100, 200],
    data: data.data || { url: '/' },
    actions: [
      { action: 'open', title: 'Buka Pengumuman' },
      { action: 'close', title: 'Tutup' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a tab is already open, focus it
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Handle custom message from app to show notification via service worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      ...options,
      icon: options.icon || 'https://api.iconify.design/lucide:megaphone.svg?color=%23f59e0b',
      badge: options.badge || 'https://api.iconify.design/lucide:bell.svg?color=%234f46e5',
      vibrate: [200, 100, 200]
    });
  }
});
