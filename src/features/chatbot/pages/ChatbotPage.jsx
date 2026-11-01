import { profileName } from '../../../lib/profile.js';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import ChatMessage from '../components/ChatMessage.jsx';
import useKnowledge from '../hooks/useKnowledge.js';
import { answerQuestion } from '../lib/knowledgeSearch.js';
import Icon from '../../../components/ui/Icon.jsx';
import './chat.css';

let nextId = 1;

export default function ChatbotPage() {
  const { role, profile } = useAuth();
  const [includeDrafts, setIncludeDrafts] = useState(false); // admin-only preview, so drafts can be tested before publishing
  const { loading, entries, error } = useKnowledge(role === 'admin' && includeDrafts);
  const [messages, setMessages] = useState([{ id: 0, from: 'bot', reply: { kind: 'greeting' } }]);
  const [text, setText] = useState('');
  const [activeId, setActiveId] = useState(null); // the spotlighted message; cleared only when the pointer or focus leaves the whole list
  const logRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);

  function ask(question) {
    const q = question.trim();
    if (!q || loading) return;
    const reply = answerQuestion(q, entries);
    setMessages((m) => [...m, { id: nextId++, from: 'user', text: q }, { id: nextId++, from: 'bot', reply }]);
    setText('');
    inputRef.current?.focus();
  }

  return (
    <section className="chat">
      <header className="chat__head">
        <h1 className="page__title">School assistant</h1>
        {role === 'admin' && (
          <label className="chat__toggle"><input type="checkbox" checked={includeDrafts} onChange={(e) => setIncludeDrafts(e.target.checked)} /> Include drafts (admin preview)</label>
        )}
      </header>
      {error && <p className="alert alert--error" role="alert">{error}</p>}
      <div className={`chat__log${activeId !== null ? ' is-spot' : ''}`} ref={logRef} role="log" aria-live="polite" aria-label="Conversation"
        onPointerLeave={() => setActiveId(null)}
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setActiveId(null); }}>
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} onAsk={ask} active={activeId === m.id} onActivate={setActiveId} userName={profileName(profile)} />
        ))}
      </div>
      <form className="chat__composer" onSubmit={(e) => { e.preventDefault(); ask(text); }}>
        <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} placeholder={loading ? 'Loading school information…' : 'Ask about the school…'}
          aria-label="Your question" maxLength={300} autoComplete="off" enterKeyHint="send" />
        <button type="submit" className="btn btn--primary chat__send" disabled={loading || !text.trim()} aria-label="Send"><Icon name="send" size={20} /></button>
      </form>
    </section>
  );
}
