// models/userModel.js
const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Create
const createUser = async (username, password, role = 'user') => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const res = await pool.query(
    `INSERT INTO users (username, password, role)
     VALUES ($1, $2, $3)
     RETURNING id, username, role`,
    [username, hashedPassword, role]
  );
  return res.rows[0];
};

// Read by username
const getUserByUsername = async (username) => {
  const res = await pool.query(
    'SELECT * FROM users WHERE username = $1',
    [username]
  );
  return res.rows[0];
};

// Read all users
const getAllUsers = async () => {
  const res = await pool.query(
    'SELECT id, username, role FROM users'
  );
  return res.rows;
};

// Read by id
const getUserById = async (id) => {
  const res = await pool.query(
    'SELECT id, username, role FROM users WHERE id = $1',
    [id]
  );
  return res.rows[0];
};

// Update (username, password, role)
const updateUser = async (id, { username, password, role }) => {
  const updates = [];
  const params  = [];
  let idx       = 1;

  if (username) {
    updates.push(`username = $${idx++}`);
    params.push(username);
  }
  if (password) {
    const hashed = await bcrypt.hash(password, 10);
    updates.push(`password = $${idx++}`);
    params.push(hashed);
  }
  if (role) {
    updates.push(`role = $${idx++}`);
    params.push(role);
  }

  if (!updates.length) return getUserById(id);

  const query = `
    UPDATE users
    SET ${updates.join(', ')}
    WHERE id = $${idx}
    RETURNING id, username, role
  `;
  params.push(id);

  const res = await pool.query(query, params);
  return res.rows[0];
};

// Delete
const deleteUser = async (id) => {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
  return;
};

module.exports = {
  createUser,
  getUserByUsername,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};
