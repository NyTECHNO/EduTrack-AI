import { useCallback, useEffect, useRef, useState } from 'react';

const EVENT = 'edutrack:storage';

// Persisted state that tolerates blocked storage (private mode) and stays in sync across components,
// so the Settings page can change the sidebar preference that the app shell is using.
export default function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? initial : JSON.parse(raw);
    } catch {
      return initial;
    }
  });
  const latest = useRef(value);
  latest.current = value;

  useEffect(() => {
    const onChange = (e) => { if (e.detail.key === key) setValue(e.detail.value); };
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, [key]);

  const set = useCallback((next) => {
    const resolved = typeof next === 'function' ? next(latest.current) : next;
    latest.current = resolved;
    setValue(resolved);
    try { window.localStorage.setItem(key, JSON.stringify(resolved)); } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { key, value: resolved } }));
  }, [key]);

  return [value, set];
}
