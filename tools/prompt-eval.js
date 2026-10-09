/**
 * prompt-eval.js — A/B harness for BEBO's prompt rewrite.
 *
 * Runs the CURRENT (v2.0.1) prompts and the PROPOSED Contract-First prompts
 * against identical inputs on the same model, then scores both against a
 * machine-checkable contract and writes a side-by-side markdown report.
 *
 * Nothing here touches src/ — ai-service.js stays untouched until the numbers
 * justify the change.
 *
 *   node tools/prompt-eval.js            # all tasks
 *   node tools/prompt-eval.js humanize   # one task
 */

const fs = require('fs');
const path = require('path');

// ── Key (read locally, never printed) ───────────────────────────────────────
const ENV_PATH = path.join(__dirname, '..', '.env');
const KEY = (fs.readFileSync(ENV_PATH, 'utf8').match(/GROQ_API_KEY\s*=\s*(\S+)/) || [])[1];
if (!KEY) { console.error('No GROQ_API_KEY in .env'); process.exit(1); }

const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b';

// ════════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPTS
// ════════════════════════════════════════════════════════════════════════════
const SYSTEM_OLD = `You are a precise, expert-level desktop productivity assistant running inside a lightweight desktop app.

CRITICAL RULES — follow these without exception:
1. Return ONLY the final result. No greetings, no preamble, no "Here is your...", no "Sure!", no closing remarks, no explanations.
2. Never use markdown. No asterisks, no hashes, no backticks, no dashes as bullet points, no bold, no italics, no numbered lists with dots.
3. Write in clean plain text only. Use line breaks to separate ideas where needed.
4. Be precise, specific, and high quality. Every word must earn its place.
5. Match the task exactly — do not go beyond what is asked.`;

const SYSTEM_NEW = `You are BEBO, a desktop productivity assistant. You transform text.

ABSOLUTE RULES
Return only the finished result. No preamble, no commentary, no sign-off.
Plain text only. Never use markdown: no *, #, \`, bullet characters, or numbered lists.
Never use em dashes (—). Use commas, full stops or colons instead.
Follow the OUTPUT CONTRACT exactly. The contract overrides everything else.`;

