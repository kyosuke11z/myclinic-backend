const db = require('../config/db');

// List all drugs in stock
exports.getAllDrugs = async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM drugs ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching drugs inventory:', err);
    res.status(500).json({ message: 'Error fetching inventory', error: err.message });
  }
};

// Add new drug item
exports.createDrug = async (req, res) => {
  try {
    const { code, name, type, stock_quantity, reorder_level, expiry_date, price_per_unit } = req.body;

    if (!code || !name || !type || price_per_unit === undefined) {
      return res.status(400).json({ message: 'Code, Name, Type and Price are required' });
    }

    const result = await db.run(
      `INSERT INTO drugs (code, name, type, stock_quantity, reorder_level, expiry_date, price_per_unit) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [code, name, type, stock_quantity || 0, reorder_level || 10, expiry_date || null, price_per_unit]
    );

    res.status(201).json({ message: 'Drug added successfully', id: result.insertId });
  } catch (err) {
    console.error('Error adding drug:', err);
    res.status(500).json({ message: 'Error adding drug to database', error: err.message });
  }
};

// Update drug stock or info
exports.updateDrug = async (req, res) => {
  try {
    const id = req.params.id;
    const { code, name, type, stock_quantity, reorder_level, expiry_date, price_per_unit } = req.body;

    const fields = [];
    const params = [];

    if (code) { fields.push('code = ?'); params.push(code); }
    if (name) { fields.push('name = ?'); params.push(name); }
    if (type) { fields.push('type = ?'); params.push(type); }
    if (stock_quantity !== undefined) { fields.push('stock_quantity = ?'); params.push(stock_quantity); }
    if (reorder_level !== undefined) { fields.push('reorder_level = ?'); params.push(reorder_level); }
    if (expiry_date !== undefined) { fields.push('expiry_date = ?'); params.push(expiry_date); }
    if (price_per_unit !== undefined) { fields.push('price_per_unit = ?'); params.push(price_per_unit); }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update provided' });
    }

    await db.run(`UPDATE drugs SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
    res.json({ message: `Drug ${id} updated successfully` });
  } catch (err) {
    console.error('Error updating drug:', err);
    res.status(500).json({ message: 'Error updating drug details', error: err.message });
  }
};

// Get prescriptions pending pharmacy check (Dispensing waiting list)
exports.getPendingPrescriptions = async (req, res) => {
  try {
    const queryStr = `
      SELECT p.*, pt.name as patient_name, pt.hn as patient_hn, u.name as doctor_name, q.queue_number
      FROM prescriptions p
      JOIN patients pt ON p.patient_id = pt.id
      JOIN users u ON p.doctor_id = u.id
      JOIN queues q ON p.queue_id = q.id
      WHERE p.status = 'Pending'
      ORDER BY p.created_at ASC
    `;
    const prescriptions = await db.query(queryStr);

    for (const pr of prescriptions) {
      pr.items = await db.query(
        `SELECT pi.*, d.name as drug_name, d.code as drug_code, d.price_per_unit
         FROM prescription_items pi
         JOIN drugs d ON pi.drug_id = d.id
         WHERE pi.prescription_id = ?`,
        [pr.id]
      );
    }

    res.json(prescriptions);
  } catch (err) {
    console.error('Error fetching pending prescriptions:', err);
    res.status(500).json({ message: 'Error fetching dispensing queue', error: err.message });
  }
};

// Dispense and pack drugs (reduces stock, pushes queue to billing)
exports.dispensePrescription = async (req, res) => {
  try {
    const prescriptionId = req.params.id;

    // 1. Get prescription & items
    const prescription = await db.get('SELECT * FROM prescriptions WHERE id = ?', [prescriptionId]);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    if (prescription.status === 'Dispensed') {
      return res.status(400).json({ message: 'ใบสั่งยานี้จ่ายยาเรียบร้อยแล้ว' });
    }

    const items = await db.query('SELECT * FROM prescription_items WHERE prescription_id = ?', [prescriptionId]);

    // 2. Validate stock and deduct
    for (const item of items) {
      const drug = await db.get('SELECT stock_quantity, name FROM drugs WHERE id = ?', [item.drug_id]);
      if (!drug || drug.stock_quantity < item.quantity) {
        return res.status(400).json({ message: `สต็อกยาไม่เพียงพอ: ${drug ? drug.name : 'Unknown Drug'}` });
      }
    }

    // Deduct stock
    for (const item of items) {
      await db.run(
        'UPDATE drugs SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.drug_id]
      );
    }

    // 3. Mark Prescription as Dispensed
    await db.run("UPDATE prescriptions SET status = 'Dispensed' WHERE id = ?", [prescriptionId]);

    // 4. Update Queue Station to Billing
    await db.run(
      "UPDATE queues SET status = 'Waiting_Billing', current_station = 'แผนกการเงินชำระเงิน' WHERE id = ?",
      [prescription.queue_id]
    );

    // Log audit trail
    await db.run(
      "INSERT INTO audit_logs (user_id, action, target_table, target_id, details) VALUES (?, 'DISPENSE_MEDICATION', 'prescriptions', ?, ?)",
      [req.user ? req.user.id : null, prescriptionId, `Pharmacist dispensed prescription ID ${prescriptionId}`]
    );

    res.json({ message: 'Dispensing completed. Patient pushed to Billing station.' });

  } catch (err) {
    console.error('Error dispensing prescription:', err);
    res.status(500).json({ message: 'Error dispensing prescription', error: err.message });
  }
};
