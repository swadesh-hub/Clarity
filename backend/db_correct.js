// One-time database correction script
// Run with: node db_correct.js

import { dbQuery } from './db.js';

async function correct() {
  console.log('=== DB Correction Start ===\n');

  // 1. Recalculate all priority scores using the correct formula:
  //    priority_score = ROUND((urgency * impact) / reversibility, 2)
  const thoughts = await dbQuery.all(
    'SELECT thought_id, thought_text, urgency, impact, reversibility, priority_score FROM thoughts'
  );

  console.log('Recalculating priority_score for all thoughts...');
  for (const t of thoughts) {
    const corrected = Math.round((t.urgency * t.impact) / t.reversibility * 100) / 100;
    await dbQuery.run(
      'UPDATE thoughts SET priority_score = ? WHERE thought_id = ?',
      [corrected, t.thought_id]
    );
    console.log(`  #${t.thought_id} "${t.thought_text.substring(0, 35)}..."`);
    console.log(`     urgency=${t.urgency} impact=${t.impact} reversibility=${t.reversibility}`);
    console.log(`     OLD score=${t.priority_score}  →  NEW score=${corrected}\n`);
  }

  // 2. Remove overly generic safety keywords
  const badKeywords = ['weak', 'low'];
  for (const kw of badKeywords) {
    const result = await dbQuery.run('DELETE FROM safety_intercepts WHERE keyword = ?', [kw]);
    if (result.changes > 0) {
      console.log(`Removed broad safety keyword: "${kw}"`);
    }
  }

  // 3. Show final corrected thoughts sorted by priority
  const final = await dbQuery.all(
    'SELECT thought_id, thought_text, urgency, impact, reversibility, priority_score, category FROM thoughts ORDER BY priority_score DESC'
  );

  console.log('\n=== CORRECTED Priority Rankings ===');
  console.table(final.map(t => ({
    id: t.thought_id,
    category: t.category,
    score: t.priority_score,
    text: t.thought_text.substring(0, 40)
  })));

  // 4. Show final safety keywords
  const keywords = await dbQuery.all('SELECT keyword FROM safety_intercepts ORDER BY keyword');
  console.log('\nSafety keywords:', keywords.map(k => k.keyword).join(', '));

  console.log('\n=== DB Correction Complete ===');
  process.exit(0);
}

correct().catch(err => {
  console.error('Correction failed:', err);
  process.exit(1);
});
