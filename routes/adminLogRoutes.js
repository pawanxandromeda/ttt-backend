const express = require('express');
const router = express.Router();
const adminLogController = require('../controllers/adminLogController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// Log an action (admin)
router.post('/admin/logs', authMiddleware, checkRole('admin'), adminLogController.saveLog);

// Get all logs (admin)
router.get('/admin/logs', authMiddleware, checkRole('admin'), adminLogController.getAllLogs);

// Get logs by admin
router.get('/admin/logs/:adminId', authMiddleware, checkRole('admin'), adminLogController.getLogsByAdmin);

module.exports = router;
