import express from 'express';
import { dbQuery } from '../db.js';

const router = express.Router();

// GET /api/settings - Fetch all settings
router.get('/settings', async (req, res) => {
  try {
    const rows = await dbQuery.all('SELECT key, value FROM app_settings');
    const settings = {};
    for (const row of rows) {
      // Normalize to uppercase keys to prevent duplicates
      const normalizedKey = row.key.toUpperCase();
      // Only include the key once (in case of legacy lowercase duplicates)
      if (!settings[normalizedKey]) {
        settings[normalizedKey] = row.value;
      }
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

  // Normalize key to uppercase, strip any accidentally JSON-encoded values
  const normalizedKey = key.toUpperCase();
  let normalizedValue = value;
  if (typeof value === 'object') {
    normalizedValue = JSON.stringify(value);
  }

  try {
    // Also remove any stale lowercase version of the same key
    await dbQuery.run('DELETE FROM app_settings WHERE key = ?', [key.toLowerCase()]);
    await dbQuery.run(
      'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [normalizedKey, String(normalizedValue)]
    );
    res.json({ message: `Setting '${normalizedKey}' updated successfully`, key: normalizedKey, value: normalizedValue });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

export default router;
