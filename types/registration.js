/**
 * @typedef {Object} Registration
 * @property {string} id - UUID of the registration
 * @property {string} event_id - UUID of the parent event
 * @property {string} [user_id] - UUID of the logged-in user (nullable)
 * @property {string} [attendee_name] - Name of attendee (required if user_id is null)
 * @property {string} attendee_email - Email of attendee
 * @property {string} [phone_number] - Optional phone number
 * @property {string} package_id - UUID of the chosen ticket package
 * @property {string} [order_id] - UUID of the related order (nullable for free tickets)
 * @property {'registered'|'waitlisted'|'cancelled'|'attended'|'no_show'} status - Registration status
 * @property {string} registered_at - Timestamp of registration
 * @property {string} [cancelled_at] - Timestamp when cancelled
 * @property {number} [waitlist_position] - Position if waitlisted
 * @property {string} registration_token - UUID token for one-click cancellation
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */
