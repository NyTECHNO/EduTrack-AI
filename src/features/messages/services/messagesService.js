import {
  arrayRemove, arrayUnion, collection, deleteDoc, doc, getDocs, limitToLast, onSnapshot, orderBy, query,
  serverTimestamp, setDoc, updateDoc, where, writeBatch,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebase.js';
import { profileName } from '../../../lib/profile.js';

// conversations/{id}            a private message ('direct', Admin <-> Instructor) or a subject group chat ('group').
//   memberIds                   people who can read and write.
//   invitedIds                  group only: students who were invited and have not answered yet.
//   participantIds              memberIds + invitedIds (what each person's list is searched by).
// conversations/{id}/messages   the messages themselves.
// groupChatPrompts/{scheduleId} remembers that an Instructor declined the suggestion to create a group chat for a class.
// Students can never start a conversation with the Admin: direct chats exist only between an Admin and an Instructor.
const conversations = () => collection(db, 'conversations');
const toMillis = (value) => (value && typeof value.toMillis === 'function' ? value.toMillis() : 0);

export const directId = (a, b) => (a < b ? `dm_${a}_${b}` : `dm_${b}_${a}`);
export const groupId = (scheduleId) => `group_${scheduleId}`;
export const scheduleTitle = (s) => `${s.subjectCode} ${s.subjectName}${s.section ? ` (${s.section})` : ''}`;

export function subscribeToConversations(uid, onData, onError) {
  const q = query(conversations(), where('participantIds', 'array-contains', uid));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }));
    const when = (c) => toMillis(c.lastMessageAt) || toMillis(c.createdAt);
    onData(list.sort((a, b) => when(b) - when(a)));
  }, onError);
}

export function subscribeToMessages(conversationId, onData, onError) {
  const q = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'asc'), limitToLast(300));
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }))), onError);
}

export function subscribeToDeclinedPrompts(uid, onData, onError) {
  const q = query(collection(db, 'groupChatPrompts'), where('instructorId', '==', uid));
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => d.id)), onError);
}

// People an Admin can write to (Instructors) or an Instructor can write to (Admins).
export async function fetchContacts(role) {
  const target = role === 'admin' ? 'instructor' : 'admin';
  const snap = await getDocs(query(collection(db, 'users'), where('role', '==', target)));
  return snap.docs
    .map((d) => ({ uid: d.id, ...d.data() }))
    .filter((u) => u.status === 'active')
    .map((u) => ({ uid: u.uid, name: profileName(u) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Opens the private chat with someone, creating it the first time. The id is made from both uids, so there is only ever one.
export async function openDirect(me, other, existing) {
  const id = directId(me.uid, other.uid);
  if (existing.some((c) => c.id === id)) return id;
  await setDoc(doc(db, 'conversations', id), {
    type: 'direct',
    memberIds: [me.uid, other.uid],
    invitedIds: [],
    participantIds: [me.uid, other.uid],
    names: { [me.uid]: me.name, [other.uid]: other.name },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return id;
}

// Instructor accepts the system's suggestion: the group is created and every enrolled student gets an invitation.
export async function createGroupChat(schedule, me, wasDeclined) {
  const id = groupId(schedule.id);
  const invited = (schedule.studentIds || []).filter((uid) => uid !== me.uid);
  const batch = writeBatch(db);
  batch.set(doc(db, 'conversations', id), {
    type: 'group',
    scheduleId: schedule.id,
    subjectCode: schedule.subjectCode,
    subjectName: schedule.subjectName,
    section: schedule.section || '',
    title: scheduleTitle(schedule),
    instructorId: me.uid,
    instructorName: me.name,
    memberIds: [me.uid],
    invitedIds: invited,
    participantIds: [me.uid, ...invited],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  if (wasDeclined) batch.delete(doc(db, 'groupChatPrompts', schedule.id));
  await batch.commit();
  return id;
}

export const declineGroupSuggestion = (schedule, me) => setDoc(doc(db, 'groupChatPrompts', schedule.id), {
  scheduleId: schedule.id, instructorId: me.uid, status: 'declined', updatedAt: serverTimestamp(),
});

export const restoreGroupSuggestion = (schedule) => deleteDoc(doc(db, 'groupChatPrompts', schedule.id));

// Student answers an invitation.
export const acceptInvite = (conversationId, uid) => updateDoc(doc(db, 'conversations', conversationId), {
  memberIds: arrayUnion(uid), invitedIds: arrayRemove(uid), updatedAt: serverTimestamp(),
});
export const declineInvite = (conversationId, uid) => updateDoc(doc(db, 'conversations', conversationId), {
  invitedIds: arrayRemove(uid), participantIds: arrayRemove(uid), updatedAt: serverTimestamp(),
});

// Instructor invites more students to a group chat they own.
export const inviteStudents = (conversationId, uids) => updateDoc(doc(db, 'conversations', conversationId), {
  invitedIds: arrayUnion(...uids), participantIds: arrayUnion(...uids), updatedAt: serverTimestamp(),
});

export async function sendMessage(conversationId, author, rawText) {
  const text = String(rawText).trim().slice(0, 2000);
  if (!text) return;
  const convoRef = doc(db, 'conversations', conversationId);
  const batch = writeBatch(db);
  batch.set(doc(collection(convoRef, 'messages')), {
    senderId: author.uid, senderName: author.name, senderRole: author.role, text, createdAt: serverTimestamp(),
  });
  batch.update(convoRef, {
    lastMessage: { text: text.slice(0, 120), senderId: author.uid, senderName: author.name },
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}
