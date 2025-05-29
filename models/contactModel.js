// models/contactModel.js
const pool = require('../config/db');

async function createContact(data) {
  const res = await pool.query(
    'INSERT INTO contacts (data) VALUES ($1) RETURNING *',
    [data]
  );
  return res.rows[0];
}

async function getAllContacts() {
  const res = await pool.query('SELECT * FROM contacts ORDER BY id');
  return res.rows;
}

async function updateContact(id, data) {
  const res = await pool.query(
    'UPDATE contacts SET data = $1 WHERE id = $2 RETURNING *',
    [data, id]
  );
  return res.rows[0];
}

module.exports = { createContact, getAllContacts, updateContact };