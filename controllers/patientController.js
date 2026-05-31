const db = require('../config/db');

// Get all patients (formatted for the frontend)
exports.getAllPatients = async (req, res) => {
  try {
    const [dbRows] = await db.query('SELECT id, name, phone, created_at, dob, gender FROM patients');

    const formattedPatients = dbRows.map(patient => {
      let firstName = '';
      let lastName = '';

      if (patient.name) {
        const nameParts = patient.name.trim().split(/\s+/);
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      return {
        id: String(patient.id),
        hn: `HN${String(patient.id).padStart(5, '0')}`,
        firstName,
        lastName,
        name: patient.name || '',
        phone: patient.phone || '',
        gender: patient.gender || 'ชาย',
        dob: patient.dob ? new Date(patient.dob).toISOString().split('T')[0] : null,
        lastVisit: patient.created_at ? new Date(patient.created_at).toISOString().split('T')[0] : ''
      };
    });

    res.json(formattedPatients);
  } catch (err) {
    console.error('Error fetching patients:', err);
    res.status(500).json({ message: 'Error fetching patients from database', error: err.message });
  }
};

// Create a new patient
exports.createPatient = async (req, res) => {
  try {
    let { name, phone, gender, dob } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and Phone are required' });
    }

    if (!gender || !['ชาย', 'หญิง'].includes(gender)) {
      gender = 'ชาย';
    }

    const [result] = await db.query(
      'INSERT INTO patients (name, phone, gender, dob) VALUES (?, ?, ?, ?)',
      [name, phone, gender, dob || null]
    );

    const [newPatientRows] = await db.query('SELECT * FROM patients WHERE id = ?', [result.insertId]);
    const newPatient = newPatientRows[0];

    res.status(201).json({
      message: 'Patient added successfully',
      patientId: result.insertId,
      patient: newPatient
    });
  } catch (err) {
    console.error('Error adding patient:', err);
    res.status(500).json({ message: 'Error adding patient to database', error: err.message });
  }
};

// Update existing patient
exports.updatePatient = async (req, res) => {
  try {
    const patientId = req.params.id;
    const { name, phone, gender, dob } = req.body;

    const fieldsToUpdate = [];
    const values = [];

    if (name !== undefined) { fieldsToUpdate.push('name = ?'); values.push(name); }
    if (phone !== undefined) { fieldsToUpdate.push('phone = ?'); values.push(phone); }
    if (gender !== undefined) { fieldsToUpdate.push('gender = ?'); values.push(gender); }
    if (dob !== undefined) { fieldsToUpdate.push('dob = ?'); values.push(dob || null); }

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const query = `UPDATE patients SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
    await db.query(query, [...values, patientId]);

    res.json({ message: `Patient with ID ${patientId} updated successfully` });
  } catch (err) {
    console.error('Error updating patient:', err);
    res.status(500).json({ message: 'Error updating patient in database', error: err.message });
  }
};

// Delete patient
exports.deletePatient = async (req, res) => {
  try {
    const patientId = req.params.id;
    await db.query('DELETE FROM patients WHERE id = ?', [patientId]);
    res.json({ message: `Patient with ID ${patientId} deleted successfully` });
  } catch (err) {
    console.error('Error deleting patient:', err);
    res.status(500).json({ message: 'Error deleting patient from database', error: err.message });
  }
};
