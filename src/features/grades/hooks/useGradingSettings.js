import { useCallback, useEffect, useState } from 'react';
import { fetchSettings } from '../services/gradesService.js';

export default function useGradingSettings() {
  const [state, setState] = useState({ loading: true, settings: null, error: '' });
  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    try { setState({ loading: false, settings: await fetchSettings(), error: '' }); }
    catch { setState({ loading: false, settings: null, error: 'Could not load the grading settings. Check your connection and that the latest Firestore rules are deployed.' }); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}
