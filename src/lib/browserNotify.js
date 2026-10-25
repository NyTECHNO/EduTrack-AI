// Browser/PWA notifications for devices where the app is open (tab, window or installed app).
// Uses the service worker when available (required on Android), else the plain Notification API.
export const browserNotificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window;
export const permissionState = () => (browserNotificationsSupported() ? Notification.permission : 'unsupported'); // default | granted | denied | unsupported

export async function askPermission() {
  if (!browserNotificationsSupported()) return 'unsupported';
  return Notification.requestPermission();
}

export async function showBrowserNotification({ title, body, tag }) {
  if (permissionState() !== 'granted') return;
  const options = { body, tag, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', data: { url: '/calendar' } };
  try {
    const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
    if (registration) await registration.showNotification(title, options);
    else new Notification(title, options); // eslint-disable-line no-new
  } catch { /* the in-app notification still exists */ }
}
