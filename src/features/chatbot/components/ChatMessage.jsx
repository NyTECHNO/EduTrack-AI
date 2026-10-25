import { HELP_TEXT } from '../lib/knowledgeSearch.js';
import { KB_CATEGORIES } from '../../../lib/knowledgeCategories.js';

const NONE = `I couldn’t find that in the school information I have. ${HELP_TEXT} For anything else, please contact the school office.`;

function Bot({ reply, onAsk }) {
  switch (reply.kind) {
    case 'greeting':
      return (<><p>Hello! I’m the John Paul College assistant. {HELP_TEXT}</p>
        <div className="chips-row">{KB_CATEGORIES.map((c) => <button type="button" key={c.id} className="suggest" onClick={() => onAsk(c.example)}>{c.label}</button>)}</div></>);
    case 'thanks': return <p>You’re welcome! Ask me anything else about the school.</p>;
    case 'help': return <p>{HELP_TEXT}</p>;
    case 'empty': return <p>The school information hasn’t been added yet. Please check back soon.</p>;
    case 'category-empty': return <p>The school hasn’t added information about <strong>{reply.text}</strong> yet. Please check back later or contact the school office.</p>;
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

export default function ChatMessage({ message, onAsk }) {
  if (message.from === 'user') return <div className="msg msg--user"><p>{message.text}</p></div>;
  return <div className="msg msg--bot"><Bot reply={message.reply} onAsk={onAsk} /></div>;
}
