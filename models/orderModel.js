// models/orderModel.js

/** @typedef {import('../types/types').Order} Order */

const pool = require('../config/db');

/**
 * Create a new order
 * @param {Order} orderData
 * @returns {Promise<Order>}
 */
async function createOrder(orderData) {
  const {
    user_id,
    package_id,
    payment_gateway = 'razorpay',
    payment_id,
    amount_paid,
    currency = 'INR',
    payment_status,
    access_expires_at = null
  } = orderData;

  const res = await pool.query(
    `INSERT INTO orders (
      user_id, package_id, payment_gateway,
      payment_id, amount_paid, currency,
      payment_status, access_expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [user_id, package_id, payment_gateway, payment_id, amount_paid, currency, payment_status, access_expires_at]
  );

  return res.rows[0];
}

/**
 * Get all orders
 * @returns {Promise<Order[]>}
 */
async function getAllOrders() {
  const res = await pool.query('SELECT * FROM orders ORDER BY purchased_at DESC');
  return res.rows;
}

/**
 * Get order by ID
 * @param {string} id
 * @returns {Promise<Order>}
 */
async function getOrderById(id) {
  const res = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
  return res.rows[0];
}

/**
 * Update an order (admin use)
 * @param {string} id
 * @param {Partial<Order>} updates
 * @returns {Promise<Order>}
 */
async function updateOrder(id, updates) {
  const fields = [];
  const values = [];
  let i = 1;

  for (const key in updates) {
    fields.push(`${key} = $${i++}`);
    values.push(updates[key]);
  }

  if (fields.length === 0) return getOrderById(id);

  values.push(id);

  const res = await pool.query(
    `UPDATE orders SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${i} RETURNING *`,
    values
  );

  return res.rows[0];
}

/**
 * Update only the payment_status (with optional validation)
 * @param {string} orderId
 * @param {'pending'|'paid'|'failed'|'refunded'} newStatus
 * @returns {Promise<Order>}
 */
async function updatePaymentStatus(orderId, newStatus) {
  const current = await getOrderById(orderId);
  if (!current) throw new Error('Order not found');

  const validTransitions = {
    pending: ['paid', 'failed'],
    paid: ['refunded'],
    failed: [],
    refunded: []
  };

  const allowed = validTransitions[current.payment_status] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid transition from ${current.payment_status} to ${newStatus}`);
  }

  const res = await pool.query(
    `UPDATE orders
     SET payment_status = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [newStatus, orderId]
  );

  return res.rows[0];
}


module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  updatePaymentStatus
};
