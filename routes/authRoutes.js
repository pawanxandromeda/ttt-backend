// routes/authRoutes.js
const router = require('express').Router();
const ctrl   = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware')

router.post('/login',   ctrl.login);
router.post('/oAuth-login', ctrl.googleLogin)
router.post('/refresh', ctrl.refresh);
router.post('/logout',  authMiddleware, ctrl.logout);

module.exports = router;
