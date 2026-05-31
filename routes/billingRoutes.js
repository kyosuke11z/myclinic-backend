const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authenticateToken, requireRole } = require('../controllers/authController');

router.get('/pending', authenticateToken, requireRole(['Cashier', 'Admin']), billingController.getPendingBills);
router.post('/pay/:id', authenticateToken, requireRole(['Cashier', 'Admin']), billingController.payBill);

module.exports = router;
