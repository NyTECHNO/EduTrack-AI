import logo from '../../../assets/logos/jpc-logo-48.png';
import { HELP_TEXT } from '../lib/knowledgeSearch.js';
import { KB_CATEGORIES } from '../../../lib/knowledgeCategories.js';

const NONE = `I couldn’t find that in the school information I have. ${HELP_TEXT} For anything else, please contact the school office.`;

// What the assistant says, by kind of reply (see answerQuestion in lib/knowledgeSearch.js).
function Bot({ reply, onAsk }) {
  switch (reply.kind) {
    case 'greeting':
      return (
        <>
          <p>Hello! I’m the John Paul College assistant. {HELP_TEXT}</p>
          <div className="chips-row">
            {KB_CATEGORIES.map((c) => <button type="button" key={c.id} className="suggest" onClick={() => onAsk(c.example)}>{c.label}</button>)}
          </div>
        </>
      );
    case 'thanks': return <p>You’re welcome! Ask me anything else about the school.</p>;
    case 'help': return <p>{HELP_TEXT}</p>;
    case 'empty': return <p>The school information hasn’t been added yet. Please check back soon.</p>;
    case 'category-empty':
      return <p>The school hasn’t added information about <strong>{reply.text}</strong> yet. Please check back later or contact the school office.</p>;
    case 'answer':
      return reply.blocks.map((b) => (
        <div className="answer" key={b.id}>
          {reply.blocks.length > 1 && <strong>{b.title}</strong>}
          {b.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
          {b.sourceUrl && <p className="answer__src"><a href={b.sourceUrl} target="_blank" rel="noopener noreferrer">Source: {new URL(b.sourceUrl).hostname}</a></p>}
        </div>
      ));
    default: return <p>{NONE}</p>;
  }
}

// Each message is one unit for assistive technology: <figure> > <blockquote> (what was said) + <figcaption> (who said it).
export default function ChatMessage({ message, onAsk, active, onActivate, userName }) {
  const isUser = message.from === 'user';
  return (
    <figure className={`msgcard msgcard--${isUser ? 'user' : 'bot'}${active ? ' is-active' : ''}`} tabIndex={0}
      onPointerEnter={(e) => { if (e.pointerType !== 'touch') onActivate(message.id); }} onFocus={() => onActivate(message.id)}>
      {isUser
        ? <span className="msgcard__avatar msgcard__avatar--user" aria-hidden="true">{(userName || 'Y').charAt(0).toUpperCase()}</span>
        : <img className="msgcard__avatar" src={logo} alt="" width="40" height="40" />}
      <div className="msgcard__main">
        <blockquote>{isUser ? <p>{message.text}</p> : <Bot reply={message.reply} onAsk={onAsk} />}</blockquote>
        <figcaption>{isUser ? userName || 'You' : 'School assistant'}</figcaption>
      </div>
    </figure>
  );
}
