// ─── Deterministic Priority Ranking ───────────────────────────────
// Pure code — no LLM.  The formula is auditable, reproducible, and
// explainable, which is itself part of the architectural argument.
// ──────────────────────────────────────────────────────────────────

/**
 * Priority score formula:
 *
 *   score = urgency × impact × (1 / reversibility)
 *
 * Intuition:
 *   - High urgency  → needs attention soon
 *   - High impact   → affects a lot
 *   - Low reversibility → hard to undo, so get it right the first time
 *
 * All three factors (1–10 scale) come from the LLM classifier.
 * The formula deliberately keeps ranking OUTSIDE the LLM so it can
 * be inspected and tested deterministically.
 *
 * @param {Array<{urgency: number, impact: number, reversibility: number}>} items
 * @returns {Array<{...item, priority_score: number}>}  Sorted descending.
 */
export function computePriorityScores(items) {
  return items
    .map((item) => ({
      ...item,
      priority_score: parseFloat(
        ((item.urgency * item.impact) / Math.max(item.reversibility, 1)).toFixed(2)
      ),
    }))
    .sort((a, b) => b.priority_score - a.priority_score);
}

/**
 * From all classified items, extract the "decide_now" bucket,
 * rank them, and return the single top-priority item (or null).
 *
 * @param {Array<{bucket: string, urgency: number, impact: number, reversibility: number}>} classifiedItems
 * @returns {{ decideNow: Array, needsMoreInfo: Array, taskNotDecision: Array, letGo: Array, topDecision: object|null }}
 */
export function rankAndBucket(classifiedItems) {
  const buckets = {
    decideNow: [],
    needsMoreInfo: [],
    taskNotDecision: [],
    letGo: [],
  };

  for (const item of classifiedItems) {
    switch (item.bucket) {
      case 'decide_now':
        buckets.decideNow.push(item);
        break;
      case 'needs_more_info':
        buckets.needsMoreInfo.push(item);
        break;
      case 'task_not_decision':
        buckets.taskNotDecision.push(item);
        break;
      case 'let_go':
        buckets.letGo.push(item);
        break;
      default:
        // Unknown bucket — default to "needs_more_info" as safest fallback
        buckets.needsMoreInfo.push({ ...item, bucket: 'needs_more_info' });
    }
  }

  // Rank decide_now items
  buckets.decideNow = computePriorityScores(buckets.decideNow);

  // Mark the top decision
  let topDecision = null;
  if (buckets.decideNow.length > 0) {
    buckets.decideNow[0].is_top = true;
    topDecision = buckets.decideNow[0];
  }

  return {
    buckets: {
      decide_now: buckets.decideNow,
      needs_more_info: buckets.needsMoreInfo,
      task_not_decision: buckets.taskNotDecision,
      let_go: buckets.letGo,
    },
    topDecision,
  };
}
