const express = require('express');
const multer = require('multer');
const { create } = require('ipfs-http-client');
require('dotenv').config({ path: '.env.local' });
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const projectId = process.env.INFURA_PROJECT_ID;
const projectSecret = process.env.INFURA_PROJECT_SECRET;
const auth =
  'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

const ipfs = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth,
  },
});

router.post(
  '/upload-image',
  authMiddleware,
  upload.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      // Add file to IPFS
      const { cid } = await ipfs.add(req.file.buffer);
      res.json({ cid: cid.toString() });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
