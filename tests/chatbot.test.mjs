import test from 'node:test';
import assert from 'node:assert/strict';
import { answerQuestion } from '../src/features/chatbot/lib/knowledgeSearch.js';
import { SUGGESTED_DRAFTS } from '../src/features/school-info/data/suggestedDrafts.js';

const entries = SUGGESTED_DRAFTS;
const ask = (q, list = entries) => answerQuestion(q, list);
const titles = (r) => (r.blocks || []).map((b) => b.title);

test('answers from stored entries with their source links', () => {
  const r = ask('What is the history of the school?');
  assert.equal(r.kind, 'answer'); assert.ok(titles(r).includes('History of John Paul College')); assert.ok(r.blocks[0].sourceUrl.startsWith('https://'));
  assert.ok(titles(ask('What are the mission and vision?')).some((t) => /Mission/.test(t)));
  assert.ok(titles(ask('What courses are offered?')).length >= 1);
  assert.ok(titles(ask('Do you offer TESDA cookery?')).some((t) => /TESDA/.test(t)));
});
test('Filipino keywords work', () => assert.equal(ask('ano ang misyon ng paaralan').kind, 'answer'));
test('says so when the information is not available, and never invents', () => {
  assert.equal(ask('When is the next school year opening?').kind, 'none');
  assert.equal(ask('Who is the principal?').kind, 'none');
  assert.equal(ask('What is the tuition fee?').kind, 'none');
});
test('an empty category is reported honestly', () => {
  assert.equal(ask('what is the mission', entries.filter((e) => e.category === 'history')).kind, 'category-empty');
  assert.equal(ask('anything', []).kind, 'empty');
});
test('answers from the newly added website topics', () => {
  assert.ok(titles(ask('What are the admission requirements?')).includes('Admission and enrollment requirements'));
  assert.ok(titles(ask('How can I contact the school?')).includes('Contact information and office hours'));
  assert.match(ask('What is the phone number?').blocks[0].paragraphs.join(' '), /289 7197/);
  assert.ok(titles(ask('Who is the president?')).includes('School leaders named on the website'));
  assert.ok(titles(ask('What strands does senior high school have?')).includes('Senior High School strands'));
  assert.ok(titles(ask('Is there a free education program for parents?')).includes('FreEd: Free Education for Parents'));
  assert.ok(titles(ask('Tell me about Project HOPE')).includes('Project HOPE (charity program)'));
  assert.ok(titles(ask('Do you offer BS Criminology?')).includes('College degree programs (CHED)'));
  assert.ok(titles(ask('What does the registrar do?')).includes('Registrar’s Office'));
});
test('privacy: nothing about individual youth from the MYClassroom page is stored', () => {
  const text = JSON.stringify(entries);
  assert.doesNotMatch(text, /Akkim|Winefredo|Mapano|Calanog|Escarez|Depuno/);
});
test('small talk', () => { assert.equal(ask('hello').kind, 'greeting'); assert.equal(ask('thank you').kind, 'thanks'); assert.equal(ask('help').kind, 'help'); });
test('core values entry is labelled as the closest statement, not an official list', () => {
  const r = ask('What are the core values?');
  assert.equal(r.kind, 'answer'); assert.match(r.blocks[0].paragraphs[0], /does not publish a separate list of core values/);
});
test('suggested entries are all drafts-to-review with a source link', () => {
  entries.forEach((e) => { assert.ok(e.sourceUrl.startsWith('https://johnpaulcollege.edu.ph')); assert.ok(e.content.length > 40); });
});
