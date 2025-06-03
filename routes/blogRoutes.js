// routes/blogRoutes.js
const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

/**
 * @route POST /blogs
 * @desc Create a new blog (draft or published)
 * @access Admin only
 */
router.post('/', authMiddleware, checkRole('admin'), blogController.createBlog);

/**
 * @route GET /blogs
 * @desc Get all blogs (admin only, includes drafts/archived)
 * @access Admin
*/
router.get('/', authMiddleware, checkRole('admin'), blogController.getAllBlogs);

/**
 * @route GET /blogs/search?field=slug&value=some-slug
 * @desc Get blogs by arbitrary field (slug or author_id)
 * @access Public (published) or Admin
 */
router.get('/search', (req, res, next) => {
    const auth = req.header('Authorization') || '';
    if (auth.startsWith('Bearer ')) {
      return authMiddleware(req, res, next);
    }
    next();
  }, blogController.getBlogByField);

/**
 * @route GET /blogs/public
 * @desc Get all published blogs for public
 * @access Public
 */
router.get('/list', blogController.getPublicBlogs);

/**
 * @route GET /blogs/:id
 * @desc Get a single blog by ID (published for public, any status for admin)
 * @access Public (published) or Admin (any)
 */
router.get('/:id', (req, res, next) => {
    const auth = req.header('Authorization') || '';
    if (auth.startsWith('Bearer ')) {
      return authMiddleware(req, res, next);
    }
    next();
  }, blogController.getBlogById);

/**
 * @route PUT /blogs/:id
 * @desc Edit a single blog
 * @access Admin only
 */
router.put('/:id',  authMiddleware, checkRole('admin'), blogController.editBlog);

/**
 * @route PUT /blogs/archive
 * @desc Archive multiple blogs by IDs
 * @body { string[] } ids
 * @access Admin only
 */
router.put('/archive',  authMiddleware, checkRole('admin'), blogController.archiveBlogsBatch);

/**
 * @route PUT /blogs/:id/reactivate
 * @desc Reactivate an archived blog
 * @access Admin only
 */
router.put('/:id/reactivate',  authMiddleware, checkRole('admin'), blogController.reactivateBlog);


module.exports = router;
