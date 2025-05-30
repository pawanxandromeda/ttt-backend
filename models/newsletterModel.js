/** @typedef {import('../types/types').NewsletterSubscription} NewsletterSubscription */

const pool = require('../config/db');

/**
 * Add a new subscription
 * @param {NewsletterSubscription} data
 * @returns {Promise<NewsletterSubscription>}
 */
async function subscribeNewsletter(data) {
  const { email, is_verified = false, unsubscribe_token = null } = data;

  const res = await pool.query(
    `INSERT INTO newsletter_subscriptions (email, is_verified, unsubscribe_token)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [email, is_verified, unsubscribe_token]
  );

  return res.rows[0];
}

/**
 * Get all newsletter subscriptions (admin)
 * @returns {Promise<NewsletterSubscription[]>}
 */
async function getAllSubscriptions() {
  const res = await pool.query('SELECT * FROM newsletter_subscriptions ORDER BY subscribed_at DESC');
  return res.rows;
}

/**
 * Handle verification or unsubscribe via token
 * @param {string} token
 * @returns {Promise<NewsletterSubscription | null>}
 */
async function processUnsubscribeToken(token) {
  const res = await pool.query(
    'SELECT * FROM newsletter_subscriptions WHERE unsubscribe_token = $1',
    [token]
  );

  const sub = res.rows[0];
  if (!sub) return null;

  if (!sub.is_verified) {
    // First time use — verify
    const verified = await pool.query(
      `UPDATE newsletter_subscriptions
       SET is_verified = true,
           subscribed_at = CURRENT_TIMESTAMP
       WHERE unsubscribe_token = $1
       RETURNING *`,
      [token]
    );
    return verified.rows[0];
  } else {
    // Already verified — now unsubscribe
    const unsub = await pool.query(
      `DELETE FROM newsletter_subscriptions
       WHERE unsubscribe_token = $1
       RETURNING *`,
      [token]
    );
    return unsub.rows[0];
  }
}

module.exports = {
  subscribeNewsletter,
  getAllSubscriptions,
  processUnsubscribeToken
};
