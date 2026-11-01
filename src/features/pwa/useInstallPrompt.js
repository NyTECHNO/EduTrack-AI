import { useCallback, useEffect, useState } from 'react';

// Chrome and Edge fire `beforeinstallprompt` once; main.jsx catches it early and keeps it on window until a screen needs it.
const standalone = () => typeof window !== 'undefined'
  && (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);
const onIos = () => typeof navigator !== 'undefined'
  && (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

export default function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(() => window.__edutrackInstall || null);
  const [installed, setInstalled] = useState(standalone());

  useEffect(() => {
    const onReady = () => setPromptEvent(window.__edutrackInstall || null);
    const onInstalled = () => { setInstalled(true); setPromptEvent(null); window.__edutrackInstall = null; };
    window.addEventListener('edutrack:installable', onReady);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('edutrack:installable', onReady); window.removeEventListener('appinstalled', onInstalled); };
  }, []);

  const install = useCallback(async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    await promptEvent.userChoice.catch(() => {});
    window.__edutrackInstall = null;
    setPromptEvent(null);
  }, [promptEvent]);

  return { canInstall: Boolean(promptEvent), install, installed, ios: onIos() && !installed };
}
