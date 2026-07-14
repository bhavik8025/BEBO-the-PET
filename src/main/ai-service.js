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

// Global system prompt — enforces plain text and clean output for every task
const SYSTEM_PROMPT = `You are a precise, expert-level desktop productivity assistant running inside a lightweight desktop app.

CRITICAL RULES — follow these without exception:
1. Return ONLY the final result. No greetings, no preamble, no "Here is your...", no "Sure!", no closing remarks, no explanations.
2. Never use markdown. No asterisks, no hashes, no backticks, no dashes as bullet points, no bold, no italics, no numbered lists with dots.
3. Write in clean plain text only. Use line breaks to separate ideas where needed.
4. Be precise, specific, and high quality. Every word must earn its place.
5. Match the task exactly — do not go beyond what is asked.`;

const TASK_PROMPTS = {

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

  ask_ai: null // free-form — user input goes directly as the prompt
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

// Per-task temperature — tuned for GPT-OSS on Groq (validated on 120B)
function getTemperature(type) {
  const temperatures = {
    summarize:   0.2, // needs accuracy and faithfulness to source
    humanize:    0.65, // needs creative, natural, varied human voice
    simplify:    0.3, // needs clarity — some creativity for natural flow
    draft_email: 0.25, // structured and professional — low variance
    fix_grammar: 0.05, // purely mechanical — as deterministic as possible
    ask_ai:      0.5   // flexible — balanced for general queries
  };
  return temperatures[type] ?? 0.3;
}

// Max tokens per task
function getMaxTokens(type) {
  const tokens = {
    summarize:   800,
    humanize:    1200,
    simplify:    1200,
    draft_email: 900,
    fix_grammar: 1200,
    ask_ai:      1500
  };
  return tokens[type] ?? 1024;
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

  // Ask AI — user input is the full prompt, no wrapping
  const userMessage = type === 'ask_ai'
    ? cleanInput
    : `${getTaskInstruction(type)}\n\n---\nINPUT TEXT:\n${cleanInput}\n---`;

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
        top_p: 0.9,
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
      return {
        ok: true,
        output: raw ? stripMarkdown(raw) : 'The AI response was empty.'
      };
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
