// EduTrack AI service worker. It makes browser/PWA notifications work and handles taps on them.
// It does not cache pages, so updates to the app are never held back.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

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
