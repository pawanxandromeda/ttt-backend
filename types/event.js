
/**
 * @typedef {Object} Event
 * @property {string} id - UUID of the event
 * @property {string} created_by - UUID of the admin creator
 * @property {string} [title] - Event title (required when publishing)
 * @property {string} [slug] - URL-friendly slug (unique, required when publishing)
 * @property {string} [description] - Full event description
 * @property {string} [location] - Free-text location (required when publishing)
 * @property {string} [start_time] - Event start timestamp (required when publishing)
 * @property {string} [end_time] - Event end timestamp
 * @property {string} [registration_deadline] - Registration deadline timestamp
 * @property {string[]} packages_ids - Array of ticket-package UUIDs
 * @property {boolean} payment_required - True if event is paid-only
 * @property {'draft'|'published'|'cancelled'|'completed'} status - Current event status
 * @property {string} [published_at] - Timestamp when published
 * @property {string} [cancelled_at] - Timestamp when cancelled
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 * @property {string} [deleted_at] - Soft-delete marker
 */
