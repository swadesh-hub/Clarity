import express from 'express';
import { dbQuery } from '../db.js';
import { processBrainDump } from '../services/triageService.js';

const router = express.Router();

// POST /api/dumps - Ingest and triage a new brain dump
router.post('/dumps', async (req, res) => {
  const { rawContent } = req.body;
  if (!rawContent || rawContent.trim().length === 0) {
    return res.status(400).json({ error: 'rawContent is required' });
  }

  try {
    const result = await processBrainDump(rawContent, 1); // defaulting to user_id = 1
    res.status(201).json(result);
  } catch (error) {
    console.error('Error processing brain dump:', error);
    res.status(500).json({ error: error.message || 'Internal server error during triage' });
  }
});

// GET /api/dumps - Fetch all raw brain dumps
router.get('/dumps', async (req, res) => {
  try {
    const dumps = await dbQuery.all(
      'SELECT dump_id AS id, original_text AS raw_content, created_at FROM brain_dumps ORDER BY created_at DESC'
    );
    res.json(dumps);
  } catch (error) {
    console.error('Error fetching dumps:', error);
    res.status(500).json({ error: 'Failed to fetch brain dumps' });
  }
});

// DELETE /api/dumps/:id - Delete a brain dump (cascades to thoughts, flags, questions)
router.delete('/dumps/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await dbQuery.run('DELETE FROM brain_dumps WHERE dump_id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Brain dump not found' });
    }
    res.json({ message: 'Brain dump deleted successfully', id });
  } catch (error) {
    console.error('Error deleting brain dump:', error);
    res.status(500).json({ error: 'Failed to delete brain dump' });
  }
});

// GET /api/items - Fetch joined triage list
router.get('/items', async (req, res) => {
  try {
    const query = `
      SELECT 
        t.thought_id AS id,
        t.dump_id,
        t.thought_text AS original_text,
        t.category,
        t.category_details,
        t.urgency,
        t.impact AS stakes,
        t.reversibility,
        t.priority_score,
        t.is_resolved,
        t.resolution_summary,
        t.created_at,
        q.generated_question AS follow_up_question,
        q.user_answer,
        CASE WHEN sf.flag_id IS NOT NULL THEN 1 ELSE 0 END AS is_safety_flagged
      FROM thoughts t
      LEFT JOIN follow_up_questions q ON t.thought_id = q.thought_id
      LEFT JOIN safety_flags sf ON t.dump_id = sf.dump_id
      ORDER BY t.priority_score DESC, t.created_at DESC
    `;
    const items = await dbQuery.all(query);
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// PUT /api/items/:id - Update an individual thought item
router.put('/items/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    category, 
    original_text, 
    category_details, 
    urgency, 
    stakes, 
    reversibility, 
    is_resolved, 
    resolution_summary,
    user_answer
  } = req.body;

  try {
    // 1. Get current item to determine current values
    const currentItem = await dbQuery.get('SELECT * FROM thoughts WHERE thought_id = ?', [id]);
    if (!currentItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Resolve update values (supporting fallback to existing values)
    const updText = original_text !== undefined ? original_text : currentItem.thought_text;
    const updCat = category !== undefined ? category : currentItem.category;
    const updDetails = category_details !== undefined ? category_details : currentItem.category_details;
    const updUrgency = urgency !== undefined ? parseInt(urgency, 10) : currentItem.urgency;
    const updImpact = stakes !== undefined ? parseInt(stakes, 10) : currentItem.impact;
    const updReversibility = reversibility !== undefined ? parseInt(reversibility, 10) : currentItem.reversibility;
    const updResolved = is_resolved !== undefined ? (is_resolved ? 1 : 0) : currentItem.is_resolved;
    const updSummary = resolution_summary !== undefined ? resolution_summary : currentItem.resolution_summary;

    // Recalculate priority score: ROUND((urgency * impact) / reversibility, 2)
    // Lower reversibility = harder to undo = higher score
    const updScore = Math.round((updUrgency * updImpact) / updReversibility * 100) / 100;

    // Update the thought in DB
    await dbQuery.run(
      `UPDATE thoughts 
       SET thought_text = ?, category = ?, category_details = ?, 
           urgency = ?, impact = ?, reversibility = ?, priority_score = ?, 
           is_resolved = ?, resolution_summary = ?
       WHERE thought_id = ?`,
      [updText, updCat, updDetails, updUrgency, updImpact, updReversibility, updScore, updResolved, updSummary, id]
    );

    // 2. Handle follow-up question answer update
    if (user_answer !== undefined) {
      // Check if follow-up row exists
      const qRow = await dbQuery.get('SELECT * FROM follow_up_questions WHERE thought_id = ?', [id]);
      if (qRow) {
        await dbQuery.run(
          'UPDATE follow_up_questions SET user_answer = ? WHERE thought_id = ?',
          [user_answer, id]
        );
      } else {
        // Create an empty follow up if user is providing an answer but none exists
        await dbQuery.run(
          'INSERT INTO follow_up_questions (thought_id, generated_question, user_answer) VALUES (?, ?, ?)',
          [id, 'Follow-up question:', user_answer]
        );
      }
    }

    // Fetch the fully updated item to return to the client
    const updated = await dbQuery.get(
      `SELECT 
        t.thought_id AS id,
        t.dump_id,
        t.thought_text AS original_text,
        t.category,
        t.category_details,
        t.urgency,
        t.impact AS stakes,
        t.reversibility,
        t.priority_score,
        t.is_resolved,
        t.resolution_summary,
        t.created_at,
        q.generated_question AS follow_up_question,
        q.user_answer,
        CASE WHEN sf.flag_id IS NOT NULL THEN 1 ELSE 0 END AS is_safety_flagged
      FROM thoughts t
      LEFT JOIN follow_up_questions q ON t.thought_id = q.thought_id
      LEFT JOIN safety_flags sf ON t.dump_id = sf.dump_id
      WHERE t.thought_id = ?`,
      [id]
    );

    res.json(updated);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update thought item' });
  }
});

// DELETE /api/items/:id - Delete individual thought item
router.delete('/items/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await dbQuery.run('DELETE FROM thoughts WHERE thought_id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully', id });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
