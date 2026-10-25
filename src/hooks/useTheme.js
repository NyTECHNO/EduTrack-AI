import { useEffect } from 'react';
import useLocalStorage from './useLocalStorage.js';

export const THEME_KEY = 'edutrack.theme'; // 'system' | 'light' | 'dark', stored per device

export function applyTheme(preference) {
  const dark = preference === 'dark' || (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#070e22' : '#0b1f4b');
  return dark;
}

// Keeps the page theme in step with the saved choice, and with the device when the choice is "System default".
export default function useTheme() {
  const [preference, setPreference] = useLocalStorage(THEME_KEY, 'system');
  useEffect(() => {
    applyTheme(preference);
    if (preference !== 'system') return undefined;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [preference]);
  return [preference, setPreference];
}
