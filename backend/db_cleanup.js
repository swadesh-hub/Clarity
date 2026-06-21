// Database cleanup and fix script
// Removes duplicate brain dumps (keeps only the latest), 
// fixes settings table, and removes overly broad safety keywords

import Database from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import { dbQuery } from './db.js';

async function cleanup() {
  console.log('=== Starting Database Cleanup ===\n');

  // 1. Show current state
  const dumps = await dbQuery.all('SELECT dump_id, created_at FROM brain_dumps ORDER BY created_at DESC');
  const thoughts = await dbQuery.all('SELECT COUNT(*) as count FROM thoughts');
  const settings = await dbQuery.all('SELECT * FROM app_settings');
  const keywords = await dbQuery.all('SELECT * FROM safety_intercepts ORDER BY keyword');

  console.log(`Found ${dumps.length} brain dumps and ${thoughts[0].count} thoughts`);
  console.log('Settings rows:', settings);

  // 2. Remove duplicate brain dumps — keep only the latest dump_id (highest id)
  if (dumps.length > 1) {
    const latestDumpId = dumps[0].dump_id; // already sorted DESC
    const idsToDelete = dumps.slice(1).map(d => d.dump_id);
    console.log(`\nKeeping dump #${latestDumpId}, deleting duplicates: ${idsToDelete.join(', ')}`);
    for (const id of idsToDelete) {
      await dbQuery.run('DELETE FROM brain_dumps WHERE dump_id = ?', [id]);
    }
    const remaining = await dbQuery.all('SELECT COUNT(*) as count FROM thoughts');
    console.log(`✓ Thoughts after cleanup: ${remaining[0].count}`);
  } else {
    console.log('No duplicate dumps found.');
  }

  // 3. Fix settings — delete any malformed/JSON-blob rows and re-insert cleanly
  console.log('\nFixing settings table...');
  await dbQuery.run('DELETE FROM app_settings WHERE key NOT IN (?, ?, ?)', [
    'GEMINI_API_KEY', 'theme', 'user_name'
  ]);
  // Make sure we have a clean GEMINI_API_KEY entry
  const existingKey = await dbQuery.get('SELECT value FROM app_settings WHERE key = ?', ['GEMINI_API_KEY']);
  if (!existingKey) {
    await dbQuery.run('INSERT INTO app_settings (key, value) VALUES (?, ?)', ['GEMINI_API_KEY', '']);
    console.log('✓ Inserted empty GEMINI_API_KEY placeholder');
  } else {
    console.log(`✓ GEMINI_API_KEY already present`);
  }

  // 4. Remove overly broad safety keywords that cause false positives
  const badKeywords = ['low', 'weak'];
  for (const kw of badKeywords) {
    const result = await dbQuery.run('DELETE FROM safety_intercepts WHERE keyword = ?', [kw]);
    if (result.changes > 0) {
      console.log(`\n✓ Removed overly broad keyword: "${kw}"`);
    }
  }

  // Final state
  const finalDumps = await dbQuery.all('SELECT COUNT(*) as count FROM brain_dumps');
  const finalThoughts = await dbQuery.all('SELECT COUNT(*) as count FROM thoughts');
  const finalKeywords = await dbQuery.all('SELECT keyword FROM safety_intercepts ORDER BY keyword');
  const finalSettings = await dbQuery.all('SELECT key FROM app_settings');

  console.log('\n=== Cleanup Complete ===');
  console.log(`Brain dumps: ${finalDumps[0].count}`);
  console.log(`Thoughts: ${finalThoughts[0].count}`);
  console.log(`Settings keys: ${finalSettings.map(s => s.key).join(', ')}`);
  console.log(`Safety keywords (${finalKeywords.length}): ${finalKeywords.map(k => k.keyword).join(', ')}`);

  process.exit(0);
}

cleanup().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
