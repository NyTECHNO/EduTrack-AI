import { collection, collectionGroup, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../../firebase/firebase.js';
import { logActivity } from '../../activity/services/activityService.js';

// attendanceSessions/{scheduleId_date}            one session per class per date (the id prevents duplicates)
// attendanceSessions/{id}/records/{studentId}     one record per student, with a copy of class details
export const sessionIdFor = (scheduleId, date) => `${scheduleId}_${date}`;
const sessionRef = (id) => doc(db, 'attendanceSessions', id);
const mapDocs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

export async function fetchSession(scheduleId, date) {
  const snap = await getDoc(sessionRef(sessionIdFor(scheduleId, date)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function fetchSessionRecords(sessionId) {
  return mapDocs(await getDocs(collection(db, 'attendanceSessions', sessionId, 'records')));
}

/**
 * Saves (creates or corrects) one session and a record for every student on the roster.
 * Records are written in small parallel groups; re-saving is safe (same ids), so a failed save can simply be retried.
 */
export async function saveAttendance({ schedule, instructor, date, note, roster, marks, exists }) {
  const id = sessionIdFor(schedule.id, date);
  const counts = { present: 0, absent: 0, late: 0, excused: 0, total: roster.length };
  roster.forEach((p) => { counts[marks[p.uid].status] += 1; });
  const shared = { note: note.trim(), counts, updatedAt: serverTimestamp() };

  if (exists) {
    await updateDoc(sessionRef(id), shared);
  } else {
    await setDoc(sessionRef(id), {
      scheduleId: schedule.id, subjectCode: schedule.subjectCode, subjectName: schedule.subjectName,
      section: schedule.section || '', instructorId: instructor.uid, instructorName: instructor.name,
      date, ...shared, createdAt: serverTimestamp(),
    });
  }

  const writeRecord = (p) => setDoc(doc(db, 'attendanceSessions', id, 'records', p.uid), {
    studentId: p.uid, studentName: p.name, idNumber: p.idNumber || '',
    status: marks[p.uid].status, remarks: (marks[p.uid].remarks || '').trim(),
    scheduleId: schedule.id, sessionId: id, date,
    subjectCode: schedule.subjectCode, subjectName: schedule.subjectName,
    instructorId: instructor.uid, instructorName: instructor.name, updatedAt: serverTimestamp(),
  });
  for (let i = 0; i < roster.length; i += 10) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(roster.slice(i, i + 10).map(writeRecord));
  }
  logActivity({ action: exists ? 'attendance.corrected' : 'attendance.saved', summary: `${exists ? 'Corrected' : 'Recorded'} attendance for ${schedule.subjectCode} on ${date}: ${counts.present} present, ${counts.absent} absent, ${counts.late} late, ${counts.excused} excused`, targetType: 'attendance', targetId: id });
  return id;
}

// instructorId is added for instructors: Firestore rules only allow queries that prove the rows are theirs.
export async function fetchScheduleSessions(scheduleId, instructorId) {
  const filters = [where('scheduleId', '==', scheduleId), ...(instructorId ? [where('instructorId', '==', instructorId)] : [])];
  return mapDocs(await getDocs(query(collection(db, 'attendanceSessions'), ...filters)));
}
export async function fetchScheduleRecords(scheduleId, instructorId) {
  const filters = [where('scheduleId', '==', scheduleId), ...(instructorId ? [where('instructorId', '==', instructorId)] : [])];
  return mapDocs(await getDocs(query(collectionGroup(db, 'records'), ...filters)));
}

// A student's own records across every class.
export async function fetchMyRecords(uid) {
  return mapDocs(await getDocs(query(collectionGroup(db, 'records'), where('studentId', '==', uid))));
}
