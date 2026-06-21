import express from 'express';
import { dbQuery } from '../db.js';

const router = express.Router();

// GET /api/safety - Fetch all safety intercept keywords
router.get('/safety', async (req, res) => {
  try {
    const intercepts = await dbQuery.all('SELECT id, keyword, category FROM safety_intercepts ORDER BY keyword ASC');
    res.json(intercepts);
  } catch (error) {
    console.error('Error fetching safety intercepts:', error);
    res.status(500).json({ error: 'Failed to fetch safety intercepts' });
  }
});

// POST /api/safety - Insert a new safety intercept keyword
router.post('/safety', async (req, res) => {
  const { keyword, category } = req.body;
  if (!keyword || keyword.trim().length === 0) {
    return res.status(400).json({ error: 'Keyword is required' });
  }

  const cleanKeyword = keyword.trim().toLowerCase();
  const cleanCategory = category ? category.trim() : 'distress';

  try {
    const existing = await dbQuery.get('SELECT id FROM safety_intercepts WHERE keyword = ?', [cleanKeyword]);
    if (existing) {
      return res.status(409).json({ error: 'Keyword already exists' });
    }

    const result = await dbQuery.run(
      'INSERT INTO safety_intercepts (keyword, category) VALUES (?, ?)',
      [cleanKeyword, cleanCategory]
    );
    res.status(201).json({ id: result.id, keyword: cleanKeyword, category: cleanCategory });
  } catch (error) {
    console.error('Error adding safety intercept:', error);
    res.status(500).json({ error: 'Failed to add safety intercept' });
  }
});

// DELETE /api/safety/:id - Delete a safety intercept by ID
router.delete('/safety/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await dbQuery.run('DELETE FROM safety_intercepts WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Safety intercept not found' });
    }
    res.json({ message: 'Safety intercept deleted successfully', id });
  } catch (error) {
    console.error('Error deleting safety intercept:', error);
    res.status(500).json({ error: 'Failed to delete safety intercept' });
  }
});

export default router;
