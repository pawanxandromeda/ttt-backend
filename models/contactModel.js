/** @typedef {import('../types/types').Contact} Contact */

const pool = require('../config/db');

/**
 * Create a new contact entry
 * @param {Contact} data
 * @returns {Promise<Contact>}
 */
async function createContact(data) {
  const {
    user_id = null,
    name,
    email,
    country_code,
    phone_number,
    subject,
    message
  } = data;

  const res = await pool.query(
    `INSERT INTO contacts (
      user_id, name, email, country_code,
      phone_number, subject, message
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [user_id, name, email, country_code, phone_number, subject, message]
  );
  return res.rows[0];
}

/**
 * Retrieve all contact entries
 * @returns {Promise<Contact[]>}
 */
async function getAllContacts() {
  const res = await pool.query('SELECT * FROM contacts ORDER BY submitted_at DESC');
  return res.rows;
}

/**
 * Update a contact record
 * @param {string} id
 * @param {Partial<Contact>} data
 * @returns {Promise<Contact>}
 */
async function updateContact(id, data) {
  const { status, message } = data;

  const res = await pool.query(
    `UPDATE contacts SET
      status = COALESCE($1, status),
      message = COALESCE($2, message),
      updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [status, message, id]
  );
  return res.rows[0];
}

module.exports = {
  createContact,
  getAllContacts,
  updateContact
};
