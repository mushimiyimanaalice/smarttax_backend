// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('fullName').notEmpty(),
  body('phoneNumber').notEmpty()
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);
router.get('/my-businesses', protect, authController.getMyBusinesses);
router.patch('/active-business', protect, authController.setActiveBusiness);
router.patch('/preferred-language', protect, authController.setPreferredLanguage);
router.post('/logout', authController.logout);
router.post('/change-password', protect, authController.changePassword);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;