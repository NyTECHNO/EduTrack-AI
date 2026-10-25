import { useEffect, useState } from 'react';
import { fetchKnowledge } from '../../school-info/services/knowledgeService.js';

export default function useKnowledge(includeDrafts) {
  const [state, setState] = useState({ loading: true, entries: [], error: '' });
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: '' }));
    fetchKnowledge({ includeDrafts })
      .then((entries) => alive && setState({ loading: false, entries, error: '' }))
      .catch(() => alive && setState({ loading: false, entries: [], error: 'Could not load the school information. Check your connection and try again.' }));
    return () => { alive = false; };
  }, [includeDrafts]);
  return state;
}
