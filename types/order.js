// types/order.js

/**
 * @typedef {Object} Order
 * @property {string} [id]
 * @property {string} user_id
 * @property {string} package_id
 * @property {string} [payment_gateway]
 * @property {string} payment_id
 * @property {number} amount_paid
 * @property {string} [currency]
 * @property {'pending'|'paid'|'failed'|'refunded'} payment_status
 * @property {string} [purchased_at]
 * @property {string} [access_expires_at]
 * @property {string} [updated_at]
 */
