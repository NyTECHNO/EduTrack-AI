import { useEffect, useState } from 'react';

// Re-renders every minute so "next class" and "in progress" stay correct while the dashboard stays open.
export default function useNow(ms = 60000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}
