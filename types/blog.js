/**
 * @typedef {Object} Blog
 * @property {string} id - UUID of the blog
 * @property {string} author_id - UUID of the author (must be an admin)
 * @property {string} [title] - Blog title (required when publishing)
 * @property {string} [slug] - URL-friendly slug (unique, required when publishing)
 * @property {string} [summary] - Short excerpt
 * @property {string} [content] - Full HTML/Markdown
 * @property {string} [media_cid] - IPFS CID for associated video
 * @property {'draft'|'published'|'archived'} status - Current status
 * @property {number} views_count - Number of public views
 * @property {string} [published_at] - Timestamp when published
 * @property {string} [deleted_at] - Timestamp when archived
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */