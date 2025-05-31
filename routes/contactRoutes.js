const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController')
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// Create a contact
router.post('/', contactController.saveContact);

// Get all contacts
router.get('/', authMiddleware, checkRole('admin'), contactController.getContacts);

// Update a contact
router.put('/:id', authMiddleware, checkRole('admin'), contactController.updateContact);

module.exports = router;