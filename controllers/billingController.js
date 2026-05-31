const db = require('../config/db');

// Get all unpaid bills (Billing waiting list)
exports.getPendingBills = async (req, res) => {
  try {
    const queryStr = `
      SELECT b.*, p.name as patient_name, p.hn as patient_hn, q.queue_number, q.status as queue_status
      FROM bills b
      JOIN patients p ON b.patient_id = p.id
      JOIN queues q ON b.queue_id = q.id
      WHERE b.status = 'Unpaid'
      ORDER BY b.created_at ASC
    `;
    const bills = await db.query(queryStr);
    
    // Supplement each bill with prescription SOAP information and prescribed drug items
    for (const bill of bills) {
      if (bill.prescription_id) {
        bill.prescription = await db.get(
          'SELECT p.*, u.name as doctor_name FROM prescriptions p JOIN users u ON p.doctor_id = u.id WHERE p.id = ?',
          [bill.prescription_id]
        );
        if (bill.prescription) {
          bill.prescription_items = await db.query(
            `SELECT pi.*, d.name as drug_name, d.code as drug_code, d.price_per_unit
             FROM prescription_items pi
             JOIN drugs d ON pi.drug_id = d.id
             WHERE pi.prescription_id = ?`,
            [bill.prescription_id]
          );
        }
      }
    }
    
    res.json(bills);
  } catch (err) {
    console.error('Error fetching billing queue:', err);
    res.status(500).json({ message: 'Error fetching billing queue', error: err.message });
  }
};

// Process POS checkout invoice payment
exports.payBill = async (req, res) => {
  try {
    const billId = req.params.id;
    const { payment_method, discount, paid_amount } = req.body;
    const cashier_id = req.user ? req.user.id : 6; // Cashier mock ID fallback

    if (!payment_method || paid_amount === undefined) {
      return res.status(400).json({ message: 'Payment method and Paid Amount are required' });
    }

    const bill = await db.get('SELECT * FROM bills WHERE id = ?', [billId]);
    if (!bill) {
      return res.status(404).json({ message: 'Invoice bill not found' });
    }

    if (bill.status === 'Paid') {
      return res.status(400).json({ message: 'บิลค่ารักษารายการนี้ชำระเงินเรียบร้อยแล้ว' });
    }

    const discountVal = discount || 0;
    const finalTotal = bill.total_amount - discountVal;

    // Validate paid amount covers the bill
    if (paid_amount < finalTotal && payment_method !== 'Insurance') {
      return res.status(400).json({ message: 'ยอดชำระไม่พอกับยอดสุทธิ' });
    }

    // 1. Update Bill status
    await db.run(
      `UPDATE bills 
       SET status = 'Paid', 
           discount = ?, 
           paid_amount = ?, 
           payment_method = ?, 
           cashier_id = ? 
       WHERE id = ?`,
      [discountVal, paid_amount, payment_method, cashier_id, billId]
    );

    // 2. Discharge Patient Queue
    await db.run(
      "UPDATE queues SET status = 'Discharged', current_station = 'กลับบ้านเรียบร้อย' WHERE id = ?",
      [bill.queue_id]
    );

    // Log audit trail
    await db.run(
      "INSERT INTO audit_logs (user_id, action, target_table, target_id, details) VALUES (?, 'COLLECT_PAYMENT', 'bills', ?, ?)",
      [cashier_id, billId, `Cashier collected payment of ${paid_amount} THB via ${payment_method} for bill ${billId}`]
    );

    res.json({ message: 'Payment registered successfully. Patient discharged.' });

  } catch (err) {
    console.error('Error processing payment:', err);
    res.status(500).json({ message: 'Error processing payment', error: err.message });
  }
};
