/** @typedef {import('../types/types').Registration} Registration */

// models/registrationModel.js
const pool = require('../config/db');

/**
 * @param {Registration} data
 * @returns {Promise<Registration>}
 */
async function createRegistration(data) {
  const {
    event_id,
    user_id = null,
    attendee_name = null,
    attendee_email,
    phone_number = null,
    package_id,
    order_id = null,
    status = 'registered',
    waitlist_position = null,
  } = data;

  const res = await pool.query(
    `
    INSERT INTO event_registrations (
      event_id, user_id, attendee_name, attendee_email, phone_number,
      package_id, order_id, status, waitlist_position, registration_token
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, gen_random_uuid())
    RETURNING *;
  `,
    [
      event_id,
      user_id,
      attendee_name,
      attendee_email,
      phone_number,
      package_id,
      order_id,
      status,
      waitlist_position,
    ]
  );
  return res.rows[0];
}

/**
 * Generic field-based fetch (e.g. by id, event_id, package_id, status).
 * @param {string} field - Column name to filter by
 * @param {any} value
 * @returns {Promise<Registration[]>}
 */
async function getRegistrationsByField(field, value) {
  // Whitelist valid columns
  const validFields = [
    'id',
    'event_id',
    'package_id',
    'status',
    'attendee_email',
    'registration_token',
    'user_id',
  ];
  if (!validFields.includes(field)) {
    throw new Error(`Invalid field: ${field}`);
  }
  const res = await pool.query(
    `
    SELECT * FROM event_registrations
     WHERE ${field} = $1
     ORDER BY registered_at DESC;
  `,
    [value]
  );
  return res.rows;
}

/**
 * Update arbitrary fields of a registration by its ID.
 * Only allows updating fields in the whitelist.
 *
 * @param {string} id
 * @param {Object} data - e.g. { status: 'cancelled', cancelled_at: '…' }
 * @returns {Promise<Registration>}
 */
async function updateRegistration(id, data) {
  const allowedKeys = [
    'status',
    'cancelled_at',
    'attendee_name',
    'attendee_email',
    'phone_number',
    'order_id',
    'waitlist_position',
  ];

  const fields = [];
  const values = [];
  let idx = 1;

  for (const key of allowedKeys) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${idx}`);
      values.push(data[key]);
      idx++;
    }
  }

  if (fields.length === 0) {
    throw new Error('No valid fields to update.');
  }

  values.push(id);
  const res = await pool.query(
    `
    UPDATE event_registrations
       SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${idx}
     RETURNING *;
  `,
    values
  );
  return res.rows[0];
}

/**
 * Cancel a registration by its token (set status='cancelled' and cancelled_at=NOW()).
 * @param {string} token
 * @returns {Promise<Registration|null>}
 */
async function cancelByToken(token) {
  const res = await pool.query(
    `
    UPDATE event_registrations
       SET status = 'cancelled',
           cancelled_at = NOW(),
           updated_at = NOW()
     WHERE registration_token = $1
     RETURNING *;
  `,
    [token]
  );
  return res.rows[0] || null;
}

/**
 * @param {string} userId
 * @returns {Promise<Registration[]>}
 */
async function getRegistrationsByUserId(userId) {
  const res = await pool.query(
    `
    SELECT * FROM event_registrations
     WHERE user_id = $1
     ORDER BY registered_at DESC;
  `,
    [userId]
  );
  return res.rows;
}

/**
 * Promote the next waitlisted registration for a given package to 'registered'.
 * @param {string} packageId
 * @returns {Promise<Registration|null>} - The promoted registration, or null if no one is waitlisted.
 */
async function promoteNextWaitlisted(packageId) {
  const res = await pool.query(
    `
    WITH next_wait AS (
      SELECT id
        FROM event_registrations
       WHERE package_id = $1
         AND status = 'waitlisted'
       ORDER BY waitlist_position ASC
       LIMIT 1
    )
    UPDATE event_registrations er
       SET status = 'registered',
           waitlist_position = NULL,
           updated_at = NOW()
      FROM next_wait nw
     WHERE er.id = nw.id
     RETURNING er.*;
  `,
    [packageId]
  );
  return res.rows[0] || null;
}

/**
 * Count registrations for a given package by status.
 * @param {string} packageId
 * @param {'registered'|'waitlisted'} status
 * @returns {Promise<number>}
 */
async function countByPackageAndStatus(packageId, status) {
  const res = await pool.query(
    `
    SELECT COUNT(*)::int AS cnt
      FROM event_registrations
     WHERE package_id = $1
       AND status = $2;
  `,
    [packageId, status]
  );
  return res.rows[0].cnt;
}

module.exports = {
  createRegistration,
  getRegistrationsByField,
  updateRegistration,
  cancelByToken,
  getRegistrationsByUserId,
  promoteNextWaitlisted,
  countByPackageAndStatus,
};
