const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');
const { authenticateToken } = require('../controllers/authController');

router.get('/active', authenticateToken, queueController.getActiveQueues);
router.post('/', authenticateToken, queueController.createQueue);
router.put('/:id', authenticateToken, queueController.updateQueueStation);

module.exports = router;
