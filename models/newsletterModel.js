// models/newsletterModel.js
const pool = require('../config/db');

async function subscribeNewsletter(data) {
  const res = await pool.query(
    'INSERT INTO newsletter_subscriptions (data) VALUES ($1) RETURNING *',
    [data]
  );
  return res.rows[0];
}

async function getAllSubscriptions() {
  const res = await pool.query('SELECT * FROM newsletter_subscriptions ORDER BY id');
  return res.rows;
}

async function updateSubscription(id, data) {
  const res = await pool.query(
    'UPDATE newsletter_subscriptions SET data = $1 WHERE id = $2 RETURNING *',
    [data, id]
  );
  return res.rows[0];
}

module.exports = { subscribeNewsletter, getAllSubscriptions, updateSubscription };