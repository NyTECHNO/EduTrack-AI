import Icon from '../../../components/ui/Icon.jsx';
import { conversationInitial, conversationTitle, isUnread, listTime, previewText } from '../lib/display.js';

export default function ConversationList({ conversations, uid, seen, activeId, onSelect }) {
  if (conversations.length === 0) return null;
  return (
    <ul className="convos" aria-label="Conversations">
      {conversations.map((c) => {
        const unread = isUnread(c, uid, seen) && c.id !== activeId;
        return (
          <li key={c.id}>
            <button type="button" className={`convo${c.id === activeId ? ' is-active' : ''}${unread ? ' is-unread' : ''}`}
              onClick={() => onSelect(c.id)} aria-current={c.id === activeId ? 'true' : undefined}>
              <span className="convo__avatar" aria-hidden="true">
                {c.type === 'group' ? <Icon name="users" size={20} /> : conversationInitial(c, uid)}
              </span>
              <span className="convo__body">
                <span className="convo__top">
                  <strong className="convo__title">{conversationTitle(c, uid)}</strong>
                  <span className="convo__time">{listTime(c.lastMessageAt)}</span>
                </span>
                <span className="convo__preview">{previewText(c, uid)}</span>
              </span>
              {unread && <span className="convo__dot" role="img" aria-label="Unread messages" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
