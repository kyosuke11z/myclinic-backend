// c:\Users\Matsumoto\myclinic-backend\index.js

const express = require('express');
const cors = require('cors');
const db = require('./db'); // สมมติว่าคุณมีไฟล์ db.js สำหรับการเชื่อมต่อ database
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); // สำหรับ parse JSON request bodies

// --- Patient Endpoints ---
app.get('/patients', async (req, res) => {
  try {
    // เลือกคอลัมน์ที่ต้องการจากตาราง patients
    const [dbRows] = await db.query('SELECT id, name, phone, created_at, dob, gender FROM patients');

    // แปลงข้อมูลให้ตรงกับที่ Frontend คาดหวัง
    const formattedPatients = dbRows.map(patient => {
      let firstName = '';
      let lastName = '';

      // พยายามแยกชื่อและนามสกุลจากคอลัมน์ 'name'
      if (patient.name) {
        const nameParts = patient.name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || ''; // ในกรณีที่มีชื่อมากกว่า 2 ส่วน
      }

      return {
        id: String(patient.id), // แปลง id เป็น string
        hn: `HN${String(patient.id).padStart(5, '0')}`, // สร้าง HN ชั่วคราวจาก ID
        firstName: firstName,
        lastName: lastName,
        phone: patient.phone || '', // ถ้า phone เป็น null ให้เป็น empty string
        // ใช้ created_at เป็น lastVisit และจัดรูปแบบ (ตัวอย่าง: 2023-10-26)
        lastVisit: patient.created_at ? new Date(patient.created_at).toISOString().split('T')[0] : '',
        // คุณอาจจะต้องการส่ง dob และ gender ไปด้วยถ้า Frontend จะใช้
        // dob: patient.dob ? new Date(patient.dob).toISOString().split('T')[0] : '',
        // gender: patient.gender || ''
      };
    });
    res.json(formattedPatients);
  } catch (err) {
    console.error('Error fetching patients:', err);
    res.status(500).json({ message: 'Error fetching patients from database', error: err.message });
  }
});

app.post('/patients', async (req, res) => {
  try {
    // รับข้อมูลจาก request body
    let { name, phone, gender, dob } = req.body;

    // ตรวจสอบข้อมูลเบื้องต้น
    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and Phone are required' });
    }
    // กำหนดค่า default ให้ gender ถ้าไม่ได้ส่งมา หรือส่งมาเป็นค่าที่ไม่ถูกต้อง
    if (!gender || !['ชาย', 'หญิง'].includes(gender)) {
        gender = 'ชาย'; // หรือ 'หญิง' หรือค่า default อื่นๆ ที่คุณต้องการ
      }


    const [result] = await db.query(
      'INSERT INTO patients (name, phone, gender, dob) VALUES (?, ?, ?, ?)',
      [name, phone, gender, dob || null]
    );

    const [newPatientRows] = await db.query('SELECT * FROM patients WHERE id = ?', [result.insertId]);
    const newPatient = newPatientRows[0];

    res.status(201).json({ message: 'Patient added successfully', patientId: result.insertId, patient: newPatient });
  } catch (err) {
    console.error('Error adding patient:', err);
    res.status(500).json({ message: 'Error adding patient to database', error: err.message });
  }
});

app.put('/patients/:id', async (req, res) => {
  try {
    const patientId = req.params.id;
    const { name, phone, gender, dob } = req.body;

    const fieldsToUpdate = [];
    const values = [];
    if (name !== undefined) { fieldsToUpdate.push('name = ?'); values.push(name); }
    if (phone !== undefined) { fieldsToUpdate.push('phone = ?'); values.push(phone); }
    if (gender !== undefined) { fieldsToUpdate.push('gender = ?'); values.push(gender); }
    if (dob !== undefined) { fieldsToUpdate.push('dob = ?'); values.push(dob); }

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
});

app.delete('/patients/:id', async (req, res) => {
  try {
    const patientId = req.params.id;
    await db.query('DELETE FROM patients WHERE id = ?', [patientId]);
    res.json({ message: `Patient with ID ${patientId} deleted successfully` });
  } catch (err) {
    console.error('Error deleting patient:', err);
    res.status(500).json({ message: 'Error deleting patient from database', error: err.message });
  }
});

// --- Appointment Endpoints ---
app.get('/appointments', async (req, res) => {
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
});

app.post('/appointments', async (req, res) => {
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
});

app.put('/appointments/:id', async (req, res) => {
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
});

app.delete('/appointments/:id', async (req, res) => {
  try {
    const appointmentId = req.params.id;
    await db.query('DELETE FROM appointments WHERE id = ?', [appointmentId]);
    res.json({ message: `Appointment ${appointmentId} deleted successfully` });
  } catch (err) {
    console.error('Error deleting appointment:', err);
    res.status(500).json({ message: 'Error deleting appointment', error: err.message });
  }
});

// --- Settings Endpoints ---
app.get('/settings', async (req, res) => {
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
});

app.put('/settings', async (req, res) => {
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
});

// Endpoint พื้นฐานสำหรับตรวจสอบว่า Server ทำงานหรือไม่
app.get('/', (req, res) => {
  res.send('MyClinic Backend is running!');
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
