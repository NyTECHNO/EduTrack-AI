import { KB_CATEGORIES, categoryLabel } from '../../../lib/knowledgeCategories.js';

// Local, rule-based search over the stored knowledge base. No API key, no generated text:
// every answer is the school's own stored wording plus its source link, or an honest "not available".

const STOP = new Set(('a an the is are was were be been am do does did of to in on at for from by with and or but if so as it its this that these those '
  + 'what which who whom whose when where why how can could would should will shall may might me my we our you your us tell please about '
  + 'ang ng sa ay mga na po ba ano yung ito iyon at si ni kay kung paano saan sino kailan '
  + 'john paul jpc college school edutrack').split(' '));

function stem(word) {
  let w = word;
  if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2);
  if (w.endsWith('ies')) w = `${w.slice(0, -3)}y`;
  return w.replace(/(es|s|e)$/, '');
}

export function tokenize(text) {
  return (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/).filter((t) => t.length > 1 && !STOP.has(t)).map(stem).filter((t) => t.length > 1);
}

const CATEGORY_WORDS = Object.fromEntries(KB_CATEGORIES.map((c) => [c.id, new Set(c.words.flatMap((w) => tokenize(w)))]));
const MENU = KB_CATEGORIES.map((c) => c.label).join(', ');

function pickParagraphs(content, queryTokens) {
  const paragraphs = content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (content.length <= 800 || paragraphs.length <= 2) return paragraphs;
  const scored = paragraphs.map((text, index) => ({ text, index, score: tokenize(text).filter((t) => queryTokens.includes(t)).length }));
  const best = scored.filter((p) => p.score > 0).sort((a, b) => b.score - a.score).slice(0, 2).sort((a, b) => a.index - b.index);
  return (best.length ? best : scored.slice(0, 1)).map((p) => p.text);
}

export function findEntries(question, entries) {
  const queryTokens = [...new Set(tokenize(question))];
  if (!queryTokens.length) return { queryTokens, intents: [], matches: [] };
  const intents = KB_CATEGORIES.map((c) => c.id).filter((id) => queryTokens.some((t) => CATEGORY_WORDS[id].has(t)));

  const matches = entries.map((entry) => {
    const title = new Set(tokenize(entry.title));
    const keywords = new Set(tokenize((entry.keywords || []).join(' ')));
    const body = tokenize(entry.content);
    let score = 0;
    let strong = 0; // matches in the title or keywords
    const hit = new Set();
    queryTokens.forEach((t) => {
      if (title.has(t)) { score += 3; hit.add(t); strong += 1; }
      if (keywords.has(t)) { score += 3; hit.add(t); strong += 1; }
      const n = body.filter((b) => b === t).length;
      if (n) { score += Math.min(n, 3); hit.add(t); }
    });
    const inIntent = intents.includes(entry.category);
    if (inIntent) score += 4;
    return { entry, score, distinct: hit.size, ok: inIntent || strong > 0 || hit.size >= 3 };
  }).filter((m) => m.ok && m.score >= 3).sort((a, b) => b.score - a.score);

  const top = matches[0]?.score || 0;
  return { queryTokens, intents, matches: matches.filter((m) => m.score >= top * 0.5).slice(0, 3) };
}

/** Returns { kind, text?, blocks? }. kind: greeting | thanks | help | empty | category-empty | none | answer */
export function answerQuestion(question, entries) {
  const q = question.trim().toLowerCase();
  if (/^(hi|hello|hey|kumusta|good (morning|afternoon|evening))\b/.test(q) && q.split(/\s+/).length <= 4) return { kind: 'greeting' };
  if (/^(thanks|thank you|salamat)\b/.test(q)) return { kind: 'thanks' };
  if (/^(help|what can you do|menu)\b/.test(q)) return { kind: 'help' };
  if (!entries.length) return { kind: 'empty' };

  const { queryTokens, intents, matches } = findEntries(question, entries);
  if (!matches.length) {
    const missing = intents.filter((id) => !entries.some((e) => e.category === id));
    if (missing.length) return { kind: 'category-empty', text: categoryLabel(missing[0]) };
    return { kind: 'none' };
  }
  return {
    kind: 'answer',
    blocks: matches.map(({ entry }) => ({ id: entry.id, title: entry.title, paragraphs: pickParagraphs(entry.content, queryTokens), sourceUrl: entry.sourceUrl || '' })),
  };
}

export const HELP_TEXT = `I can answer questions about: ${MENU}. I only use the school's official information, so if something isn't there I'll tell you.`;
