import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App.jsx';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/data-views.css';
import './styles/calendar.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Install prompt: Chrome and Edge fire this once, early. Keep it so Settings and the login page can offer "Install app".
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  window.__edutrackInstall = event;
  window.dispatchEvent(new Event('edutrack:installable'));
});

// The service worker (offline support and installability) runs in the built app only, so it never serves stale files while developing.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/service-worker.js').catch(() => {}); });
}
