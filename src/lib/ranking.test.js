// ─── Ranking Module Unit Tests ────────────────────────────────────
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computePriorityScores, rankAndBucket } from './ranking.js';

describe('computePriorityScores', () => {
  it('computes score = urgency × impact / reversibility', () => {
    const items = [{ urgency: 8, impact: 7, reversibility: 3 }];
    const result = computePriorityScores(items);
    // 8 * 7 / 3 = 18.67
    assert.equal(result[0].priority_score, 18.67);
  });

  it('sorts by priority_score descending', () => {
    const items = [
      { urgency: 2, impact: 2, reversibility: 2 }, // 2
      { urgency: 9, impact: 9, reversibility: 1 }, // 81
      { urgency: 5, impact: 5, reversibility: 5 }, // 5
    ];
    const result = computePriorityScores(items);
    assert.equal(result[0].priority_score, 81);
    assert.equal(result[1].priority_score, 5);
    assert.equal(result[2].priority_score, 2);
  });

  it('clamps reversibility to min 1 to avoid division by zero', () => {
    const items = [{ urgency: 5, impact: 5, reversibility: 0 }];
    const result = computePriorityScores(items);
    // 5 * 5 / 1 = 25
    assert.equal(result[0].priority_score, 25);
  });

  it('handles empty array', () => {
    const result = computePriorityScores([]);
    assert.equal(result.length, 0);
  });
});

describe('rankAndBucket', () => {
  const makeItem = (text, bucket, urgency, impact, reversibility) => ({
    id: text,
    text,
    bucket,
    urgency,
    impact,
    reversibility,
    reasoning: 'test',
  });

  it('sorts items into the correct buckets', () => {
    const items = [
      makeItem('a', 'decide_now', 8, 7, 3),
      makeItem('b', 'needs_more_info', 5, 5, 5),
      makeItem('c', 'task_not_decision', 3, 2, 9),
      makeItem('d', 'let_go', 1, 1, 10),
    ];

    const result = rankAndBucket(items);
    assert.equal(result.buckets.decide_now.length, 1);
    assert.equal(result.buckets.needs_more_info.length, 1);
    assert.equal(result.buckets.task_not_decision.length, 1);
    assert.equal(result.buckets.let_go.length, 1);
  });

  it('marks the top "decide_now" item with is_top = true', () => {
    const items = [
      makeItem('low', 'decide_now', 2, 2, 8),   // score: 0.5
      makeItem('high', 'decide_now', 9, 9, 1),   // score: 81
    ];

    const result = rankAndBucket(items);
    assert.equal(result.topDecision.text, 'high');
    assert.equal(result.topDecision.is_top, true);
  });

  it('returns topDecision = null when no "decide_now" items exist', () => {
    const items = [
      makeItem('a', 'task_not_decision', 5, 5, 5),
      makeItem('b', 'let_go', 1, 1, 10),
    ];

    const result = rankAndBucket(items);
    assert.equal(result.topDecision, null);
  });

  it('defaults unknown buckets to "needs_more_info"', () => {
    const items = [makeItem('x', 'unknown_bucket', 5, 5, 5)];
    const result = rankAndBucket(items);
    assert.equal(result.buckets.needs_more_info.length, 1);
    assert.equal(result.buckets.needs_more_info[0].bucket, 'needs_more_info');
  });

  it('handles empty input', () => {
    const result = rankAndBucket([]);
    assert.equal(result.topDecision, null);
    assert.equal(result.buckets.decide_now.length, 0);
  });
});
