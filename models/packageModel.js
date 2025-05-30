/** @typedef {import('../types/types').Package} Package */

const pool = require('../config/db');

/**
 * Create a package
 * @param {Package} data
 * @returns {Promise<Package>}
 */
async function createPackage(data) {
  const { name, slug, description, price, duration_days, is_active = true } = data;

  const res = await pool.query(
    `INSERT INTO packages (
      name, slug, description, price, duration_days, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [name, slug, description, price, duration_days, is_active]
  );

  return res.rows[0];
}

/**
 * Get all packages
 * @returns {Promise<Package[]>}
 */
async function getAllPackages() {
  const res = await pool.query('SELECT * FROM packages ORDER BY created_at DESC');
  return res.rows;
}

/**
 * Get package by ID
 * @param {string} id
 * @returns {Promise<Package>}
 */
async function getPackageById(id) {
  const res = await pool.query('SELECT * FROM packages WHERE id = $1', [id]);
  return res.rows[0];
}

/**
 * Update a package
 * @param {string} id
 * @param {Partial<Package>} updates
 * @returns {Promise<Package>}
 */
async function updatePackage(id, updates) {
  const fields = [];
  const values = [];
  let i = 1;

  for (const key in updates) {
    fields.push(`${key} = $${i++}`);
    values.push(updates[key]);
  }

  if (fields.length === 0) return getPackageById(id);
  values.push(id);

  const res = await pool.query(
    `UPDATE packages SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${i}
     RETURNING *`,
    values
  );

  return res.rows[0];
}

module.exports = {
  createPackage,
  getAllPackages,
  getPackageById,
  updatePackage
};
