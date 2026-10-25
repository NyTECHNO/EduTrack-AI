import { collection, getCountFromServer, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../../firebase/firebase.js';

const count = async (name, ...filters) => (await getCountFromServer(query(collection(db, name), ...filters))).data().count;

// Admin headline numbers, counted on the server (no need to download every record).
export async function fetchAdminStats() {
  const [students, instructors, subjects, classes, drafts] = await Promise.all([
    count('users', where('role', '==', 'student'), where('status', '==', 'active')),
    count('users', where('role', '==', 'instructor'), where('status', '==', 'active')),
    count('subjects', where('status', '==', 'active')),
    count('schedules', where('status', '==', 'active')),
    count('schoolKnowledge', where('status', '==', 'draft')),
  ]);
  return { students, instructors, subjects, classes, drafts };
}

export async function fetchRecentSessions() {
  const snap = await getDocs(query(collection(db, 'attendanceSessions'), orderBy('updatedAt', 'desc'), limit(5)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
