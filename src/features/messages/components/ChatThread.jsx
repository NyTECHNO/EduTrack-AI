import { useEffect, useRef, useState } from 'react';
import Icon from '../../../components/ui/Icon.jsx';
import { sendMessage, subscribeToMessages } from '../services/messagesService.js';
import { ROLE_LABEL, clockTime, conversationInitial, conversationTitle, dayKey, dayLabel, otherPerson } from '../lib/display.js';

// One open conversation: header, the messages (each in its own bubble) and the box to write in.
export default function ChatThread({ conversation, me, onBack, onInvite }) {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const logRef = useRef(null);
  const inputRef = useRef(null);
  const isGroup = conversation.type === 'group';
  const owner = isGroup && conversation.instructorId === me.uid;

  useEffect(() => {
    setMessages([]); setError(''); setText('');
    return subscribeToMessages(conversation.id, setMessages, () => setError('Could not load the messages. Check your connection and try again.'));
  }, [conversation.id]);

  useEffect(() => { const el = logRef.current; if (el) el.scrollTop = el.scrollHeight; }, [messages]);

  async function submit() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true); setError('');
    try {
      await sendMessage(conversation.id, me, body);
      setText('');
    } catch {
      setError('Your message could not be sent. Please try again.');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function onKeyDown(e) {
    // Enter sends on a computer; on a phone Enter adds a new line and the Send button sends.
    const touch = window.matchMedia('(pointer: coarse)').matches;
    if (e.key === 'Enter' && !e.shiftKey && !touch) { e.preventDefault(); submit(); }
  }

  const subtitle = isGroup
    ? `Group chat · ${conversation.memberIds.length} member${conversation.memberIds.length === 1 ? '' : 's'}${owner && conversation.invitedIds?.length ? ` · ${conversation.invitedIds.length} waiting to answer` : ''}`
    : ROLE_LABEL[me.role === 'admin' ? 'instructor' : 'admin'];

  let lastDay = '';
  return (
    <section className="thread card" aria-label={`Conversation: ${conversationTitle(conversation, me.uid)}`}>
      <header className="thread__head">
        <button type="button" className="icon-btn thread__back" onClick={onBack} aria-label="Back to conversations"><Icon name="arrowLeft" /></button>
        <span className="convo__avatar" aria-hidden="true">{isGroup ? <Icon name="users" size={20} /> : conversationInitial(conversation, me.uid)}</span>
        <div className="thread__who">
          <strong>{isGroup ? conversation.title : otherPerson(conversation, me.uid).name}</strong>
          <span>{subtitle}</span>
        </div>
        {owner && <button type="button" className="btn btn--ghost btn--small thread__invite" onClick={onInvite}>Invite students</button>}
      </header>

      <ol className="thread__log" ref={logRef} role="log" aria-live="polite" aria-label="Messages">
        {messages.length === 0 && !error && <li className="thread__empty">No messages yet. Say hello!</li>}
        {messages.map((m) => {
          const mine = m.senderId === me.uid;
          const key = dayKey(m.createdAt);
          const showDay = key && key !== lastDay;
          if (key) lastDay = key;
          return (
            <li key={m.id} className="thread__item">
              {showDay && <p className="thread__day">{dayLabel(m.createdAt)}</p>}
              <div className={`bubble-row${mine ? ' is-mine' : ''}`}>
                <div className="bubble">
                  {isGroup && !mine && (
                    <p className="bubble__who"><strong>{m.senderName}</strong><span className="badge badge--excused">{ROLE_LABEL[m.senderRole] || m.senderRole}</span></p>
                  )}
                  <p className="bubble__text">{m.text}</p>
                  <span className="bubble__time">{clockTime(m.createdAt)}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {error && <p className="alert alert--error thread__error" role="alert">{error}</p>}
      <form className="thread__composer" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <textarea ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKeyDown} rows={1} maxLength={2000}
          placeholder="Write a message…" aria-label="Write a message" enterKeyHint="send" />
        <button type="submit" className="btn btn--primary chat__send" disabled={sending || !text.trim()} aria-label="Send message"><Icon name="send" size={20} /></button>
      </form>
    </section>
  );
}
