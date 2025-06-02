// routes/packageRoutes.js
const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

/**
 * @route POST /packages
 * @desc Create a new package (subscription or event)
 * @access Admin only
 */
router.post(
  '/',
  authMiddleware,
  checkRole('admin'),
  packageController.createPackage
);

/**
 * @route GET /packages
 * @desc Get all packages (admin only)
 * @access Admin only
 */
router.get(
  '/',
  authMiddleware,
  checkRole('admin'),
  packageController.getAllPackages
);

/**
 * @route GET /packages/search?field=…&value=…
 * @desc Get packages by arbitrary field (id, slug, package_type, event_id, is_active) – admin only
 * @access Admin only
 */
router.get(
  '/search',
  authMiddleware,
  checkRole('admin'),
  packageController.getPackagesByField
);

/**
 * @route GET /packages/public
 * @desc Get public packages (is_active = TRUE)
 * @access Public
 */
router.get('/public', packageController.getPublicPackages);

/**
 * @route GET /packages/public/search?field=…&value=…
 * @desc Get public packages by arbitrary field (id, slug, package_type, event_id) – public
 * @access Public
 */
router.get('/public/search', packageController.getPublicPackagesByField);

/**
 * @route PUT /packages/:id
 * @desc Update a package by ID
 * @access Admin only
 */
router.put(
  '/:id',
  authMiddleware,
  checkRole('admin'),
  packageController.updatePackage
);

/**
 * @route PUT /packages/:id/deactivate
 * @desc Soft-delete (deactivate) a package by ID
 * @access Admin only
 */
router.put(
  '/:id/deactivate',
  authMiddleware,
  checkRole('admin'),
  packageController.deactivatePackage
);

/**
 * @route PUT /packages/:id/reactivate
 * @desc Reactivate a soft-deleted package by ID
 * @access Admin only
 */
router.put(
  '/:id/reactivate',
  authMiddleware,
  checkRole('admin'),
  packageController.reactivatePackage
);

module.exports = router;
