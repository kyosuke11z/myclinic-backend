const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacyController');
const { authenticateToken, requireRole } = require('../controllers/authController');

router.get('/drugs', authenticateToken, pharmacyController.getAllDrugs);
router.post('/drugs', authenticateToken, requireRole(['Pharmacist', 'Admin']), pharmacyController.createDrug);
router.put('/drugs/:id', authenticateToken, requireRole(['Pharmacist', 'Admin']), pharmacyController.updateDrug);
router.get('/prescriptions/pending', authenticateToken, requireRole(['Pharmacist', 'Admin']), pharmacyController.getPendingPrescriptions);
router.post('/prescriptions/dispense/:id', authenticateToken, requireRole(['Pharmacist', 'Admin']), pharmacyController.dispensePrescription);

module.exports = router;
