const db = require('../config/db');

// Get all active clinic queues (not discharged) with dynamic priority sorting
exports.getActiveQueues = async (req, res) => {
  try {
    const queryStr = `
      SELECT q.*, p.name as patient_name, p.hn as patient_hn, p.gender, p.dob, p.pregnancy_status,
             u.name as doctor_name
      FROM queues q
      JOIN patients p ON q.patient_id = p.id
      LEFT JOIN users u ON q.doctor_id = u.id
      WHERE q.status != 'Discharged'
      ORDER BY 
        CASE q.triage_level
          WHEN 'Red' THEN 1
          WHEN 'Orange' THEN 2
          WHEN 'Yellow' THEN 3
          ELSE 4
        END ASC, 
        q.created_at ASC
    `;
    const rows = await db.query(queryStr);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching active queues:', err);
    res.status(500).json({ message: 'Error fetching active queues', error: err.message });
  }
};

// Register a patient into the active clinic queue
exports.createQueue = async (req, res) => {
  try {
    const { patient_id, appointment_id, doctor_id } = req.body;

    if (!patient_id) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    // Check if patient is already in an active queue
    const existing = await db.get(
      "SELECT 1 FROM queues WHERE patient_id = ? AND status != 'Discharged'",
      [patient_id]
    );
    if (existing) {
      return res.status(400).json({ message: 'ผู้ป่วยอยู่ในคิวตรวจรักษาที่ยังไม่เสร็จสิ้นแล้ว' });
    }

    // Auto-generate queue number (Q + count + 1)
    const today = new Date().toISOString().split('T')[0] + '%';
    const countRow = await db.get("SELECT COUNT(*) as count FROM queues WHERE created_at LIKE ?", [today]);
    const queueNum = `Q${String(countRow.count + 1).padStart(3, '0')}`;

    const result = await db.run(
      `INSERT INTO queues 
       (patient_id, appointment_id, queue_number, status, doctor_id, triage_level, current_station) 
       VALUES (?, ?, ?, 'Waiting_Vitals', ?, 'Green', 'รอซักประวัติแรกรับ')`,
      [patient_id, appointment_id || null, queueNum, doctor_id || null]
    );

    // Update appointment state if linked
    if (appointment_id) {
      await db.run("UPDATE appointments SET status = 'Pending' WHERE id = ?", [appointment_id]);
    }

    res.status(201).json({
      message: 'Patient queued successfully',
      queueId: result.insertId,
      queueNumber: queueNum
    });

  } catch (err) {
    console.error('Error adding patient to queue:', err);
    res.status(500).json({ message: 'Error adding patient to queue', error: err.message });
  }
};

// Transition queue to another station manually
exports.updateQueueStation = async (req, res) => {
  try {
    const queueId = req.params.id;
    const { status, current_station, doctor_id, triage_level } = req.body;

    const fields = [];
    const params = [];

    if (status) { fields.push('status = ?'); params.push(status); }
    if (current_station) { fields.push('current_station = ?'); params.push(current_station); }
    if (doctor_id !== undefined) { fields.push('doctor_id = ?'); params.push(doctor_id); }
    if (triage_level) { fields.push('triage_level = ?'); params.push(triage_level); }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update provided' });
    }

    const queryStr = `UPDATE queues SET ${fields.join(', ')} WHERE id = ?`;
    await db.run(queryStr, [...params, queueId]);

    res.json({ message: `Queue ${queueId} successfully updated` });
  } catch (err) {
    console.error('Error updating queue station:', err);
    res.status(500).json({ message: 'Error updating queue', error: err.message });
  }
};
