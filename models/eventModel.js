// models/eventModel.js

/** @typedef {import('../types/types').Event} Event */

const pool = require('../config/db');

/**
 * @param {Event} data
 * @returns {Promise<Event>}
 */
async function createEvent(data) {
  const {
    created_by,
    title = null,
    slug = null,
    description = null,
    location = null,
    start_time = null,
    end_time = null,
    registration_deadline = null,
    payment_required = false,
  } = data;
  const res = await pool.query(
    `
    INSERT INTO events (
      created_by, title, slug, description, location,
      start_time, end_time, registration_deadline, payment_required
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *;
  `,
    [
      created_by,
      title,
      slug,
      description,
      location,
      start_time,
      end_time,
      registration_deadline,
      payment_required,
    ]
  );
  return res.rows[0];
}

/**
 * Get events filtered by status.
 * @param {'draft'|'published'|'cancelled'|'completed'} status
 * @returns {Promise<Event[]>}
 */
async function getEventsByStatus(status) {
  const res = await pool.query(
    `
    SELECT * FROM events
     WHERE status = $1
     ORDER BY start_time ASC;
  `,
    [status]
  );
  return res.rows;
}

/**
 * @param {string} id
 * @param {Object} data - Fields to update (any of the event columns)
 * @returns {Promise<Event>}
 */
async function updateEvent(id, data) {
  const fields = [];
  const values = [];
  let idx = 1;
  for (const key of [
    'title',
    'slug',
    'description',
    'location',
    'start_time',
    'end_time',
    'registration_deadline',
    'payment_required',
    'status',
    'cancelled_at',
  ]) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${idx}`);
      values.push(data[key]);
      idx++;
    }
  }
  if (fields.length === 0) {
    throw new Error('No fields to update');
  }
  values.push(id);
  const res = await pool.query(
    `
    UPDATE events
       SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${idx}
     RETURNING *;
  `,
    values
  );
  return res.rows[0];
}

/**
 * Batch update events (e.g. bulk publish or cancel).
 * @param {string[]} ids
 * @param {Object} data - Fields to set on all given IDs (e.g. { status: 'cancelled', cancelled_at: '...' })
 * @returns {Promise<void>}
 */
async function batchUpdateEvents(ids, data) {
  if (!ids || ids.length === 0) return;
  const setters = [];
  const values = [];
  let idx = 1;
  for (const key of [
    'title',
    'slug',
    'description',
    'location',
    'start_time',
    'end_time',
    'registration_deadline',
    'payment_required',
    'status',
    'cancelled_at',
  ]) {
    if (data[key] !== undefined) {
      setters.push(`${key} = $${idx}`);
      values.push(data[key]);
      idx++;
    }
  }
  setters.push(`updated_at = NOW()`);
  const placeholders = ids.map((_, i) => `$${idx + i}`).join(', ');
  values.push(...ids);
  await pool.query(
    `
    UPDATE events
       SET ${setters.join(', ')}
     WHERE id IN (${placeholders});
  `,
    values
  );
}

/**
 * Reactivate a soft-deleted (deleted_at NOT NULL) event.
 * Clears deleted_at and sets status='published'.
 * @param {string} id
 * @returns {Promise<Event|null>}
 */
async function reactivateEvent(id) {
  const res = await pool.query(
    `
    UPDATE events
       SET status = 'published',
           deleted_at = NULL,
           updated_at = NOW()
     WHERE id = $1
       AND deleted_at IS NOT NULL
     RETURNING *;
  `,
    [id]
  );
  return res.rows[0] || null;
}

/**
 * Fetch only published events (public).
 * @returns {Promise<Event[]>}
 */
async function getPublishedEvents() {
  const res = await pool.query(
    `
    SELECT * FROM events
     WHERE status = 'published'
       AND deleted_at IS NULL
     ORDER BY start_time ASC;
  `
  );
  return res.rows;
}

module.exports = {
  createEvent,
  getEventsByStatus,
  updateEvent,
  batchUpdateEvents,
  reactivateEvent,
  getPublishedEvents
};
