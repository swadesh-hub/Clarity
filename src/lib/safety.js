// ─── Safety Pre-filter ────────────────────────────────────────────
// Deterministic, regex-based distress-language scan.
// Runs BEFORE any LLM call.  Flagged units are never auto-sorted
// into any bucket — they are returned to the user with a gentle
// support message and zero AI judgement applied.
// ──────────────────────────────────────────────────────────────────

/**
 * Curated pattern groups.  Each regex is case-insensitive and
 * word-boundary-anchored to reduce false positives.
 *
 * Categories:
 *   1. Self-harm / suicidal ideation
 *   2. Severe emotional distress
 *   3. Crisis / abuse indicators
 *
 * NOTE: The list intentionally over-flags.  Manual recategorization
 * (FR9) is the explicit safety valve for false positives.
 */
const DISTRESS_PATTERNS = [
  // ── Self-harm / suicidal ideation ──
  /\b(want(ing)?\s+to\s+die|wanna\s+die|don'?t\s+want\s+to\s+live)\b/i,
  /\b(kill\s+(my|him|her|them)?self|sui?cid(e|al)|end\s+(it|my\s+life|everything))\b/i,
  /\b(self[- ]?harm|cut(ting)?\s+myself|hurt(ing)?\s+myself)\b/i,
  /\b(no\s+(reason|point)\s+to\s+(live|go\s+on|continue))\b/i,
  /\b(better\s+off\s+(dead|without\s+me))\b/i,
  /\b(overdose|od'?d)\b/i,

  // ── Severe emotional distress ──
  /\b(can'?t\s+take\s+(it|this)\s+(anymore|any\s+more))\b/i,
  /\b(completely\s+hopeless|no\s+hope\s+left|lost\s+all\s+hope)\b/i,
  /\b(feel(ing)?\s+(worthless|empty\s+inside|nothing))\b/i,
  /\b(everything\s+is\s+(pointless|meaningless))\b/i,
  /\b(nobody\s+(cares|would\s+(miss|notice)))\b/i,
  /\b(trapped|no\s+way\s+out)\b/i,

  // ── Crisis / abuse indicators ──
  /\b(being\s+(abused|hurt|beaten|assaulted))\b/i,
  /\b(domestic\s+violence|sexual\s+assault)\b/i,
  /\b(in\s+(danger|crisis))\b/i,
  /\b(please\s+help\s+me)\b/i,
];

/**
 * The support message attached to every flagged unit.
 * Deliberately warm, non-clinical, and non-judgmental.
 */
const FLAGGED_MESSAGE =
  'This thought was flagged because it may relate to emotional distress. ' +
  'It has not been auto-sorted — please review it yourself. ' +
  'If you need support, consider reaching out to a counsellor, a trusted person, ' +
  'or a crisis helpline (e.g. 988 Suicide & Crisis Lifeline in the US).';

/**
 * Run the safety scan on an array of thought units.
 *
 * @param {Array<{id: string, text: string}>} units
 * @returns {{ safe: Array<{id: string, text: string}>, flagged: Array<{id: string, text: string, reason: string, message: string}> }}
 */
export function runSafetyCheck(units) {
  const safe = [];
  const flagged = [];

  for (const unit of units) {
    const isDistress = DISTRESS_PATTERNS.some((pattern) => pattern.test(unit.text));

    if (isDistress) {
      flagged.push({
        ...unit,
        reason: 'distress_language_detected',
        message: FLAGGED_MESSAGE,
      });
    } else {
      safe.push(unit);
    }
  }

  return { safe, flagged };
}
