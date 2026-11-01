import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import Icon from '../../../components/ui/Icon.jsx';
import useLocalStorage from '../../../hooks/useLocalStorage.js';
import { profileName } from '../../../lib/profile.js';
import { fetchMySchedules } from '../../schedules/services/schedulesService.js';
import ChatThread from '../components/ChatThread.jsx';
import ConversationList from '../components/ConversationList.jsx';
import InviteModal from '../components/InviteModal.jsx';
import NewMessageModal from '../components/NewMessageModal.jsx';
import { GroupSuggestions, StudentInvites } from '../components/Requests.jsx';
import { toMillis } from '../lib/display.js';
import {
  acceptInvite, createGroupChat, declineGroupSuggestion, declineInvite, groupId, inviteStudents, openDirect,
  restoreGroupSuggestion, subscribeToConversations, subscribeToDeclinedPrompts,
} from '../services/messagesService.js';
import '../messages.css';

// Messages. Admin <-> Instructor private messages; subject group chats that an Instructor creates (and students join).
// Students cannot message the Admin: they only take part in group chats.
export default function MessagesPage() {
  const { user, role, profile } = useAuth();
  const me = useMemo(() => ({ uid: user.uid, name: profileName(profile), role }), [user.uid, profile, role]);

  const [conversations, setConversations] = useState(null);
  const [declinedIds, setDeclinedIds] = useState(null);
  const [schedules, setSchedules] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [seen, setSeen] = useLocalStorage(`edutrack.messages.seen.${user.uid}`, {});
  const [modal, setModal] = useState(null); // 'new' | 'invite'
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => subscribeToConversations(user.uid, setConversations,
    () => { setConversations([]); setError('Could not load your messages. Check your connection and try again.'); }), [user.uid]);

  useEffect(() => {
    if (role !== 'instructor') return undefined;
    let live = true;
    fetchMySchedules(user.uid, 'instructor').then((list) => live && setSchedules(list)).catch(() => live && setSchedules([]));
    const stop = subscribeToDeclinedPrompts(user.uid, setDeclinedIds, () => setDeclinedIds([]));
    return () => { live = false; stop(); };
  }, [role, user.uid]);

  const all = conversations || [];
  const mine = useMemo(() => all.filter((c) => (c.memberIds || []).includes(user.uid)), [all, user.uid]);
  const invites = useMemo(() => all.filter((c) => c.type === 'group' && (c.invitedIds || []).includes(user.uid)), [all, user.uid]);
  const selected = mine.find((c) => c.id === selectedId) || null;

  // The instructor's classes that do not have a group chat yet: suggested, or declined earlier.
  const { suggestions, declined } = useMemo(() => {
    if (role !== 'instructor' || !schedules || !conversations || !declinedIds) return { suggestions: [], declined: [] };
    const open = schedules.filter((s) => s.status !== 'cancelled' && !conversations.some((c) => c.id === groupId(s.id)));
    return { suggestions: open.filter((s) => !declinedIds.includes(s.id)), declined: open.filter((s) => declinedIds.includes(s.id)) };
  }, [role, schedules, conversations, declinedIds]);

  // Students (from any class this instructor teaches) who can still be invited to the open group chat.
  const candidates = useMemo(() => {
    if (!selected || selected.type !== 'group' || !schedules) return [];
    const taken = new Set([...(selected.memberIds || []), ...(selected.invitedIds || []), user.uid]);
    const byUid = new Map();
    schedules.forEach((s) => (s.enrolled || []).forEach((p) => {
      if (taken.has(p.uid)) return;
      const entry = byUid.get(p.uid) || { uid: p.uid, name: p.name, idNumber: p.idNumber || '', classes: [] };
      if (!entry.classes.includes(s.subjectCode)) entry.classes.push(s.subjectCode);
      byUid.set(p.uid, entry);
    }));
    return [...byUid.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [selected, schedules, user.uid]);

  // Mark the open conversation as read, now and whenever a newer message arrives while it is open.
  const lastAt = selected ? toMillis(selected.lastMessageAt) : 0;
  useEffect(() => {
    if (!selectedId || !lastAt) return;
    setSeen((s) => (s[selectedId] === lastAt ? s : { ...s, [selectedId]: lastAt }));
  }, [selectedId, lastAt, setSeen]);

  const run = useCallback(async (id, task, failure) => {
    setBusyId(id); setError('');
    try { return await task(); } catch { setError(failure); return null; } finally { setBusyId(''); }
  }, []);

  const handleAcceptInvite = (c) => run(c.id, async () => { await acceptInvite(c.id, user.uid); setSelectedId(c.id); }, 'Could not join the group chat. Please try again.');
  const handleDeclineInvite = (c) => run(c.id, () => declineInvite(c.id, user.uid), 'Could not decline the invitation. Please try again.');
  const handleCreateGroup = (s, wasDeclined) => run(s.id, async () => { setSelectedId(await createGroupChat(s, me, wasDeclined)); }, 'Could not create the group chat. Please try again.');
  const handleDeclineSuggestion = (s) => run(s.id, () => declineGroupSuggestion(s, me), 'Could not save your answer. Please try again.');

  async function handlePick(contact) {
    const id = await openDirect(me, contact, all);
    setSelectedId(id);
    setModal(null);
  }

  async function handleInvite(uids) {
    await inviteStudents(selected.id, uids);
    setModal(null);
  }

  const loading = conversations === null;
  const nothing = !loading && mine.length === 0 && invites.length === 0 && suggestions.length === 0 && declined.length === 0;

  return (
    <section className={`msgs${selected ? ' is-thread' : ''}`}>
      <header className="page__head msgs__head">
        <h1 className="page__title">Messages</h1>
        {role !== 'student' && (
          <button type="button" className="btn btn--primary" onClick={() => setModal('new')} disabled={loading}>
            <Icon name="plus" size={18} style={{ verticalAlign: '-.2em', marginRight: '.35rem' }} />New message
          </button>
        )}
      </header>
      {error && <p className="alert alert--error" role="alert">{error}</p>}

      <div className="msgs__layout">
        <aside className="msgs__side card" aria-label="Conversations and requests">
          {loading && <p className="muted msgs__note">Loading…</p>}
          {role === 'student' && <StudentInvites invites={invites} busyId={busyId} onAccept={handleAcceptInvite} onDecline={handleDeclineInvite} />}
          {role === 'instructor' && <GroupSuggestions suggestions={suggestions} declined={declined} busyId={busyId} onAccept={handleCreateGroup} onDecline={handleDeclineSuggestion} />}
          <ConversationList conversations={mine} uid={user.uid} seen={seen} activeId={selectedId} onSelect={setSelectedId} />
          {nothing && (
            <p className="muted msgs__note">
              {role === 'student' && 'No group chats yet. When your instructor creates one for a subject, the invitation appears here.'}
              {role === 'instructor' && 'No conversations yet. Use New message to write to the administrator.'}
              {role === 'admin' && 'No conversations yet. Use New message to write to an instructor.'}
            </p>
          )}
        </aside>

        <div className="msgs__main">
          {selected
            ? <ChatThread key={selected.id} conversation={selected} me={me} onBack={() => setSelectedId(null)} onInvite={() => setModal('invite')} />
            : <div className="msgs__placeholder card"><Icon name="mail" size={32} /><p>Select a conversation to read and reply.</p></div>}
        </div>
      </div>

      {modal === 'new' && <NewMessageModal role={role} onPick={handlePick} onClose={() => setModal(null)} />}
      {modal === 'invite' && selected && <InviteModal title={selected.title} candidates={candidates} onInvite={handleInvite} onClose={() => setModal(null)} />}
    </section>
  );
}