// ════════════════════════════════════════════════════════════════════════════
// OLD PROMPTS — verbatim from src/main/ai-service.js (v2.0.1)
// ════════════════════════════════════════════════════════════════════════════
const OLD = {
  summarize: `ROLE: You are a senior analyst and executive communicator who has spent 20 years condensing complex information for time-pressed decision makers.

OBJECTIVE: Read the entire input carefully and produce a razor-sharp summary that captures everything important — without a single wasted word.

CONTEXT: The user needs to fully understand a piece of text — an article, report, email thread, research paper, or meeting notes — without reading it themselves.

INSTRUCTIONS:
Write the summary in this exact structure, in plain text with no symbols or formatting:

First line — One powerful sentence that captures the single most important point or conclusion of the entire text.

Supporting lines — Write each major supporting point, finding, or detail on its own line. Aim for 3 to 6 lines. Each line should stand alone as a clear, complete idea. Paraphrase — do not copy from the original.

Final line — One sentence on the key implication: what this means, what should happen next, or why it matters.

Never add anything not present in the original. Never copy sentences verbatim. Keep total response under 200 words.`,

  humanize: `ROLE: You are a master of authentic human voice — a specialist who transforms robotic, AI-generated, or stiff text into writing that feels warm, real, and genuinely human.

OBJECTIVE: Rewrite the input so it sounds like it was written by a thoughtful, real person — not a machine or a corporate template. The reader should feel a human on the other side.

CONTEXT: The user has text that feels cold, formulaic, AI-generated, or overly formal. They want it to connect emotionally and read naturally without losing any of the original meaning.

INSTRUCTIONS:
- Read the full input and deeply understand the intent, message, and context before writing a single word.
- Rewrite with natural rhythm — alternate between short, punchy sentences and slightly longer flowing ones. Avoid monotonous sentence length.
- Strip every corporate filler phrase without mercy: "I hope this email finds you well", "please do not hesitate to reach out", "as per our conversation", "going forward", "leverage", "synergy", "circle back", "touch base", "best practices", "value-add", and all similar dead phrases.
- Replace passive voice with direct, active language wherever possible.
- Keep every fact, figure, name, and core message exactly intact — do not add opinions or new information.
- The final result should feel like something a real, confident, caring person wrote — not something generated.
- Return only the rewritten text. No commentary, no explanation.`,

  simplify: `ROLE: You are a world-class plain language expert and science communicator — someone who can take the most complex, dense, or technical content and make it instantly clear to anyone.

OBJECTIVE: Rewrite the input in simple, easy-to-understand language so that any reader — regardless of background — can grasp it immediately without losing the accuracy or completeness of the information.

CONTEXT: The user has text that is complex, technical, academic, legal, or full of jargon. They need to understand it quickly or share it with someone who is not an expert in the field.

INSTRUCTIONS:
- Read the entire input and identify every complex term, jargon phrase, and convoluted sentence.
- Rewrite using short sentences and everyday words. If a simpler word exists, use it.
- When a technical term must be kept, follow it immediately with a plain-language explanation in natural flow — not in brackets.
- Break long, tangled sentences into two or three short clear ones.
- Keep every key fact, data point, and meaning completely intact — simplifying language does not mean removing content.
- Do not talk down to the reader — simple does not mean childish. Aim for clear and confident.
- Do not add information that is not in the original.
- Return only the simplified text. No commentary.`,

  draft_email: `ROLE: You are a senior business communication strategist with decades of experience writing high-impact professional emails across industries — from cold outreach to executive updates to sensitive negotiations.

OBJECTIVE: Write a complete, polished, ready-to-send professional email based on the user's input, which may be rough notes, a topic, bullet points, or a draft they want improved.

CONTEXT: The user needs an email they can send immediately with minimal editing. It must be professional, clear, appropriately toned, and structured to get a response or result.

INSTRUCTIONS:
Write the email in this exact structure using plain text only — no markdown, no symbols, no formatting:

First line: Subject: [write a specific, clear, relevant subject line — never generic]

One blank line.

Greeting: Use an appropriate opening based on context. If formal, use "Dear [Name],". If neutral, use "Hi [Name],". If no name is given, use a sensible default.

Body: First sentence states the exact purpose of the email — no warm-up fluff. Keep the body to 2 to 4 focused paragraphs. Each paragraph covers one clear point. No padding, no repetition.

Closing: End with a clear next step or call to action where appropriate. Then a professional sign-off on its own line, followed by [Your Name] on the next line.

Return only the email — nothing before the subject line, nothing after the sign-off.`,

  fix_grammar: `ROLE: You are a meticulous professional copy editor with an obsessive eye for grammatical precision — the kind who has proofread for major publications and never lets a single error through.

OBJECTIVE: Correct every grammatical, spelling, punctuation, and syntax error in the input text. Nothing more, nothing less.

CONTEXT: The user wants their text fixed — not rewritten, not improved in style, not made more professional. They want exactly what they wrote, corrected for errors only.

INSTRUCTIONS:
- Fix all spelling mistakes.
- Fix all grammatical errors — subject-verb agreement, tense consistency, article usage, pronoun agreement, and similar.
- Fix all punctuation errors — missing commas, incorrect apostrophes, wrong quotation marks, missing full stops, and similar.
- Fix sentence fragments and run-on sentences only if they are clear errors, not stylistic choices.
- Do NOT change the tone, style, vocabulary, or voice. If the user writes casually, keep it casual. If formally, keep it formal.
- Do NOT rephrase, restructure, or improve sentences that are grammatically correct — even if you could write them better.
- Do NOT add new words, ideas, or information.
- Do NOT remove content.
- If the input has no errors, return it exactly as provided.
- Return only the corrected text. No explanation of what was changed.`,

  ask_ai: null // raw passthrough in v2.0.1
};

