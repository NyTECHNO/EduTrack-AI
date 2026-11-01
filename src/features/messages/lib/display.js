// Small helpers that turn a conversation document into what is shown on screen.
export const ROLE_LABEL = { admin: 'Administrator', instructor: 'Instructor', student: 'Student' };

export const toDate = (value) => (value && typeof value.toDate === 'function' ? value.toDate() : null);
export const toMillis = (value) => (value && typeof value.toMillis === 'function' ? value.toMillis() : 0);

export const otherPerson = (conversation, uid) => {
  const id = (conversation.memberIds || []).find((m) => m !== uid);
  return { uid: id, name: (conversation.names || {})[id] || 'Unknown person' };
};

export const conversationTitle = (conversation, uid) => (conversation.type === 'group' ? conversation.title || 'Group chat' : otherPerson(conversation, uid).name);

export const conversationInitial = (conversation, uid) => conversationTitle(conversation, uid).trim().charAt(0).toUpperCase() || '?';

// "You: hello", "Maria: hello" in a group, or just the text in a private chat.
export function previewText(conversation, uid) {
  const last = conversation.lastMessage;
  if (!last) return 'No messages yet';
  if (last.senderId === uid) return `You: ${last.text}`;
  return conversation.type === 'group' ? `${last.senderName}: ${last.text}` : last.text;
}

export const isUnread = (conversation, uid, seen) => Boolean(conversation.lastMessage)
  && conversation.lastMessage.senderId !== uid
  && toMillis(conversation.lastMessageAt) > (seen[conversation.id] || 0);

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

// Time for today, "Yesterday", or the date, for the conversation list.
export function listTime(value) {
  const date = toDate(value);
  if (!date) return '';
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);
  if (days <= 0) return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export const clockTime = (value) => {
  const date = toDate(value);
  return date ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
};

export function dayLabel(value) {
  const date = toDate(value);
  if (!date) return '';
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
}

export const dayKey = (value) => {
  const date = toDate(value);
  return date ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` : '';
};
