const db = require('../models/db');

// ดึงผู้ป่วยทั้งหมด
exports.getAllPatients = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM patients');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
};

// เพิ่มผู้ป่วยใหม่
exports.createPatient = async (req, res) => {
  const { name, gender, dob, phone } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO patients (name, gender, dob, phone) VALUES (?, ?, ?, ?)',
      [name, gender, dob, phone]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Insert failed' });
  }
};
