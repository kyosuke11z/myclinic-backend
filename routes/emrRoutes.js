const express = require('express');
const router = express.Router();
const emrController = require('../controllers/emrController');
const { authenticateToken, requireRole } = require('../controllers/authController');

router.get('/history/:patientId', authenticateToken, emrController.getPatientHistory);
router.post('/vitals', authenticateToken, requireRole(['Nurse', 'Doctor', 'Admin']), emrController.createVitalSigns);
router.post('/prescription', authenticateToken, requireRole(['Doctor', 'Admin']), emrController.createPrescription);

module.exports = router;
