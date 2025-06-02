/**
 * @typedef {Object} Package
 * @property {string} id - UUID
 * @property {string} name - Package name (e.g. “Basic Subscription” or “VIP Ticket”)
 * @property {string} slug - Unique slug for SEO/URL
 * @property {string} [description] - Optional human-readable description
 * @property {number} price - Decimal price (e.g. 999.00)
 * @property {number} duration_days - For subscription packages, length in days (0 for event tickets)
 * @property {boolean} is_active - Whether this package is currently available
 * @property {'subscription'|'event'} package_type - “subscription” or “event”
 * @property {string|null} event_id - UUID of parent event (required when package_type='event')
 * @property {number|null} capacity - Max seats (only for event packages)
 * @property {string|null} package_registration_deadline - Timestamp by which users must register for this package
 * @property {string} created_at - Timestamp when row was created
 * @property {string} updated_at - Timestamp when row was last updated
 */