import { dbQuery } from '../db.js';

/**
 * Fetch and parse triage results from the Cloudflare Worker streaming API.
 * Uses native async iterable body processing.
 */
export async function fetchTriageFromWorker(dumpText) {
  const response = await fetch('https://cognitive-load-triage.cog-triage-mvp.workers.dev/api/triage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ dump: dumpText }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Worker API error (${response.status}): ${errorText}`);
  }

  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  
  let segmented = null;
  let classified = null;
  let decision = null;
  let done = null;

  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    
    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const block = buffer.substring(0, boundary).trim();
      buffer = buffer.substring(boundary + 2);
      boundary = buffer.indexOf('\n\n');

      if (!block) continue;

      let eventType = '';
      let dataText = '';
      const lines = block.split('\n');
      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.substring(6).trim();
        } else if (line.startsWith('data:')) {
          dataText = line.substring(5).trim();
        }
      }

      if (dataText) {
        try {
          const parsedData = JSON.parse(dataText);
          if (eventType === 'segmented') {
            segmented = parsedData;
          } else if (eventType === 'classified') {
            classified = parsedData;
          } else if (eventType === 'decision') {
            decision = parsedData;
          } else if (eventType === 'done') {
            done = parsedData;
          }
        } catch (e) {
          console.error('Error parsing SSE event data:', e, dataText);
        }
      }
    }
  }

  return {
    segmented,
    classified,
    decision,
    done
  };
}

/**
 * Scan for safety/distress keywords locally based on the safety_intercepts table.
 */
export async function performLocalSafetyScan(text) {
  const intercepts = await dbQuery.all('SELECT keyword, category FROM safety_intercepts');
  const lowerText = text.toLowerCase();
  const flagged = [];

  for (const intercept of intercepts) {
    if (lowerText.includes(intercept.keyword.toLowerCase())) {
      flagged.push({
        keyword: intercept.keyword,
        category: intercept.category
      });
    }
  }

  return flagged;
}

/**
 * Process a raw brain dump:
 * 1. Run local safety intercept scanning.
 * 2. Fetch classification, priority scores, and follow-ups from the Cloudflare Worker API.
 * 3. Save the results (user_id=1) in usaii.db (brain_dumps, thoughts, follow_up_questions, safety_flags).
 */
export async function processBrainDump(rawContent, userId = 1) {
  if (!rawContent || rawContent.trim().length === 0) {
    throw new Error('Raw content is empty');
  }

  // 1. Local Safety Scan
  const localSafetyFlags = await performLocalSafetyScan(rawContent);

  // 2. Fetch Triage from Cloudflare Worker
  const triageResult = await fetchTriageFromWorker(rawContent);
  const { classified, decision } = triageResult;

  if (!classified || !classified.buckets) {
    throw new Error('Failed to get classification from Cloudflare Worker');
  }

  // 3. Save to Database (Transaction style or simple sequential operations)
  // Insert Brain Dump
  const dumpInsert = await dbQuery.run(
    'INSERT INTO brain_dumps (user_id, original_text) VALUES (?, ?)',
    [userId, rawContent]
  );
  const dumpId = dumpInsert.id;

  // Insert Local Safety Flags
  for (const flag of localSafetyFlags) {
    await dbQuery.run(
      'INSERT INTO safety_flags (dump_id, flag_type, matched_keyword) VALUES (?, ?, ?)',
      [dumpId, flag.category, flag.keyword]
    );
  }

  // Insert Worker-detected safety flags (if any are present in classified.flagged)
  if (classified.flagged && Array.isArray(classified.flagged)) {
    for (const flag of classified.flagged) {
      // Avoid inserting duplicates of the same keyword
      const exists = localSafetyFlags.some(f => f.keyword.toLowerCase() === flag.text.toLowerCase());
      if (!exists) {
        await dbQuery.run(
          'INSERT INTO safety_flags (dump_id, flag_type, matched_keyword) VALUES (?, ?, ?)',
          [dumpId, 'distress', flag.text]
        );
      }
    }
  }

  // Map buckets to SQLite categories
  const categoryMapping = {
    decide_now: 'decide_now',
    needs_more_info: 'needs_info',
    task_not_decision: 'task',
    let_go: 'let_go'
  };

  const insertedThoughtsMap = new Map(); // temp ID -> SQLite thought_id

  // Loop through all buckets and insert thoughts
  for (const [bucketKey, thoughtsList] of Object.entries(classified.buckets)) {
    const sqliteCategory = categoryMapping[bucketKey];
    if (!sqliteCategory) continue;

    for (const thought of thoughtsList) {
      const urgency = thought.urgency || 1;
      const impact = thought.impact || 1;
      const reversibility = thought.reversibility || 3;
      const score = thought.priority_score || (urgency * impact * reversibility);
      const reasoning = thought.reasoning || null;

      const thoughtInsert = await dbQuery.run(
        `INSERT INTO thoughts (
          dump_id, thought_text, category, category_details,
          urgency, impact, reversibility, priority_score, is_resolved
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [dumpId, thought.text, sqliteCategory, reasoning, urgency, impact, reversibility, score]
      );

      insertedThoughtsMap.set(thought.id, thoughtInsert.id);
    }
  }

  // Insert follow-up question if a top decision was selected and exists in the inserted thoughts
  if (decision && decision.top_decision) {
    const topDec = decision.top_decision;
    const sqliteThoughtId = insertedThoughtsMap.get(topDec.id);
    
    if (sqliteThoughtId && topDec.follow_up_question) {
      await dbQuery.run(
        'INSERT INTO follow_up_questions (thought_id, generated_question) VALUES (?, ?)',
        [sqliteThoughtId, topDec.follow_up_question]
      );
    }
  }

  return {
    dumpId,
    success: true
  };
}
