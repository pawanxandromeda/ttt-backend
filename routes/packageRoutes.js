const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware')

// Create a package
router.post('/', authMiddleware, checkRole('admin'), packageController.savePackage);

// Get all packages
router.get('/', packageController.getPackages);

// Get single package
router.get('/:id', packageController.getPackageById);

// Update package
router.put('/:id', authMiddleware, checkRole('admin'), packageController.updatePackage);

module.exports = router;
