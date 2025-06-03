// controllers/blogController.js
const blogModel = require('../models/blogModel');

/**
 * Create a new blog (draft or published)
 */
async function createBlog(req, res) {
  try {
    const { author_id, title, slug, summary, content, media_cid, status, published_at } = req.body;
    const newBlog = await blogModel.createBlog({
      author_id,
      title,
      slug,
      summary,
      content,
      media_cid,
      status,
      published_at
    });
    res.status(201).json(newBlog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create blog.' });
  }
}

/**
 * Get all blogs (no status filter) – admin only
 */
async function getAllBlogs(req, res) {
  try {
    const blogs = await blogModel.getAllBlogs();
    res.json(blogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch blogs.' });
  }
}

/**
 * Get a single blog by ID.
 * If admin=false, only returns when status='published' and not deleted.
 */
async function getBlogById(req, res) {
  try {
    const { id } = req.params;
    const admin = req.user.role=='admin' ? true : false;
    const blog = await blogModel.getBlogById(id, { admin });
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found or not published.' });
    }
    res.json(blog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch blog.' });
  }
}

/**
 * Get blogs by arbitrary field (slug or author_id).
 * If admin=false, only returns published blogs.
 */
async function getBlogByField(req, res) {
  try {
    const { field, value } = req.query;
    if (!field || !value) {
      return res
        .status(400)
        .json({ error: 'Query parameters "field" and "value" are required.' });
    }
    const admin = req.user.role=='admin' ? true : false;
    const blogs = await blogModel.getBlogByField(field, value, { admin });
    res.json(blogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch blogs by field.' });
  }
}

/**
 * Get all published blogs for public
 */
async function getPublicBlogs(req, res) {
  try {
    const blogs = await blogModel.getPublicBlogs();
    res.json(blogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch public blogs.' });
  }
}

/**
 * Edit a single blog by ID
 */
async function editBlog(req, res) {
  try {
    const id = req.params.id;
    const updatedBlog = await blogModel.editBlog(id, req.body);
    if (!updatedBlog) {
      return res.status(404).json({ error: 'Blog not found.' });
    }
    res.json(updatedBlog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update blog.' });
  }
}

/**
 * Archive multiple blogs by IDs
 */
async function archiveBlogsBatch(req, res) {
  try {
    const { ids } = req.body; // expecting { ids: [ 'uuid1', 'uuid2', ... ] }
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required.' });
    }
    await blogModel.archiveBlogsBatch(ids);
    res.json({ message: 'Blogs archived successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to archive blogs.' });
  }
}

/**
 * Reactivate an archived blog by ID
 */
async function reactivateBlog(req, res) {
  try {
    const { id } = req.params;
    const reactivated = await blogModel.reactivateBlog(id);
    if (!reactivated) {
      return res
        .status(400)
        .json({ error: 'Blog not found or not archived.' });
    }
    res.json(reactivated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reactivate blog.' });
  }
}

module.exports = {
  createBlog,
  getAllBlogs,
  getBlogById,
  getBlogByField,
  getPublicBlogs,
  editBlog,
  archiveBlogsBatch,
  reactivateBlog,
};
