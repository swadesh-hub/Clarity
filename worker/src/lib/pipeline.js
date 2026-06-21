import { callLLM, parseLLMResponse, resetFallbackState, activeProvider } from './llm.js';
import { runSafetyCheck } from './safety.js';
import { rankAndBucket } from './ranking.js';

const SEGMENTATION_SYSTEM_PROMPT = `You are a text segmentation engine for a cognitive load triage tool.

Your job: split the user's raw brain dump into discrete, atomic thought units. Each unit should represent ONE distinct thought, worry, task, or decision.

Rules:
- Preserve the user's original phrasing as closely as possible.
- Split compound sentences that contain multiple unrelated thoughts.
- Do NOT add commentary, analysis, or classification — just split.
- Return valid JSON only.

Output format:
{
  "units": [
    "thought one in the user's words",
    "thought two in the user's words"
  ]
}`;

const CLASSIFICATION_SYSTEM_PROMPT = `You are a cognitive load classifier. For each thought unit provided, classify it into exactly ONE of four buckets and assign numeric scores.

Buckets:
- "decide_now": A real decision with enough information to act on TODAY. The user can actually make this choice right now.
- "needs_more_info": A decision that exists, but is blocked on a specific, nameable missing piece. You MUST name what's missing in the "reasoning" field.
- "task_not_decision": Something that needs doing but requires no reasoning or deliberation — just execution.
- "let_go": Background anxiety, vague aspiration, or something with no actionable next step at this moment. NOT harmful, just not actionable right now.

Scores (each 1–10):
- urgency: How time-sensitive is this? 10 = must act today, 1 = no deadline.
- impact: How much does this affect the user's life? 10 = major life impact, 1 = trivial.
- reversibility: How easy is it to undo? 10 = trivially reversible, 1 = permanent.

Rules:
- Be precise about bucket assignment. "I should learn Rust" is "let_go" (vague aspiration), not "decide_now".
- "Forgot to email professor" is "task_not_decision" (no reasoning needed, just do it).
- Include a one-sentence "reasoning" explaining your classification.
- Return valid JSON only.

Output format:
{
  "classified": [
    {
      "text": "original thought text",
      "bucket": "decide_now",
      "urgency": 8,
      "impact": 7,
      "reversibility": 3,
      "reasoning": "This is a real decision the user can act on today because..."
    }
  ]
}`;

const FOLLOWUP_SYSTEM_PROMPT = `You are a decision coach helping someone cut through mental overload.

You will receive ONE specific decision the user is facing. Your job: generate exactly ONE sharpened follow-up question that would help them make progress on this decision TODAY.

Rules:
- Be concrete and specific to THIS decision — no generic advice.
- Frame it as a question, not a statement.
- Keep it under 2 sentences.
- The question should surface the ONE factor the user likely hasn't considered yet, or the ONE piece of clarity that would tip the scales.
- Return valid JSON only.

Output format:
{
  "follow_up_question": "Your question here?"
}`;

function generateId() {
  return crypto.randomUUID();
}

async function segment(env, dump) {
  const raw = await callLLM(env, SEGMENTATION_SYSTEM_PROMPT, dump, {
    maxTokens: 512,
    temperature: 0.2,
  });

  const parsed = parseLLMResponse(raw);

  if (!Array.isArray(parsed.units) || parsed.units.length === 0) {
    throw new Error('Segmentation returned no units');
  }

  return parsed.units.map((text) => ({
    id: generateId(),
    text: typeof text === 'string' ? text.trim() : String(text).trim(),
  }));
}

async function classify(env, safeUnits) {
  if (safeUnits.length === 0) return [];

  const unitTexts = safeUnits.map((u) => u.text);
  const userPrompt = JSON.stringify({ thoughts: unitTexts });

  const raw = await callLLM(env, CLASSIFICATION_SYSTEM_PROMPT, userPrompt, {
    maxTokens: 1024,
    temperature: 0.3,
  });

  const parsed = parseLLMResponse(raw);

  if (!Array.isArray(parsed.classified)) {
    throw new Error('Classification returned invalid structure');
  }

  return parsed.classified.map((item, idx) => ({
    id: safeUnits[idx]?.id || generateId(),
    text: item.text,
    bucket: item.bucket,
    urgency: clampScore(item.urgency),
    impact: clampScore(item.impact),
    reversibility: clampScore(item.reversibility),
    reasoning: item.reasoning || '',
  }));
}

async function generateFollowUp(env, topDecision) {
  if (!topDecision) return null;

  const userPrompt = `The user's top decision: "${topDecision.text}"\nClassification reasoning: ${topDecision.reasoning}`;

  const raw = await callLLM(env, FOLLOWUP_SYSTEM_PROMPT, userPrompt, {
    maxTokens: 256,
    temperature: 0.5,
  });

  const parsed = parseLLMResponse(raw);
  return parsed.follow_up_question || null;
}

function clampScore(value) {
  const n = Number(value);
  if (isNaN(n)) return 5;
  return Math.max(1, Math.min(10, Math.round(n)));
}

async function emitSSE(writer, event, data) {
  const encoder = new TextEncoder();
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  await writer.write(encoder.encode(payload));
}

export function runPipeline(env, dump) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const startTime = Date.now();

  (async () => {
    try {
      resetFallbackState();

      const units = await segment(env, dump);
      await emitSSE(writer, 'segmented', { units });

      const { safe, flagged } = runSafetyCheck(units);

      const classifiedItems = await classify(env, safe);

      const { buckets, topDecision } = rankAndBucket(classifiedItems);
      await emitSSE(writer, 'classified', { buckets, flagged });

      const followUpQuestion = await generateFollowUp(env, topDecision);

      await emitSSE(writer, 'decision', {
        top_decision: topDecision
          ? { ...topDecision, follow_up_question: followUpQuestion }
          : null,
      });

      await emitSSE(writer, 'done', {
        meta: {
          total_units: units.length,
          flagged_count: flagged.length,
          model_used: activeProvider() === 'groq' ? 'llama-3.3-70b-versatile' : 'gemini-2.5-flash',
          provider: activeProvider(),
          processing_time_ms: Date.now() - startTime,
        },
      });
    } catch (err) {
      console.error('[Pipeline Error]', err);
      await emitSSE(writer, 'error', {
        message: err.message || 'An unexpected error occurred in the triage pipeline.',
      });
    } finally {
      await writer.close();
    }
  })();

  return readable;
}
