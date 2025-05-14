const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // GET /api/patients
  router.get('/', async (req, res) => {
    try {
      const [rows] = await db.promise().query('SELECT * FROM patients');
      res.json(rows);
    } catch (err) {
      console.error('❌ Error fetching patients:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // POST /api/patients
  router.post('/', async (req, res) => {
    const { name, gender, dob, phone } = req.body;
    try {
      const [result] = await db.promise().query(
        'INSERT INTO patients (name, gender, dob, phone) VALUES (?, ?, ?, ?)',
        [name, gender, dob, phone]
      );
      res.json({ id: result.insertId });
    } catch (err) {
      console.error('❌ Error adding patient:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  return router;
};
