const express       = require('express');
const router        = express.Router();
const userController          = require('../controllers/userController');
const authMiddleware= require('../middleware/authMiddleware');
const checkRole     = require('../middleware/roleMiddleware');

// Public
router.post('/register', userController.register);
router.post('/forgot-password', userController.forgotPassword);


// Protected
router.get(   '/',        authMiddleware, checkRole('admin'), userController.getAllUsers);
router.get(   '/me',      authMiddleware,                    userController.getMe);
router.get(   '/:id',     authMiddleware, checkRole('admin'), userController.getUserById);
router.put(   '/:id',     authMiddleware,                    userController.updateUser);
router.delete('/:id',     authMiddleware, checkRole('admin'), userController.deleteUser);

module.exports = router;