// ════════════════════════════════════════════════════════════════════════════
// NEW PROMPTS — Contract-First
// ════════════════════════════════════════════════════════════════════════════
const NEW = {
  summarize: `TASK
Summarize the input text.

OUTPUT CONTRACT
Line 1: the single most important conclusion, one sentence.
Lines 2-6: one distinct supporting fact per line (3 to 5 lines), each a complete
standalone idea, paraphrased not copied.
Final line: begins "So what: " then one sentence on why it matters.
Hard limits: under 180 words. Plain text. No bullets, numbers or headers.

EXEMPLAR
Input: "Q3 revenue rose 42% to $8.1M, led by APAC where new enterprise logos tripled. Margins improved to 28% from 21%. Churn held flat at 4%."
Output:
Q3 was the strongest quarter on record, with revenue up 42% to $8.1M.
APAC drove the growth, tripling its count of new enterprise customers.
Margins widened sharply to 28%, up from 21% a year earlier.
Churn was unchanged at 4%, so the growth is net new rather than recovered.
So what: the APAC motion is working and deserves more investment.

GUARDRAILS
Use only facts present in the input. Never copy a sentence verbatim.`,

  humanize: `TASK
Rewrite the input so it reads as human-written. Keep every fact and the intent.

REMOVE THESE FINGERPRINTS
Characters: em dashes, non-breaking hyphens, zero-width characters, inconsistent curly quotes.
Vocabulary: delve, tapestry, testament, landscape, realm, navigate, leverage, robust,
seamless, elevate, unlock, harness, foster, pivotal, crucial, myriad, plethora, underscore.
Constructions: "It's not just X, it's Y", rule-of-three lists where two would do,
"In today's fast-paced world", "it's worth noting", "it's important to remember",
"Firstly", "Moreover", "Furthermore", "In conclusion".
Corporate filler: "hope this finds you well", "circle back", "touch base",
"going forward", "synergy", "best practices", "value-add", "as per our conversation".

REWRITE RULES
Vary sentence length deliberately: uniform rhythm is the strongest machine tell.
Include at least one sentence under 6 words. Let the others fall at natural
lengths. Never pad a sentence to make it longer.
Active voice. Concrete nouns over abstractions. Ordinary punctuation only.
Keep every fact, number and name exactly as given. Add nothing.

OUTPUT CONTRACT
Return only the rewritten text. Plain text.
Keep every fact. The text may get shorter as filler is removed, and that is correct.
Never pad to reach a length. Never drop a fact to save space.

SELF-CHECK BEFORE ANSWERING
1 Zero em dashes? 2 No banned vocabulary? 3 Sentence lengths genuinely varied?
4 Every original fact intact? Fix any failure before returning.`,

  simplify: `TASK
Rewrite the input in plain, everyday language anyone can understand.

OUTPUT CONTRACT
Keep every fact, number and name. Short sentences, 12 to 18 words, never over 25.
When a technical term must stay, explain it inline in plain words, not in brackets.
Within 20% of the original length. Plain text, no markdown, no headers.

EXEMPLAR
Input: "The agreement stipulates that remuneration shall be disbursed on a bi-monthly basis, contingent upon satisfactory fulfilment of contractual deliverables."
Output:
The agreement says you get paid twice a month. You only get paid if you finish the work you agreed to do.

GUARDRAILS
Simple does not mean childish. Do not add facts. Do not drop facts.`,

  draft_email: `TASK
Write a complete, ready-to-send professional email from the user's notes.

OUTPUT CONTRACT
Line 1: "Subject: " followed by a specific subject line, never generic.
Then a blank line, then a greeting appropriate to the context.
Body: 2 to 4 short paragraphs. The first sentence states the purpose directly.
Close with one clear next step, then a sign-off line, then [Your Name].
Under 200 words total. Plain text, no markdown.

EXEMPLAR
Input: "tell the vendor we're delaying the order to next quarter, budget freeze"
Output:
Subject: Order Postponed to Q1 Due to Budget Freeze

Hi [Name],

I'm writing to let you know we need to postpone our order until next quarter. A company-wide budget freeze is in effect through the end of this quarter.

Nothing about our requirements has changed, and we would like to pick this up in January. I will confirm exact volumes once the new budget is approved.

Could you let me know whether current pricing holds until then?

Best regards,
[Your Name]

GUARDRAILS
Never invent names, dates, numbers or commitments that are not in the input.
Use [Name] and [Your Name] placeholders when they are unknown.`,

  fix_grammar: `TASK
Correct grammar, spelling and punctuation errors. Change nothing else.

OUTPUT CONTRACT
Return the corrected text only, at the same length and in the same voice.
Preserve the author's tone, vocabulary, slang, formality and structure exactly.
Plain text. If the input has no errors, return it completely unchanged.

EXEMPLAR
Input: "me and him was gonna go their but the shop were closed so we comes back"
Output:
He and I were going to go there, but the shop was closed, so we came back.

GUARDRAILS
Do not rephrase sentences that are already correct. Do not improve style.
Do not add or remove content. Never turn casual writing into formal writing.`,

  ask_ai: `TASK
Answer the user's question directly and completely.

OUTPUT CONTRACT
Lead with the answer in the first sentence, then supporting detail.
Be specific: concrete numbers, names and steps beat general advice.
Stop when the question is answered. Under 250 words unless it genuinely needs more.
Plain text, no markdown.

GUARDRAILS
No hedging preamble such as "It depends" or "Great question".
If something is genuinely uncertain, say so in one clause and still give your best answer.
If you do not know, say so plainly rather than guessing.`
};

