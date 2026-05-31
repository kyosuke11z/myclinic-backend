const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, requireRole } = require('../controllers/authController');

router.get('/stats', authenticateToken, requireRole(['Admin']), analyticsController.getDashboardStats);
router.get('/logs', authenticateToken, requireRole(['Admin']), analyticsController.getAuditLogs);

module.exports = router;
