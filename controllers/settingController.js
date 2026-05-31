const db = require('../config/db');

// Get all or specific settings
exports.getSettings = async (req, res) => {
  try {
    const { key } = req.query;
    let query = 'SELECT setting_key, setting_value FROM settings';
    const params = [];
    if (key) {
      query += ' WHERE setting_key = ?';
      params.push(key);
    }
    const [rows] = await db.query(query, params);
    const settings = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    res.json(settings);
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ message: 'Error fetching settings', error: err.message });
  }
};

// Update or insert settings (upsert)
exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No settings to update provided' });
    }

    for (const key in updates) {
      const value = updates[key];
      const [existing] = await db.query('SELECT 1 FROM settings WHERE setting_key = ?', [key]);
      if (existing.length > 0) {
        await db.query('UPDATE settings SET setting_value = ? WHERE setting_key = ?', [value, key]);
      } else {
        await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)', [key, value]);
      }
    }
    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ message: 'Error updating settings', error: err.message });
  }
};
