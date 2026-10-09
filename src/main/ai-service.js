const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

// ── Model chain ─────────────────────────────────────────────────────────────
// Groq retires all Llama models on 2026-08-16 (llama-3.3-70b-versatile was
// BEBO's original brain). Primary is now OpenAI's open-weight GPT-OSS 120B —
// Groq's officially recommended replacement (measured ~480 tok/s).
// If the primary model is rate-limited or ever decommissioned, BEBO
// automatically falls back to the next model instead of failing the task.
const GROQ_MODELS = [
  'openai/gpt-oss-120b', // primary  — best quality, ~500 tok/s on Groq
  'openai/gpt-oss-20b'   // fallback — lighter, ~970 tok/s, separate quota
];
const { getGroqKey } = require('./config');

// Global system prompt — the output contract in each task overrides nothing here
const SYSTEM_PROMPT = `You are BEBO, a desktop productivity assistant. You transform text.

ABSOLUTE RULES
Return only the finished result. No preamble, no commentary, no sign-off.
Plain text only. Never use markdown: no *, #, \`, bullet characters, or numbered lists.
Never use em dashes. Use commas, full stops or colons instead.
Follow the OUTPUT CONTRACT exactly. The contract overrides everything else.`;

const TASK_PROMPTS = {

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

function getTaskInstruction(type) {
  return TASK_PROMPTS[type] || `ROLE: You are a highly capable desktop productivity assistant.
OBJECTIVE: Help the user with their input in the most practical, accurate, and useful way possible.
CONTEXT: The user is working at their desktop and needs quick, expert assistance.
INSTRUCTIONS:
- Output plain text only. No markdown whatsoever.
- Be direct, accurate, and concise.
- Return only the result — no preamble, no meta-commentary.`;
}

function stripMarkdown(text) {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, '').trim())
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*>{1,}\s*/gm, '')
    .replace(/^-{3,}$/gm, '')
    .replace(/\[(.+?)\]\(.*?\)/g, '$1')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// BUG FIX: the model still emits em dashes and invisible characters despite the
// system prompt forbidding them (observed: U+2011 in "Asia\u2011Pacific").
// Enforce it in code rather than trusting the instruction.
// Skipped for fix_grammar, whose contract is to change nothing but actual errors.
function cleanTypography(text) {
  return text
    .replace(/\s+\u2014\s+/g, ', ')            // spaced em dash  -> comma
    .replace(/\u2014/g, '-')                    // bare em dash    -> hyphen
    .replace(/\s+\u2013\s+/g, ', ')            // spaced en dash  -> comma
    .replace(/\u2013/g, '-')                    // bare en dash    -> hyphen
    .replace(/\u2011/g, '-')                    // non-breaking hyphen
    .replace(/[\u200b\u200c\u200d\ufeff]/g, '') // zero-width characters
    .replace(/[ \t]{2,}/g, ' ');
}

// Per-task temperature — tuned for GPT-OSS on Groq (validated on 120B)
function getTemperature(type) {
  const temperatures = {
    summarize:   0.2,  // faithful to source
    humanize:    0.55, // natural variation without drifting off-facts
    simplify:    0.25, // clear, low variance
    draft_email: 0.3,  // structured but not robotic
    fix_grammar: 0.0,  // purely mechanical
    ask_ai:      0.4   // balanced
  };
  return temperatures[type] ?? 0.3;
}

// Max tokens per task.
// BUG FIX: on Groq, max_tokens caps reasoning tokens AND visible output together.
// GPT-OSS spends ~250 reasoning tokens at 'low' effort (measured, and far more at
// higher effort), so every budget below carries headroom for that. Without it the
// model can exhaust the budget while reasoning and return finish_reason=length
// with completely EMPTY content.
const REASONING_HEADROOM = 500;
function getMaxTokens(type) {
  const tokens = {
    summarize:   800,
    humanize:    1200,
    simplify:    1200,
    draft_email: 900,
    fix_grammar: 1200,
    ask_ai:      1500
  };
  return (tokens[type] ?? 1024) + REASONING_HEADROOM;
}

function requireInput(type, input) {
  if (!input.trim()) {
    return 'Paste some text in the Input box first, then choose an action.';
  }
  return null;
}

async function runAITask({ type, input, screenshotBase64 }) {
  const cleanInput = input || '';

  const missingInput = requireInput(type, cleanInput);
  if (missingInput) {
    return { ok: false, output: missingInput };
  }

  const apiKey = getGroqKey();
  if (!apiKey) {
    return {
      ok: false,
      output: [
        'Groq API key is not configured.',
        '',
        'Add this to your .env file:',
        'GROQ_API_KEY=your_key_here',
        '',
        'Get a free key at groq.com — no credit card needed.',
        'Then restart the app.'
      ].join('\n')
    };
  }

  // Every task now carries its own contract, ask_ai included
  const userMessage = `${getTaskInstruction(type)}\n\n---\nINPUT TEXT:\n${cleanInput}\n---`;

  let lastError = 'The AI service is unavailable right now. Please try again in a moment.';

  for (const model of GROQ_MODELS) {
    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: getTemperature(type),
        max_tokens: getMaxTokens(type),
        stream: false,
        // GPT-OSS models are reasoning models — keep the thinking minimal
        // and hidden so responses stay instant and contain only the answer.
        reasoning_effort: 'low',
        reasoning_format: 'hidden',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: userMessage }
        ]
      })
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      const raw = data.choices?.[0]?.message?.content?.trim();
      if (!raw) {
        // finish_reason 'length' with empty content means the token budget was
        // consumed by reasoning. Fall through to the next model rather than
        // handing the user a blank box.
        lastError = 'The AI returned an empty response. Trying a lighter model.';
        continue;
      }
      const cleaned = type === 'fix_grammar'
        ? stripMarkdown(raw)
        : cleanTypography(stripMarkdown(raw));
      return { ok: true, output: cleaned };
    }

    lastError = data.error?.message || `Groq request failed with status ${response.status}.`;

    // Rate-limited or model retired — automatically try the next model
    const tryNext = response.status === 429 || response.status === 404 ||
      /decommission|deprecat|not found|does not exist/i.test(lastError);
    if (!tryNext) break;
  }

  return { ok: false, output: lastError };
}

module.exports = { runAITask, GROQ_MODELS };
