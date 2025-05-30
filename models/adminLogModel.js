/** @typedef {import('../types/types').AdminLog} AdminLog */

const pool = require('../config/db');

/**
 * Create a log entry
 * @param {AdminLog} log
 * @returns {Promise<AdminLog>}
 */
async function createLog(log) {
  const { admin_id, action_type, description } = log;

  const res = await pool.query(
    `INSERT INTO admin_logs (admin_id, action_type, description)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [admin_id, action_type, description]
  );

  return res.rows[0];
}

/**
 * Get all admin logs
 * @returns {Promise<AdminLog[]>}
 */
async function getAllLogs() {
  const res = await pool.query(
    'SELECT * FROM admin_logs ORDER BY logged_at DESC'
  );
  return res.rows;
}

/**
 * Get logs for a specific admin
 * @param {string} admin_id
 * @returns {Promise<AdminLog[]>}
 */
async function getLogsByAdmin(admin_id) {
  const res = await pool.query(
    'SELECT * FROM admin_logs WHERE admin_id = $1 ORDER BY logged_at DESC',
    [admin_id]
  );
  return res.rows;
}

module.exports = {
  createLog,
  getAllLogs,
  getLogsByAdmin
};
