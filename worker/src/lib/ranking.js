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
        buckets.needsMoreInfo.push({ ...item, bucket: 'needs_more_info' });
    }
  }

  buckets.decideNow = computePriorityScores(buckets.decideNow);

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
