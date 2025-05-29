// controllers/blogController.js
const { createBlog, getAllBlogs, updateBlog } = require('../models/blogModel');

exports.saveBlog = async (req, res, next) => {
  try {
    const saved = await createBlog(req.body);
    res.status(201).json(saved);
  } catch (err) { next(err); }
};

exports.getBlogs = async (req, res, next) => {
  try {
    const list = await getAllBlogs();
    res.json(list);
  } catch (err) { next(err); }
};

exports.updateBlog = async (req, res, next) => {
  try {
    const updated = await updateBlog(Number(req.params.id), req.body);
    res.json(updated);
  } catch (err) { next(err); }
};