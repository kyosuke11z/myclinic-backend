const db = require('../config/db');

// Get patient's full medical history (Vital Signs + Past Prescriptions)
exports.getPatientHistory = async (req, res) => {
  try {
    const patientId = req.params.patientId;

    // 1. Get patient info
    const patient = await db.get('SELECT * FROM patients WHERE id = ?', [patientId]);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // 2. Get vitals
    const vitals = await db.query('SELECT * FROM vital_signs WHERE patient_id = ? ORDER BY recorded_at DESC', [patientId]);

    // 3. Get prescriptions (with prescribed drug items)
    const prescriptions = await db.query(
      `SELECT p.*, u.name as doctor_name 
       FROM prescriptions p
       JOIN users u ON p.doctor_id = u.id
       WHERE p.patient_id = ? 
       ORDER BY p.created_at DESC`,
      [patientId]
    );

    // Get drug items for each prescription
    for (const pr of prescriptions) {
      pr.items = await db.query(
        `SELECT pi.*, d.name as drug_name, d.code as drug_code, d.price_per_unit
         FROM prescription_items pi
         JOIN drugs d ON pi.drug_id = d.id
         WHERE pi.prescription_id = ?`,
        [pr.id]
      );
    }

    res.json({
      patient,
      vitals,
      prescriptions
    });

  } catch (err) {
    console.error('Error fetching EMR history:', err);
    res.status(500).json({ message: 'Error fetching medical history', error: err.message });
  }
};

// Record patient vital signs (Nurse station)
exports.createVitalSigns = async (req, res) => {
  try {
    const { patient_id, weight, height, bp_systolic, bp_diastolic, pulse, temperature, oxygen_saturation, recorded_by } = req.body;

    if (!patient_id) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    const result = await db.run(
      `INSERT INTO vital_signs 
       (patient_id, weight, height, bp_systolic, bp_diastolic, pulse, temperature, oxygen_saturation, recorded_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, weight, height, bp_systolic, bp_diastolic, pulse, temperature, oxygen_saturation, recorded_by || 'Staff Nurse']
    );

    // Update queue station if queue is active
    await db.run(
      "UPDATE queues SET status = 'Waiting_Doctor', current_station = 'ห้องตรวจแพทย์' WHERE patient_id = ? AND status = 'Waiting_Vitals'",
      [patient_id]
    );

    // Log audit trail
    await db.run(
      "INSERT INTO audit_logs (user_id, action, target_table, target_id, details) VALUES (?, 'RECORD_VITAL_SIGNS', 'vital_signs', ?, ?)",
      [req.user ? req.user.id : null, result.insertId, `Recorded vitals for patient ID ${patient_id}`]
    );

    res.status(201).json({ message: 'Vital signs recorded successfully', id: result.insertId });
  } catch (err) {
    console.error('Error saving vital signs:', err);
    res.status(500).json({ message: 'Error saving vital signs', error: err.message });
  }
};

// Save Doctor Consultation SOAP Note & Order Rx
exports.createPrescription = async (req, res) => {
  try {
    const { patient_id, queue_id, diagnosed_icd10, soap_subjective, soap_objective, soap_assessment, soap_plan, items } = req.body;
    const doctor_id = req.user ? req.user.id : 3; // Fallback to Doctor ID in mock

    if (!patient_id || !queue_id) {
      return res.status(400).json({ message: 'Patient ID and Queue ID are required' });
    }

    // 1. Insert Prescription (SOAP Note)
    const result = await db.run(
      `INSERT INTO prescriptions 
       (patient_id, doctor_id, queue_id, diagnosed_icd10, soap_subjective, soap_objective, soap_assessment, soap_plan, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [patient_id, doctor_id, queue_id, diagnosed_icd10, soap_subjective, soap_objective, soap_assessment, soap_plan]
    );
    const prescriptionId = result.insertId;

    // 2. Insert Prescription Drug Items
    let totalBillAmount = 0;
    if (items && Array.isArray(items)) {
      for (const item of items) {
        // Get drug price
        const drug = await db.get('SELECT price_per_unit FROM drugs WHERE id = ?', [item.drug_id]);
        if (drug) {
          totalBillAmount += (drug.price_per_unit * item.quantity);
        }

        await db.run(
          'INSERT INTO prescription_items (prescription_id, drug_id, quantity, dosage_instructions) VALUES (?, ?, ?, ?)',
          [prescriptionId, item.drug_id, item.quantity, item.dosage_instructions]
        );
      }
    }

    // Add standard consultation fee of 300 THB
    totalBillAmount += 300;

    // 3. Update Queue Station to Pharmacy
    await db.run(
      "UPDATE queues SET status = 'Waiting_Pharmacy', current_station = 'ห้องคลังยา / เภสัชกร' WHERE id = ?",
      [queue_id]
    );

    // 4. Create Unpaid Bill invoice in system
    await db.run(
      'INSERT INTO bills (patient_id, queue_id, prescription_id, total_amount, paid_amount, payment_method, status) VALUES (?, ?, ?, ?, 0, "Cash", "Unpaid")',
      [patient_id, queue_id, prescriptionId, totalBillAmount]
    );

    // Update appointment status to Completed if connected to queue
    const queue = await db.get('SELECT appointment_id FROM queues WHERE id = ?', [queue_id]);
    if (queue && queue.appointment_id) {
      await db.run("UPDATE appointments SET status = 'Completed' WHERE id = ?", [queue.appointment_id]);
    }

    // Log audit trail
    await db.run(
      "INSERT INTO audit_logs (user_id, action, target_table, target_id, details) VALUES (?, 'DOCTOR_PRESCRIBE', 'prescriptions', ?, ?)",
      [doctor_id, prescriptionId, `Doctor SOAP consultation filled for patient ${patient_id}`]
    );

    res.status(201).json({ message: 'Prescription ordered successfully', prescriptionId });

  } catch (err) {
    console.error('Error creating prescription:', err);
    res.status(500).json({ message: 'Error creating prescription', error: err.message });
  }
};
