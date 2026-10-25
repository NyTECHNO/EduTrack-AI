import {
  addDoc, collection, deleteDoc, deleteField, doc, getDocs, limit, query, serverTimestamp, setDoc, updateDoc, where, writeBatch,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebase.js';
import { getAllDocs } from '../../../firebase/queries.js';
import { logActivity } from '../../activity/services/activityService.js';
import { DAY_ORDER, toMinutes } from '../../../lib/dateTime.js';

// schedules/{id}  the class itself. `studentIds` (uids only) lets a student find their own classes.
// rosters/{id}    names and ID numbers of enrolled students. Only Admins and the class's Instructor can read it,
//                 so students never see their classmates' details.
const schedules = () => collection(db, 'schedules');
const rosters = () => collection(db, 'rosters');
const mapDocs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
const byTime = (a, b) => (DAY_ORDER[a.days[0]] - DAY_ORDER[b.days[0]]) || (toMinutes(a.startTime) - toMinutes(b.startTime));

// Adds `enrolled` from the roster. `_legacy` marks old documents that still carry the list inside the schedule.
function attachRosters(list, rosterDocs) {
  const byId = new Map(rosterDocs.map((r) => [r.id, r]));
  return list.map((s) => {
    const r = byId.get(s.id);
    return { ...s, enrolled: r ? r.enrolled || [] : s.enrolled || [], _legacy: Array.isArray(s.enrolled), _hasRoster: Boolean(r) };
  });
}

export async function fetchAllSchedules() {
  const [list, rosterDocs] = await Promise.all([getAllDocs((...c) => query(schedules(), ...c)), getAllDocs((...c) => query(rosters(), ...c))]);
  return attachRosters(list, rosterDocs).sort(byTime);
}

// Instructor or student: only their own classes (the rules enforce this on the server too).
export async function fetchMySchedules(uid, role) {
  if (role === 'instructor') {
    const [list, rosterSnap] = await Promise.all([
      getDocs(query(schedules(), where('instructorId', '==', uid))),
      getDocs(query(rosters(), where('instructorId', '==', uid))),
    ]);
    return attachRosters(mapDocs(list), mapDocs(rosterSnap)).sort(byTime);
  }
  return mapDocs(await getDocs(query(schedules(), where('studentIds', 'array-contains', uid)))).sort(byTime);
}

// Active people for the pickers.
export async function fetchPeople(role) {
  const list = await getAllDocs((...c) => query(collection(db, 'users'), where('role', '==', role), where('status', '==', 'active'), ...c));
  return list.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function createSchedule(data) {
  const ref = await addDoc(schedules(), { ...data, status: 'active', studentIds: [], createdAt: serverTimestamp() });
  await setDoc(doc(db, 'rosters', ref.id), { scheduleId: ref.id, instructorId: data.instructorId, enrolled: [], studentIds: [], updatedAt: serverTimestamp() });
  logActivity({ action: 'schedule.created', summary: `Created schedule ${data.subjectCode} (${data.days.join(', ')} ${data.startTime}-${data.endTime}, room ${data.room}) with ${data.instructorName}`, targetType: 'schedule', targetId: ref.id });
  return ref;
}

export async function updateSchedule(id, data) {
  await updateDoc(doc(db, 'schedules', id), data);
  // The roster records who teaches the class (that is what lets the instructor read it).
  if (data.instructorId) await setDoc(doc(db, 'rosters', id), { scheduleId: id, instructorId: data.instructorId }, { merge: true });
  logActivity({ action: 'schedule.updated', summary: `Updated schedule ${data.subjectCode} (${data.days.join(', ')} ${data.startTime}-${data.endTime}, room ${data.room}) with ${data.instructorName}`, targetType: 'schedule', targetId: id });
}

export async function deleteSchedule(schedule) {
  await Promise.all([deleteDoc(doc(db, 'schedules', schedule.id)), deleteDoc(doc(db, 'rosters', schedule.id))]);
  logActivity({ action: 'schedule.deleted', summary: `Deleted schedule ${schedule.subjectCode} (${schedule.days.join(', ')} ${schedule.startTime}-${schedule.endTime})`, targetType: 'schedule', targetId: schedule.id });
}

// statusChangedAt lets people be told about a cancellation the next time they open the app.
export async function setScheduleStatus(schedule, status) {
  await updateDoc(doc(db, 'schedules', schedule.id), { status, statusChangedAt: serverTimestamp() });
  logActivity({ action: status === 'cancelled' ? 'schedule.cancelled' : 'schedule.reinstated', summary: `${status === 'cancelled' ? 'Cancelled' : 'Reinstated'} ${schedule.subjectCode} (${schedule.days.join(', ')} ${schedule.startTime}-${schedule.endTime}) of ${schedule.instructorName}`, targetType: 'schedule', targetId: schedule.id });
}

export async function saveEnrollment(schedule, students) {
  const uids = students.map((s) => s.uid);
  const batch = writeBatch(db);
  batch.update(doc(db, 'schedules', schedule.id), { studentIds: uids, enrolled: deleteField() });
  batch.set(doc(db, 'rosters', schedule.id), { scheduleId: schedule.id, instructorId: schedule.instructorId, enrolled: students, studentIds: uids, updatedAt: serverTimestamp() });
  await batch.commit();
  logActivity({ action: 'schedule.enrollment', summary: `Updated the students of ${schedule.subjectCode}${schedule.section ? ` (${schedule.section})` : ''}: ${students.length} enrolled`, targetType: 'schedule', targetId: schedule.id });
}

// One-time upgrade of schedules created before rosters existed: move the class list into rosters and
// remove it from the schedule document. Safe to run repeatedly.
export async function migrateRosters(legacy) {
  for (const s of legacy) {
    if (!s._hasRoster) {
      // eslint-disable-next-line no-await-in-loop
      await setDoc(doc(db, 'rosters', s.id), {
        scheduleId: s.id, instructorId: s.instructorId, enrolled: s.enrolled || [],
        studentIds: s.studentIds || (s.enrolled || []).map((e) => e.uid), updatedAt: serverTimestamp(),
      });
    }
    // eslint-disable-next-line no-await-in-loop
    await updateDoc(doc(db, 'schedules', s.id), { enrolled: deleteField() });
  }
}

// True if the person is an instructor of, or enrolled in, any schedule.
export async function hasScheduleLinks(uid) {
  const [asInstructor, asStudent] = await Promise.all([
    getDocs(query(schedules(), where('instructorId', '==', uid), limit(1))),
    getDocs(query(schedules(), where('studentIds', 'array-contains', uid), limit(1))),
  ]);
  return !asInstructor.empty || !asStudent.empty;
}

// Keep denormalized names correct when an account is renamed.
export async function syncPersonName(uid, name) {
  const [asInstructor, asStudent] = await Promise.all([
    getDocs(query(schedules(), where('instructorId', '==', uid))),
    getDocs(query(rosters(), where('studentIds', 'array-contains', uid))),
  ]);
  if (asInstructor.empty && asStudent.empty) return;
  const batch = writeBatch(db);
  asInstructor.forEach((d) => batch.update(d.ref, { instructorName: name }));
  asStudent.forEach((d) => batch.update(d.ref, { enrolled: (d.data().enrolled || []).map((e) => (e.uid === uid ? { ...e, name } : e)) }));
  await batch.commit();
}
