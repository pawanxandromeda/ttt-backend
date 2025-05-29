// models/eventModel.js
const pool = require('../config/db');

async function createEvent(data) {
  const res = await pool.query(
    'INSERT INTO events (data) VALUES ($1) RETURNING *',
    [data]
  );
  return res.rows[0];
}

async function getAllEvents() {
  const res = await pool.query('SELECT * FROM events ORDER BY id');
  return res.rows;
}

async function updateEvent(id, data) {
  const res = await pool.query(
    'UPDATE events SET data = $1 WHERE id = $2 RETURNING *',
    [data, id]
  );
  return res.rows[0];
}

module.exports = { createEvent, getAllEvents, updateEvent };