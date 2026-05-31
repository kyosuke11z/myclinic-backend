const db = require('../config/db');

// Aggregate Executive BI metrics
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Core Counts
    const patientsCount = await db.get('SELECT COUNT(*) as count FROM patients');
    const appointmentsCount = await db.get('SELECT COUNT(*) as count FROM appointments');
    const pendingQueuesCount = await db.get("SELECT COUNT(*) as count FROM queues WHERE status != 'Discharged'");
    
    // Low stock warning (stock_quantity <= reorder_level)
    const lowStockCount = await db.get('SELECT COUNT(*) as count FROM drugs WHERE stock_quantity <= reorder_level');

    // 2. Financial Metrics
    const revenueRow = await db.get("SELECT SUM(paid_amount) as total FROM bills WHERE status = 'Paid'");
    const totalRevenue = revenueRow.total || 0;

    const paymentMethods = await db.query(
      "SELECT payment_method, COUNT(*) as count, SUM(paid_amount) as amount FROM bills WHERE status = 'Paid' GROUP BY payment_method"
    );

    // 3. Top Diagnoses (Illness stats)
    const diagnosesBreakdown = await db.query(
      "SELECT diagnosed_icd10, COUNT(*) as count FROM prescriptions WHERE diagnosed_icd10 IS NOT NULL GROUP BY diagnosed_icd10 ORDER BY count DESC LIMIT 5"
    );

    // 4. Staff active roles count
    const staffBreakdown = await db.query(
      "SELECT role, COUNT(*) as count FROM users GROUP BY role"
    );

    res.json({
      summary: {
        totalPatients: patientsCount.count,
        totalAppointments: appointmentsCount.count,
        activeQueues: pendingQueuesCount.count,
        lowStockItems: lowStockCount.count,
        totalRevenue
      },
      paymentMethods,
      diagnosesBreakdown,
      staffBreakdown
    });

  } catch (err) {
    console.error('Error fetching analytics stats:', err);
    res.status(500).json({ message: 'Error calculating BI stats', error: err.message });
  }
};

// Retrieve clinic-wide security audit logs
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await db.query(
      `SELECT al.*, u.name as staff_name, u.role as staff_role
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT 100`
    );
    res.json(logs);
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ message: 'Error fetching audit logs', error: err.message });
  }
};
