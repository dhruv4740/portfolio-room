// Ask gate test: node scripts/test-ask-gate.mjs   (no server; imports the gate directly)
// Questions that must reach the model are never gated; greetings and clearly unrelated ones are answered by the gate.
import { gateAnswer } from '../functions/_ask/knowledge.js';
import { onRequestPost } from '../functions/api/ask.js';

const REACH = ['can you code in rust?', "what's your salary expectation?", 'are you available in January?', 'do you know kubernetes?', 'why should we hire you?', 'what tech stack do you use?',
  'tell me about FocusLock', 'what did you do at Blink?', 'is he good at React?', 'where is he based?', "what's his GPA?", 'React or Vue?', 'how many tests does focuslock have', 'github?', 'email?',
  "what's the hardest bug you fixed", 'do you have work authorization', 'notice period?', 'remote ok?', 'strengths and weaknesses'];
const GATE = ['hi', 'hello there', 'thanks', 'what is the capital of France', 'write me a poem about cats', 'what is 2+2', 'who won the world cup', 'translate bonjour'];

let bad = 0;
const row = (q, want) => {
  const g = gateAnswer(q), got = g ? g.kind : 'model', ok = want === 'model' ? !g : !!g;
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${want === 'model' ? 'must reach model' : 'must gate       '}  ${JSON.stringify(q).padEnd(42)} -> ${got}`);
};
REACH.forEach((q) => row(q, 'model'));
GATE.forEach((q) => row(q, 'gate'));
// Through the endpoint: a gated question must not touch Turnstile, KV or a provider (any such call throws).
const boom = () => { throw new Error('touched'); };
globalThis.fetch = boom;
const env = { ASK_KV: { get: boom, put: boom }, TURNSTILE_SECRET: 's', GROQ_API_KEY: 'g' };
for (const q of ['hi', 'what is 2+2']) {
  const r = await onRequestPost({ env, request: new Request('https://x.test/api/ask', { method: 'POST', body: JSON.stringify({ q, token: 't' }) }) }).then((x) => x.json()).catch((e) => ({ provider: String(e.message) }));
  const ok = r.provider === 'gate' && typeof r.answer === 'string'; if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  endpoint ${JSON.stringify(q)} -> provider ${r.provider}, no Turnstile/KV/model call`);
}
console.log(bad ? `\n${bad} wrong of ${REACH.length + GATE.length}` : `\nall ${REACH.length + GATE.length} correct`);
process.exit(bad ? 1 : 0);
