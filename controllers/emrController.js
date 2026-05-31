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
    const { patient_id, weight, height, bp_systolic, bp_diastolic, pulse, temperature, oxygen_saturation, triage_level, creatinine, recorded_by } = req.body;

    if (!patient_id) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    const result = await db.run(
      `INSERT INTO vital_signs 
       (patient_id, weight, height, bp_systolic, bp_diastolic, pulse, temperature, oxygen_saturation, triage_level, creatinine, recorded_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, weight, height, bp_systolic, bp_diastolic, pulse, temperature, oxygen_saturation, triage_level || 'Green', creatinine || 0.8, recorded_by || 'Staff Nurse']
    );

    // Update queue station and sync the triage level to wait queue!
    await db.run(
      "UPDATE queues SET status = 'Waiting_Doctor', triage_level = ?, current_station = 'รอคิวเข้าตรวจพบแพทย์' WHERE patient_id = ? AND status = 'Waiting_Vitals'",
      [triage_level || 'Green', patient_id]
    );

    // Log audit trail
    await db.run(
      "INSERT INTO audit_logs (user_id, action, target_table, target_id, details) VALUES (?, 'RECORD_VITAL_SIGNS', 'vital_signs', ?, ?)",
      [req.user ? req.user.id : null, result.insertId, `Recorded vitals and assigned triage level ${triage_level} for patient ID ${patient_id}`]
    );

    res.status(201).json({ message: 'Vital signs recorded successfully', id: result.insertId });
  } catch (err) {
    console.error('Error saving vital signs:', err);
    res.status(500).json({ message: 'Error saving vital signs', error: err.message });
  }
};

// Save Doctor Consultation SOAP Note & Order Rx with CLINICAL SAFETY BLOCKS
exports.createPrescription = async (req, res) => {
  try {
    const { patient_id, queue_id, diagnosed_icd10, soap_subjective, soap_objective, soap_assessment, soap_plan, items } = req.body;
    const doctor_id = req.user ? req.user.id : 3;

    if (!patient_id || !queue_id) {
      return res.status(400).json({ message: 'Patient ID and Queue ID are required' });
    }

    // Load Patient's Clinical Allergies & Pregnancy status
    const patient = await db.get('SELECT allergies, pregnancy_status FROM patients WHERE id = ?', [patient_id]);
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found' });
    }

    // 1. STAGE & VERIFY DRUG CONSTRAINTS (Safety Checks before writing to DB!)
    let totalBillAmount = 0;
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const drug = await db.get('SELECT id, name, drug_family, pregnancy_category, price_per_unit FROM drugs WHERE id = ?', [item.drug_id]);
        if (!drug) {
          return res.status(400).json({ message: 'ไม่พบรายการยานี้ในระบบฐานข้อมูลคลังยา' });
        }

        // CLINICAL GUARD A: Drug Allergy Cross-Reaction Block
        if (patient.allergies && patient.allergies !== 'ไม่มี') {
          if (patient.allergies.toLowerCase().trim() === drug.drug_family.toLowerCase().trim()) {
            return res.status(400).json({
              message: `🚫 สั่งจ่ายล้มเหลว! ยา ${drug.name} อยู่ในกลุ่มเคมีภัณฑ์ยา "${drug.drug_family}" ซึ่งคนไข้มีประวัติการแพ้ยากลุ่มนี้อย่างรุนแรง`
            });
          }
        }

        // CLINICAL GUARD B: FDA Pregnancy Category X/D Block
        if (patient.pregnancy_status === 'Pregnant') {
          if (drug.pregnancy_category === 'X' || drug.pregnancy_category === 'D') {
            return res.status(400).json({
              message: `🚫 สั่งจ่ายล้มเหลว! ยา ${drug.name} จัดอยู่ในกลุ่มวัตถุเสี่ยงประเภท Category ${drug.pregnancy_category} ซึ่งห้ามสั่งจ่ายแก่สตรีมีครรภ์เด็ดขาด`
            });
          }
        }

        // CLINICAL GUARD C: Nephrotoxicity (Kidney Impairment) Block
        if (drug.drug_family === 'NSAIDs') {
          // Retrieve patient's latest creatinine value
          const vitals = await db.get('SELECT creatinine FROM vital_signs WHERE patient_id = ? ORDER BY recorded_at DESC', [patient_id]);
          if (vitals && vitals.creatinine > 1.5) {
            return res.status(400).json({
              message: `🚫 สั่งจ่ายล้มเหลว! ยา ${drug.name} มีฤทธิ์ทำลายเนื้อเยื่อกรองไต (NSAIDs) ไม่สามารถสั่งจ่ายได้เนื่องจากค่าการทำงานของไตล่าสุดเสื่อมวิกฤต (Creatinine = ${vitals.creatinine} mg/dL)`
            });
          }
        }

        totalBillAmount += (drug.price_per_unit * item.quantity);
      }
    }

    // Add professional Doctor fee (300 THB)
    totalBillAmount += 300;

    // 2. ALL GUARDS PASSED - Save Prescription (SOAP Note)
    const result = await db.run(
      `INSERT INTO prescriptions 
       (patient_id, doctor_id, queue_id, diagnosed_icd10, soap_subjective, soap_objective, soap_assessment, soap_plan, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [patient_id, doctor_id, queue_id, diagnosed_icd10, soap_subjective, soap_objective, soap_assessment, soap_plan]
    );
    const prescriptionId = result.insertId;

    // 3. Save Prescription Drug Items
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await db.run(
          'INSERT INTO prescription_items (prescription_id, drug_id, quantity, dosage_instructions) VALUES (?, ?, ?, ?)',
          [prescriptionId, item.drug_id, item.quantity, item.dosage_instructions]
        );
      }
    }

    // 4. Move Queue Station to Pharmacy Dispensing
    await db.run(
      "UPDATE queues SET status = 'Waiting_Pharmacy', current_station = 'รอห้องคลังจัดและตรวจสอบยา' WHERE id = ?",
      [queue_id]
    );

    // 5. Create Unpaid Bill invoice
    await db.run(
      'INSERT INTO bills (patient_id, queue_id, prescription_id, total_amount, paid_amount, payment_method, status) VALUES (?, ?, ?, ?, 0, "Cash", "Unpaid")',
      [patient_id, queue_id, prescriptionId, totalBillAmount]
    );

    // Update appointment state if linked
    const queue = await db.get('SELECT appointment_id FROM queues WHERE id = ?', [queue_id]);
    if (queue && queue.appointment_id) {
      await db.run("UPDATE appointments SET status = 'Completed' WHERE id = ?", [queue.appointment_id]);
    }

    // Log security audit trail
    await db.run(
      "INSERT INTO audit_logs (user_id, action, target_table, target_id, details) VALUES (?, 'DOCTOR_PRESCRIBE', 'prescriptions', ?, ?)",
      [doctor_id, prescriptionId, `Consultation SOAP note completed and all clinical safety blocks passed for patient HN0000${patient_id}`]
    );

    res.status(201).json({ message: 'Prescription ordered successfully', prescriptionId });

  } catch (err) {
    console.error('Error creating prescription:', err);
    res.status(500).json({ message: 'Error creating prescription', error: err.message });
  }
};
