import { addDoc, collection, doc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '../../../firebase/firebase.js';
import { getAllDocs } from '../../../firebase/queries.js';
import { logActivity } from '../../activity/services/activityService.js';

export const fetchSubjects = () => getAllDocs((...c) => query(collection(db, 'subjects'), orderBy('code'), ...c));

export async function createSubject(v) {
  const ref = await addDoc(collection(db, 'subjects'), {
    code: v.code.trim().toUpperCase(), name: v.name.trim(), units: v.units === '' ? null : Number(v.units),
    description: v.description.trim(), status: 'active', createdAt: serverTimestamp(),
  });
  logActivity({ action: 'subject.created', summary: `Created subject ${v.code.trim().toUpperCase()} ${v.name.trim()}`, targetType: 'subject', targetId: ref.id });
  return ref;
}

// Schedules keep a copy of the subject code/name, so renaming a subject updates them too.
export async function updateSubject(id, v) {
  const data = { code: v.code.trim().toUpperCase(), name: v.name.trim(), units: v.units === '' ? null : Number(v.units), description: v.description.trim() };
  await updateDoc(doc(db, 'subjects', id), data);
  const linked = await getDocs(query(collection(db, 'schedules'), where('subjectId', '==', id)));
  if (!linked.empty) {
    const batch = writeBatch(db);
    linked.forEach((d) => batch.update(d.ref, { subjectCode: data.code, subjectName: data.name }));
    await batch.commit();
  }
  logActivity({ action: 'subject.updated', summary: `Updated subject ${data.code} ${data.name}`, targetType: 'subject', targetId: id });
}

export async function setSubjectStatus(subject, status) {
  await updateDoc(doc(db, 'subjects', subject.id), { status });
  logActivity({ action: status === 'archived' ? 'subject.archived' : 'subject.restored', summary: `${status === 'archived' ? 'Archived' : 'Restored'} subject ${subject.code} ${subject.name}`, targetType: 'subject', targetId: subject.id });
}
