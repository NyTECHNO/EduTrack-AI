import { addDoc, collection, deleteDoc, doc, getDocs, limit, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../../firebase/firebase.js';
import { getAllDocs } from '../../../firebase/queries.js';
import { logActivity } from '../../activity/services/activityService.js';

// schoolKnowledge/{id}: category, title, content, keywords[], sourceUrl, reviewNote, status (draft|published)
// Students and instructors can only read published entries; the chatbot uses only those.
const col = () => collection(db, 'schoolKnowledge');

export const fetchKnowledge = ({ includeDrafts }) => getAllDocs((...c) => (includeDrafts ? query(col(), ...c) : query(col(), where('status', '==', 'published'), ...c)));

const fields = (v) => ({
  category: v.category, title: v.title.trim(), content: v.content.trim(),
  keywords: v.keywords.split(',').map((k) => k.trim()).filter(Boolean).slice(0, 20),
  sourceUrl: v.sourceUrl.trim(), reviewNote: v.reviewNote.trim(), status: v.status,
});

export async function saveEntry(id, values, uid) {
  if (id) await updateDoc(doc(db, 'schoolKnowledge', id), { ...fields(values), updatedBy: uid, updatedAt: serverTimestamp() });
  else await addDoc(col(), { ...fields(values), createdBy: uid, updatedBy: uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  logActivity({ action: 'knowledge.saved', summary: `${id ? 'Edited' : 'Created'} the entry “${values.title.trim()}” (${values.status})`, targetType: 'knowledge', targetId: id || '' });
}

export async function setEntryStatus(entry, status, uid) {
  await updateDoc(doc(db, 'schoolKnowledge', entry.id), { status, updatedBy: uid, updatedAt: serverTimestamp() });
  logActivity({ action: status === 'published' ? 'knowledge.published' : 'knowledge.unpublished', summary: `${status === 'published' ? 'Published' : 'Unpublished'} the entry “${entry.title}”`, targetType: 'knowledge', targetId: entry.id });
}
export async function deleteEntry(entry) {
  await deleteDoc(doc(db, 'schoolKnowledge', entry.id));
  logActivity({ action: 'knowledge.deleted', summary: `Deleted the entry “${entry.title}”`, targetType: 'knowledge', targetId: entry.id });
}

// Adds the suggested entries that are not there yet (as drafts, or published when `publish` is true).
// Older suggested entries that were replaced by better ones are moved back to draft with a note.
export async function importDrafts(drafts, existingIds, uid, { publish = false, supersededIds = [] } = {}) {
  const missing = drafts.filter((d) => !existingIds.includes(d.id));
  await Promise.all(missing.map((d) => setDoc(doc(db, 'schoolKnowledge', d.id), {
    category: d.category, title: d.title, content: d.content, keywords: d.keywords, sourceUrl: d.sourceUrl, reviewNote: d.reviewNote,
    status: publish ? 'published' : 'draft', createdBy: uid, updatedBy: uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  })));
  const old = supersededIds.filter((id) => existingIds.includes(id));
  await Promise.all(old.map((id) => updateDoc(doc(db, 'schoolKnowledge', id), {
    status: 'draft', reviewNote: 'Replaced by newer, more complete entries. Check those, then delete this one.', updatedBy: uid, updatedAt: serverTimestamp(),
  })));
  if (missing.length) logActivity({ action: 'knowledge.imported', summary: `Added ${missing.length} entries from the school website (${publish ? 'published' : 'as drafts'})`, targetType: 'knowledge' });
  return { added: missing.length, replaced: old.length };
}
