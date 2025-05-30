// controllers/packageController.js

const {
    createPackage,
    getAllPackages,
    getPackageById,
    updatePackage
  } = require('../models/packageModel');
  
  exports.savePackage = async (req, res, next) => {
    try {
      const saved = await createPackage(req.body);
      res.status(201).json(saved);
    } catch (err) {
      next(err);
    }
  };
  
  exports.getPackages = async (req, res, next) => {
    try {
      const list = await getAllPackages();
      res.json(list);
    } catch (err) {
      next(err);
    }
  };
  
  exports.getPackageById = async (req, res, next) => {
    try {
      const found = await getPackageById(req.params.id);
      if (!found) return res.status(404).json({ message: 'Package not found' });
      res.json(found);
    } catch (err) {
      next(err);
    }
  };

  exports.updatePackage = async (req, res, next) => {
    try {
      const updated = await updatePackage(req.params.id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  };
  