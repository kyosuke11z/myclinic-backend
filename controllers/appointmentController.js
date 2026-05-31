const db = require('../config/db');

// Get all appointments
exports.getAllAppointments = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM appointments ORDER BY appointment_date, appointment_time');
    const formattedAppointments = rows.map(app => ({
      ...app,
      appointment_date: app.appointment_date ? new Date(app.appointment_date).toISOString().split('T')[0] : null,
    }));
    res.json(formattedAppointments);
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ message: 'Error fetching appointments', error: err.message });
  }
};

// Create a new appointment
exports.createAppointment = async (req, res) => {
  try {
    const { patient_name, appointment_date, appointment_time, reason, status, patient_id } = req.body;
    if (!patient_name || !appointment_date || !appointment_time) {
      return res.status(400).json({ message: 'Patient name, appointment date, and time are required' });
    }

    const [result] = await db.query(
      'INSERT INTO appointments (patient_name, appointment_date, appointment_time, reason, status, patient_id) VALUES (?, ?, ?, ?, ?, ?)',
      [patient_name, appointment_date, appointment_time, reason || null, status || 'Pending', patient_id || null]
    );
    res.status(201).json({ message: 'Appointment created successfully', appointmentId: result.insertId });
  } catch (err) {
    console.error('Error creating appointment:', err);
    res.status(500).json({ message: 'Error creating appointment', error: err.message });
  }
};

// Update an appointment
exports.updateAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { patient_name, appointment_date, appointment_time, reason, status, patient_id } = req.body;

    if (!patient_name && !appointment_date && !appointment_time && !reason && !status && patient_id === undefined) {
      return res.status(400).json({ message: 'No fields provided for update.' });
    }

    await db.query(
      'UPDATE appointments SET patient_name = ?, appointment_date = ?, appointment_time = ?, reason = ?, status = ?, patient_id = ? WHERE id = ?',
      [patient_name, appointment_date, appointment_time, reason, status, patient_id || null, appointmentId]
    );
    res.json({ message: `Appointment ${appointmentId} updated successfully` });
  } catch (err) {
    console.error('Error updating appointment:', err);
    res.status(500).json({ message: 'Error updating appointment', error: err.message });
  }
};

// Delete an appointment
exports.deleteAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    await db.query('DELETE FROM appointments WHERE id = ?', [appointmentId]);
    res.json({ message: `Appointment ${appointmentId} deleted successfully` });
  } catch (err) {
    console.error('Error deleting appointment:', err);
    res.status(500).json({ message: 'Error deleting appointment', error: err.message });
  }
};