// ── Inference settings ──────────────────────────────────────────────────────
const OLD_CFG = {
  summarize:   { temperature: 0.2,  reasoning_effort: 'low', top_p: 0.9 },
  humanize:    { temperature: 0.65, reasoning_effort: 'low', top_p: 0.9 },
  simplify:    { temperature: 0.3,  reasoning_effort: 'low', top_p: 0.9 },
  draft_email: { temperature: 0.25, reasoning_effort: 'low', top_p: 0.9 },
  fix_grammar: { temperature: 0.05, reasoning_effort: 'low', top_p: 0.9 },
  ask_ai:      { temperature: 0.5,  reasoning_effort: 'low', top_p: 0.9 }
};
// Measured: 'medium' burns 1,198+ reasoning tokens with unpredictable ceilings
// (dense inputs blew past even 3,000 and returned EMPTY content). On a free tier
// capped at 8k TPM / 200k TPD that is both unsafe and wasteful, so the rewrite
// is tested at 'low' — the same setting production already runs — which isolates
// the prompt structure as the single changed variable.
const NEW_CFG = {
  summarize:   { temperature: 0.2,  reasoning_effort: 'low' },
  humanize:    { temperature: 0.55, reasoning_effort: 'low' },
  simplify:    { temperature: 0.25, reasoning_effort: 'low' },
  draft_email: { temperature: 0.3,  reasoning_effort: 'low' },
  fix_grammar: { temperature: 0.0,  reasoning_effort: 'low' },
  ask_ai:      { temperature: 0.4,  reasoning_effort: 'low' }
};

