/** @typedef {import('../types/types').AdminLog} AdminLog */

const {
    createLog,
    getAllLogs,
    getLogsByAdmin
  } = require('../models/adminLogModel');
  
  exports.saveLog = async (req, res, next) => {
    try {
      const { action_type, description } = req.body;
      const admin_id = req.user.sub;
  
      const log = await createLog({ admin_id, action_type, description });
      res.status(201).json(log);
    } catch (err) {
      next(err);
    }
  };
  
  exports.getAllLogs = async (req, res, next) => {
    try {
      const logs = await getAllLogs();
      res.json(logs);
    } catch (err) {
      next(err);
    }
  };
  
  exports.getLogsByAdmin = async (req, res, next) => {
    try {
      const logs = await getLogsByAdmin(req.params.adminId);
      res.json(logs);
    } catch (err) {
      next(err);
    }
  };
  