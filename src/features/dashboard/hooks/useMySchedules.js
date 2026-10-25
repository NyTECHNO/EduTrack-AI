import { useEffect, useState } from 'react';
import { fetchMySchedules } from '../../schedules/services/schedulesService.js';

export default function useMySchedules(uid, role) {
  const [state, setState] = useState({ loading: true, schedules: [], error: '' });
  useEffect(() => {
    let alive = true;
    fetchMySchedules(uid, role)
      .then((schedules) => alive && setState({ loading: false, schedules, error: '' }))
      .catch(() => alive && setState({ loading: false, schedules: [], error: 'Could not load your classes. Check your connection and try again.' }));
    return () => { alive = false; };
  }, [uid, role]);
  return state;
}