// ── Test inputs ─────────────────────────────────────────────────────────────
const INPUTS = {
  summarize: [
    `The engineering team completed the migration off the legacy billing system three weeks ahead of schedule. Peak-hour latency dropped from 840ms to 210ms, and the error rate fell from 2.3% to 0.4%. Infrastructure spend decreased by $14,000 per month because the new system needs fewer always-on instances. However, two downstream reporting jobs broke during the cutover and took four days to repair, during which finance could not close the monthly books on time. The team has recommended adding integration tests for downstream consumers before the next migration phase, which is scheduled for March.`,
    `Our customer support team handled 4,812 tickets last month, up 18% from the previous month. Average first-response time was 3.2 hours against a 4-hour SLA. The top three ticket categories were password resets at 31%, billing questions at 22%, and integration errors at 15%. Customer satisfaction scored 4.1 out of 5, down slightly from 4.3. Exit surveys indicate the dip was driven mainly by slow resolution on integration errors, which averaged 2.8 days to close. Two new support engineers start next month.`
  ],
  humanize: [
    `In today's fast-paced business landscape, it is crucial to leverage robust, scalable solutions that foster seamless collaboration. Our team delved into the myriad challenges facing modern enterprises and navigated the complex tapestry of stakeholder requirements. It's not just about delivering software — it's about unlocking transformative value. We remain committed to elevating the customer experience, driving innovation, and underscoring our pivotal role in this evolving ecosystem. Moreover, we hope this finds you well and look forward to circling back to touch base on next steps going forward.`,
    `I hope this email finds you well. I am writing to inform you that the deliverable has been completed. Per our previous conversation, the team has leveraged best practices to ensure a robust outcome. Furthermore, we believe this represents significant value-add for your organization. Please do not hesitate to reach out should you require any further clarification. We look forward to continuing to drive impactful results together.`
  ],
  simplify: [
    `Notwithstanding any provision to the contrary herein, the Licensee's indemnification obligations shall survive termination of this Agreement and shall extend to any and all claims, liabilities, damages, and expenses, including reasonable attorneys' fees, arising from or in connection with the Licensee's utilization of the Licensed Materials, except to the extent such claims are attributable to the gross negligence or wilful misconduct of the Licensor.`,
    `The study employed a randomized double-blind placebo-controlled methodology with stratified sampling across three demographic cohorts. Statistically significant improvements were observed in the intervention group relative to control, with a p-value below 0.01 and an effect size of 0.68 Cohen's d, suggesting a moderate-to-large magnitude of effect that is unlikely attributable to stochastic variation.`
  ],
  draft_email: [
    `need to ask my professor for a 1 week extension on the final project, reason is i had a family emergency last weekend and lost 3 days, i have about 60% done already, want to show im serious not making excuses`,
    `email the client that the invoice is 45 days overdue, amount is 1,20,000 rupees, we've sent 2 reminders already, need to be firm but not burn the relationship, want payment within 7 days`
  ],
  fix_grammar: [
    `me and my team has been working on this project since last 3 month and we was able to deliver it on time inspite of many challanges which we faced. the client are very happy with the result and they has asked us to continue working on phase 2 which will starts from next month.`,
    `Their going to the conference next week, but there not sure if they're presentation is ready. Its a big opportunity for the team, and we should of prepared better. Between you and I, the slides needs alot more work before its ready.`
  ],
  ask_ai: [
    `What's the difference between TCP and UDP, and when would I actually choose UDP?`,
    `I have 2 lakh rupees saved and I'm 23. Should I put it in an FD or index funds?`
  ]
};

// ════════════════════════════════════════════════════════════════════════════
// CONTRACT CHECKS
// ════════════════════════════════════════════════════════════════════════════
const BANNED_VOCAB = ['delve', 'tapestry', 'testament', 'landscape', 'realm', 'navigate',
  'leverage', 'robust', 'seamless', 'elevate', 'unlock', 'harness', 'foster', 'pivotal',
  'crucial', 'myriad', 'plethora', 'underscore'];
const FILLER = ['hope this finds you well', 'hope this email finds you well', 'circle back',
  'touch base', 'going forward', 'synergy', 'best practices', 'value-add',
  'do not hesitate', "don't hesitate", 'as per our conversation', "in today's fast-paced"];
