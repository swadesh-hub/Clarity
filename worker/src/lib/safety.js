// ─── Safety Pre-filter ────────────────────────────────────────────
const DISTRESS_PATTERNS = [
  /\b(want(ing)?\s+to\s+die|wanna\s+die|don'?t\s+want\s+to\s+live)\b/i,
  /\b(kill\s+(my|him|her|them)?self|sui?cid(e|al)|end\s+(it|my\s+life|everything))\b/i,
  /\b(self[- ]?harm|cut(ting)?\s+myself|hurt(ing)?\s+myself)\b/i,
  /\b(no\s+(reason|point)\s+to\s+(live|go\s+on|continue))\b/i,
  /\b(better\s+off\s+(dead|without\s+me))\b/i,
  /\b(overdose|od'?d)\b/i,
  /\b(can'?t\s+take\s+(it|this)\s+(anymore|any\s+more))\b/i,
  /\b(completely\s+hopeless|no\s+hope\s+left|lost\s+all\s+hope)\b/i,
  /\b(feel(ing)?\s+(worthless|empty\s+inside|nothing))\b/i,
  /\b(everything\s+is\s+(pointless|meaningless))\b/i,
  /\b(nobody\s+(cares|would\s+(miss|notice)))\b/i,
  /\b(trapped|no\s+way\s+out)\b/i,
  /\b(being\s+(abused|hurt|beaten|assaulted))\b/i,
  /\b(domestic\s+violence|sexual\s+assault)\b/i,
  /\b(in\s+(danger|crisis))\b/i,
  /\b(please\s+help\s+me)\b/i,
];

const FLAGGED_MESSAGE =
  'This thought was flagged because it may relate to emotional distress. ' +
  'It has not been auto-sorted — please review it yourself. ' +
  'If you need support, consider reaching out to a counsellor, a trusted person, ' +
  'or a crisis helpline (e.g. 988 Suicide & Crisis Lifeline in the US).';

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
