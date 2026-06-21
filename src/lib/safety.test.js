// ─── Safety Filter Unit Tests ─────────────────────────────────────
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runSafetyCheck } from './safety.js';

// Helper: create a unit object
const unit = (text) => ({ id: `test-${Math.random().toString(36).slice(2, 8)}`, text });

describe('runSafetyCheck', () => {
  // ── Should flag ──

  it('flags self-harm language', () => {
    const result = runSafetyCheck([unit('I want to kill myself')]);
    assert.equal(result.flagged.length, 1);
    assert.equal(result.safe.length, 0);
    assert.equal(result.flagged[0].reason, 'distress_language_detected');
  });

  it('flags suicidal ideation', () => {
    const result = runSafetyCheck([unit("I don't want to live anymore")]);
    assert.equal(result.flagged.length, 1);
  });

  it('flags "better off dead"', () => {
    const result = runSafetyCheck([unit('everyone would be better off dead')]);
    assert.equal(result.flagged.length, 1);
  });

  it('flags severe distress — "can\'t take it anymore"', () => {
    const result = runSafetyCheck([unit("I can't take it anymore")]);
    assert.equal(result.flagged.length, 1);
  });

  it('flags crisis language — "in danger"', () => {
    const result = runSafetyCheck([unit('I feel like I am in danger')]);
    assert.equal(result.flagged.length, 1);
  });

  it('flags abuse indicators', () => {
    const result = runSafetyCheck([unit('I am being abused at home')]);
    assert.equal(result.flagged.length, 1);
  });

  it('is case-insensitive', () => {
    const result = runSafetyCheck([unit('I WANT TO DIE')]);
    assert.equal(result.flagged.length, 1);
  });

  it('includes the support message on flagged items', () => {
    const result = runSafetyCheck([unit('I want to die')]);
    assert.ok(result.flagged[0].message.includes('crisis helpline'));
  });

  // ── Should NOT flag ──

  it('passes through normal decision text', () => {
    const result = runSafetyCheck([unit('should I drop the DL elective')]);
    assert.equal(result.safe.length, 1);
    assert.equal(result.flagged.length, 0);
  });

  it('passes through task text', () => {
    const result = runSafetyCheck([unit('forgot to email professor about extension')]);
    assert.equal(result.safe.length, 1);
    assert.equal(result.flagged.length, 0);
  });

  it('passes through mild worry text', () => {
    const result = runSafetyCheck([unit('worried about the bajaj interview')]);
    assert.equal(result.safe.length, 1);
    assert.equal(result.flagged.length, 0);
  });

  it('passes through vague aspiration text', () => {
    const result = runSafetyCheck([unit('should I learn rust')]);
    assert.equal(result.safe.length, 1);
    assert.equal(result.flagged.length, 0);
  });

  // ── Mixed input ──

  it('correctly splits a mix of safe and flagged units', () => {
    const result = runSafetyCheck([
      unit('should I drop the DL elective'),
      unit('I want to kill myself'),
      unit('forgot to email professor'),
      unit("can't take this anymore"),
      unit('mom wants me to visit this weekend'),
    ]);

    assert.equal(result.safe.length, 3);
    assert.equal(result.flagged.length, 2);
  });

  // ── Edge cases ──

  it('handles empty array', () => {
    const result = runSafetyCheck([]);
    assert.equal(result.safe.length, 0);
    assert.equal(result.flagged.length, 0);
  });

  it('preserves the original unit id', () => {
    const original = { id: 'my-custom-id', text: 'worried about interview' };
    const result = runSafetyCheck([original]);
    assert.equal(result.safe[0].id, 'my-custom-id');
  });
});
