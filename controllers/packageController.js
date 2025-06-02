// controllers/packageController.js
const packageModel = require('../models/packageModel');

/**
 * Create a new package (subscription or event) – Admin only.
 */
async function createPackage(req, res) {
  try {
    const {
      name,
      slug,
      description,
      price,
      duration_days,
      is_active,
      package_type,
      event_id,
      capacity,
      package_registration_deadline,
    } = req.body;

    const pkg = await packageModel.createPackage({
      name,
      slug,
      description,
      price,
      duration_days,
      is_active,
      package_type,
      event_id,
      capacity,
      package_registration_deadline,
    });
    res.status(201).json(pkg);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}

/**
 * Get all packages (admin) – no status filter.
 */
async function getAllPackages(req, res) {
  try {
    const pkgs = await packageModel.getAllPackages();
    res.json(pkgs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch packages.' });
  }
}

/**
 * Get public packages (only is_active = TRUE).
 */
async function getPublicPackages(req, res) {
  try {
    const pkgs = await packageModel.getPublicPackages();
    res.json(pkgs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch public packages.' });
  }
}

/**
 * Get packages by arbitrary field (admin).
 */
async function getPackagesByField(req, res) {
  try {
    const { field, value } = req.query;
    if (!field || value === undefined) {
      return res
        .status(400)
        .json({ error: 'Query parameters "field" and "value" are required.' });
    }
    const pkgs = await packageModel.getPackagesByField(field, value);
    res.json(pkgs);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}

/**
 * Get public packages by arbitrary field (public).
 */
async function getPublicPackagesByField(req, res) {
  try {
    const { field, value } = req.query;
    if (!field || value === undefined) {
      return res
        .status(400)
        .json({ error: 'Query parameters "field" and "value" are required.' });
    }
    const pkgs = await packageModel.getPublicPackagesByField(field, value);
    res.json(pkgs);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}

/**
 * Update a package by ID – Admin only.
 */
async function updatePackage(req, res) {
  try {
    const { id } = req.params;
    const updated = await packageModel.updatePackage(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Package not found.' });
    }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}

/**
 * Deactivate a package by ID – Admin only.
 */
async function deactivatePackage(req, res) {
  try {
    const { id } = req.params;
    const deactivated = await packageModel.deactivatePackage(id);
    if (!deactivated) {
      return res.status(404).json({ error: 'Package not found or already inactive.' });
    }
    res.json(deactivated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to deactivate package.' });
  }
}

/**
 * Reactivate a package by ID – Admin only.
 */
async function reactivatePackage(req, res) {
  try {
    const { id } = req.params;
    const reactivated = await packageModel.reactivatePackage(id);
    if (!reactivated) {
      return res
        .status(400)
        .json({ error: 'Package not found or already active.' });
    }
    res.json(reactivated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reactivate package.' });
  }
}

module.exports = {
  createPackage,
  getAllPackages,
  getPublicPackages,
  getPackagesByField,
  getPublicPackagesByField,
  updatePackage,
  deactivatePackage,
  reactivatePackage,
};
