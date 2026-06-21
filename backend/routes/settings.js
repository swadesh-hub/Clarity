import express from 'express';
import { dbQuery } from '../db.js';

const router = express.Router();

// GET /api/settings - Fetch all settings
router.get('/settings', async (req, res) => {
  try {
    const rows = await dbQuery.all('SELECT key, value FROM app_settings');
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// POST /api/settings - Update or insert settings
router.post('/settings', async (req, res) => {
  const { key, value } = req.body;
  if (!key) {
    return res.status(400).json({ error: 'Key is required' });
  }

  try {
    await dbQuery.run(
      'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, String(value)]
    );
    res.json({ message: `Setting '${key}' updated successfully`, key, value });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

export default router;