const PREAMBLE = /^(sure|certainly|here('s| is| are)|of course|absolutely|i'd be happy|great question|below is)/i;

function words(t) { return t.trim().split(/\s+/).filter(Boolean).length; }
function lines(t) { return t.trim().split('\n').filter((l) => l.trim()).length; }

function checks(task, out, input) {
  const c = [];
  const push = (label, pass, detail) => c.push({ label, pass, detail: detail || '' });

  // Universal
  const md = out.match(/(\*\*|^\s*[-*+]\s|^#{1,6}\s|`|^\s*\d+\.\s)/m);
  push('no markdown', !md, md ? `found ${JSON.stringify(md[0].trim())}` : '');
  push('no preamble', !PREAMBLE.test(out.trim()));
  const dashes = (out.match(/[—–‑​‌‍﻿]/g) || []);
  push('no em/odd dashes', dashes.length === 0, dashes.length ? `${dashes.length} found` : '');

  // Task-specific
  if (task === 'summarize') {
    push('under 180 words', words(out) <= 180, `${words(out)}w`);
    push('has "So what:" line', /so what:/i.test(out));
    push('5-7 lines', lines(out) >= 4 && lines(out) <= 7, `${lines(out)} lines`);
  }
  if (task === 'humanize') {
    const hitsV = BANNED_VOCAB.filter((w) => new RegExp(`\\b${w}`, 'i').test(out));
    push('no banned vocab', hitsV.length === 0, hitsV.join(', '));
    const hitsF = FILLER.filter((w) => out.toLowerCase().includes(w));
    push('no corporate filler', hitsF.length === 0, hitsF.join(', '));
    const sl = out.split(/[.!?]+/).map(words).filter((n) => n > 0);
    const avg = sl.reduce((a, b) => a + b, 0) / (sl.length || 1);
    const variance = Math.sqrt(sl.reduce((a, b) => a + (b - avg) ** 2, 0) / (sl.length || 1));
    push('varied rhythm (sd>5)', variance > 5, `sd=${variance.toFixed(1)}`);
    push('has a short sentence (<6w)', sl.some((n) => n < 6), `min=${Math.min(...sl)}w`);
    // Humanizing bloated corporate text SHOULD shorten it — the old +/-15% band
    // penalised correct filler removal. Floor only, to catch fact-dropping.
    const ratio = words(out) / words(input);
    push('no over-compression (>45%)', ratio >= 0.45, `${(ratio * 100).toFixed(0)}% of original`);
  }
  if (task === 'simplify') {
    const sl = out.split(/[.!?]+/).map(words).filter((n) => n > 0);
    const longest = Math.max(...sl, 0);
    push('no sentence > 25w', longest <= 25, `longest ${longest}w`);
  }
  if (task === 'draft_email') {
    push('starts "Subject:"', /^subject:/i.test(out.trim()));
    push('under 200 words', words(out) <= 200, `${words(out)}w`);
    push('has sign-off placeholder', /\[your name\]/i.test(out));
  }
  if (task === 'fix_grammar') {
    const ratio = words(out) / words(input);
    push('length preserved ±25%', ratio >= 0.75 && ratio <= 1.25, `${(ratio * 100).toFixed(0)}%`);
  }
  if (task === 'ask_ai') {
    push('under 250 words', words(out) <= 250, `${words(out)}w`);
    push('no hedge opener', !/^(it depends|that depends|great question)/i.test(out.trim()));
  }
  return c;
}

// ════════════════════════════════════════════════════════════════════════════
async function run(task, input, variant) {
  const isNew = variant === 'new';
  const sys = isNew ? SYSTEM_NEW : SYSTEM_OLD;
  const instr = isNew ? NEW[task] : OLD[task];
  const cfg = isNew ? NEW_CFG[task] : OLD_CFG[task];

  const userMsg = (task === 'ask_ai' && !instr)
    ? input                                        // old ask_ai = raw passthrough
    : `${instr}\n\n---\nINPUT TEXT:\n${input}\n---`;

  const body = {
    model: MODEL,
    messages: [{ role: 'system', content: sys }, { role: 'user', content: userMsg }],
    // Groq counts reasoning + visible output against max_tokens. At medium
    // effort reasoning alone can exceed 1200, returning finish=length with
    // EMPTY content. Give generous headroom; unused budget costs nothing.
    max_tokens: 3000,
    reasoning_format: 'hidden',
    ...cfg
  };

  // Free tier is 8,000 tokens/min — honour the retry hint Groq sends back
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let attempt = 0; attempt < 8; attempt++) {
    const t0 = Date.now();
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}` },
      body: JSON.stringify(body)
    });
    const j = await res.json().catch(() => ({}));

    if (res.ok) return { text: (j.choices?.[0]?.message?.content || '').trim(), ms: Date.now() - t0 };

    const msg = j.error?.message || `HTTP ${res.status}`;
    if (res.status === 429) {
      const m = /try again in ([\d.]+)(ms|s)/i.exec(msg);
      const waitMs = m ? (m[2].toLowerCase() === 's' ? parseFloat(m[1]) * 1000 : parseFloat(m[1])) : 15000;
      process.stdout.write(`[429 wait ${(waitMs / 1000).toFixed(1)}s] `);
      await sleep(waitMs + 750);
      continue;
    }
    return { error: msg, ms: Date.now() - t0 };
  }
  return { error: 'rate limited after 8 attempts' };
}

(async () => {
  const only = process.argv[2];
  const tasks = only ? [only] : Object.keys(NEW);
  const report = [];
  const score = { old: { pass: 0, total: 0 }, new: { pass: 0, total: 0 } };

  report.push('# BEBO prompt A/B — current (v2.0.1) vs Contract-First\n');
  report.push(`Model: \`${MODEL}\` · ${new Date().toISOString().slice(0, 16).replace('T', ' ')}\n`);

  for (const task of tasks) {
    report.push(`\n---\n\n## ${task}\n`);
    for (let i = 0; i < INPUTS[task].length; i++) {
      const input = INPUTS[task][i];
      process.stdout.write(`${task} #${i + 1} ... `);
      const [o, n] = [await run(task, input, 'old'), await run(task, input, 'new')];
      process.stdout.write(`old ${o.ms}ms / new ${n.ms}ms\n`);

      const oc = o.text ? checks(task, o.text, input) : [];
      const nc = n.text ? checks(task, n.text, input) : [];
      oc.forEach((c) => { score.old.total++; if (c.pass) score.old.pass++; });
      nc.forEach((c) => { score.new.total++; if (c.pass) score.new.pass++; });

      const fmt = (cs) => cs.map((c) => `${c.pass ? '✅' : '❌'} ${c.label}${c.detail ? ` _(${c.detail})_` : ''}`).join('<br>');

      report.push(`### Input ${i + 1}\n`);
      report.push('```\n' + input.slice(0, 300) + (input.length > 300 ? '…' : '') + '\n```\n');
      report.push(`| | OLD (${o.ms}ms) | NEW (${n.ms}ms) |`);
      report.push('|---|---|---|');
      report.push(`| **Output** | ${(o.text || o.error || '').replace(/\n/g, '<br>').replace(/\|/g, '\\|')} | ${(n.text || n.error || '').replace(/\n/g, '<br>').replace(/\|/g, '\\|')} |`);
      report.push(`| **Checks** | ${fmt(oc)} | ${fmt(nc)} |`);
      report.push(`| **Score** | ${oc.filter((c) => c.pass).length}/${oc.length} | ${nc.filter((c) => c.pass).length}/${nc.length} |\n`);
    }
  }

  const pct = (s) => s.total ? ((s.pass / s.total) * 100).toFixed(0) : '0';
  report.splice(2, 0, `\n## Contract compliance\n\n| | Passed | Rate |\n|---|---|---|\n| OLD | ${score.old.pass}/${score.old.total} | **${pct(score.old)}%** |\n| NEW | ${score.new.pass}/${score.new.total} | **${pct(score.new)}%** |\n`);

  const out = path.join(__dirname, 'prompt-eval-report.md');
  fs.writeFileSync(out, report.join('\n'), 'utf8');
  console.log(`\nOLD ${score.old.pass}/${score.old.total} (${pct(score.old)}%)  |  NEW ${score.new.pass}/${score.new.total} (${pct(score.new)}%)`);
  console.log(`Report: ${out}`);
})();
