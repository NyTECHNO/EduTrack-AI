import { useEffect } from 'react';
import useLocalStorage from './useLocalStorage.js';

export const THEME_KEY = 'edutrack.theme'; // 'light' (default) or 'dark', stored per device

// Light is the default. Dark is only used when the person chooses it. (An old saved "system" value counts as light.)
export function applyTheme(preference) {
  const dark = preference === 'dark';
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#070e22' : '#0b1f4b');
  return dark;
}

export default function useTheme() {
  const [stored, setStored] = useLocalStorage(THEME_KEY, 'light');
  const preference = stored === 'dark' ? 'dark' : 'light';
  useEffect(() => { applyTheme(preference); }, [preference]);
  return [preference, setStored];
}
