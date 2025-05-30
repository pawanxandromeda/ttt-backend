/** @typedef {import('../types/types').User} User */

const pool = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * Create a user with hashed password
 * @param {string} username
 * @param {string} password
 * @param {'user'|'admin'} [role]
 * @returns {Promise<User>}
 */
const createUser = async (username, password, role = 'user') => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const email = `${username}@example.com`;
  const res = await pool.query(
    `INSERT INTO users (username, email, password_hash, role, oauth_provider)
     VALUES ($1, $2, $3, $4, 'local')
     RETURNING id, username, email, role`,
    [username, email, hashedPassword, role]
  );
  return res.rows[0];
};

/**
 * @param {string} username
 * @returns {Promise<User>}
 */
const getUserByUsername = async (username) => {
  const res = await pool.query(
    'SELECT * FROM users WHERE username = $1 AND oauth_provider = $2',
    [username, 'local']
  );
  return res.rows[0];
};

/** @returns {Promise<User[]>} */
const getAllUsers = async () => {
  const res = await pool.query('SELECT id, username, email, role FROM users');
  return res.rows;
};

/**
 * @param {string} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  const res = await pool.query('SELECT id, username, email, role FROM users WHERE id = $1', [id]);
  return res.rows[0];
};

/**
 * @param {string} provider
 * @param {string} providerId
 * @returns {Promise<User>}
 */
const getUserByOAuthId = async (provider, providerId) => {
  const res = await pool.query(
    'SELECT * FROM users WHERE oauth_provider = $1 AND oauth_provider_id = $2',
    [provider, providerId]
  );
  return res.rows[0];
};

/**
 * @param {{ email: string, name: string, provider: string, providerId: string }} data
 * @returns {Promise<User>}
 */
const createUserFromOAuth = async ({ email, name, provider, providerId }) => {
  const username = email.split('@')[0];
  const res = await pool.query(
    `INSERT INTO users (username, email, oauth_provider, oauth_provider_id, role)
     VALUES ($1, $2, $3, $4, 'user')
     RETURNING *`,
    [username, email, provider, providerId]
  );
  return res.rows[0];
};

/**
 * @param {string} id
 * @param {Partial<User>} data
 * @returns {Promise<User>}
 */
const updateUser = async (id, { username, password, role }) => {
  const updates = [];
  const params = [];
  let idx = 1;

  if (username) {
    updates.push(`username = $${idx++}`);
    params.push(username);
  }
  if (password) {
    const hashed = await bcrypt.hash(password, 10);
    updates.push(`password_hash = $${idx++}`);
    params.push(hashed);
  }
  if (role) {
    updates.push(`role = $${idx++}`);
    params.push(role);
  }

  if (!updates.length) return getUserById(id);

  const query = `
    UPDATE users
    SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${idx}
    RETURNING id, username, email, role
  `;
  params.push(id);

  const res = await pool.query(query, params);
  return res.rows[0];
};

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
const deleteUser = async (id) => {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
};

module.exports = {
  createUser,
  getUserByUsername,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserByOAuthId,
  createUserFromOAuth,
};
