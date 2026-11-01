// EduTrack AI service worker: makes the app installable, keeps it opening when the connection drops,
// and handles notification taps. Firebase and other APIs are NEVER cached, so grades and attendance are always live.
const VERSION = 'v2';
const SHELL = `edutrack-shell-${VERSION}`;
const RUNTIME = `edutrack-runtime-${VERSION}`;
const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/icons/icon-192.png', '/favicon.png'];
const FONT_HOSTS = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('edutrack-') && k !== SHELL && k !== RUNTIME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !FONT_HOSTS.includes(url.origin)) return; // Firebase, Google APIs and everything else: straight to the network

  // Opening a page: always try the network first so a new version of the app is picked up; fall back to the last good copy.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) { const copy = response.clone(); caches.open(RUNTIME).then((cache) => cache.put('/index.html', copy)); }
          return response;
        })
        .catch(async () => (await caches.match('/index.html')) || caches.match(OFFLINE_URL)),
    );
    return;
  }

  // Scripts, styles, images and fonts: show the saved copy at once and refresh it in the background.
  event.respondWith(
    caches.open(RUNTIME).then(async (cache) => {
      const cached = await cache.match(request);
      const fresh = fetch(request)
        .then((response) => { if (response.ok) cache.put(request, response.clone()); return response; })
        .catch(() => cached);
      return cached || fresh;
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/calendar';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => 'focus' in w);
      if (open) { open.navigate?.(url); return open.focus(); }
      return self.clients.openWindow(url);
    }),
  );
});

// Ready for server push (Firebase Cloud Messaging) if it is added later; the free in-app reminders do not use it.
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { /* ignore malformed payloads */ }
  const n = data.notification || data;
  event.waitUntil(self.registration.showNotification(n.title || 'EduTrack AI', {
    body: n.body || '', icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', data: { url: n.url || '/calendar' },
  }));
});
