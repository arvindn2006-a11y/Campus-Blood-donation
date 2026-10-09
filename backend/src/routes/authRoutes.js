const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Real-Time OTP Routes
router.post('/send-otp', authController.handleSendOtp);
router.post('/verify-otp', authController.handleVerifyOtp);
router.post('/phone-login', authController.handlePhoneLogin);

// Core Auth Routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/admin/login', authController.adminLogin);

// Google OAuth Routes
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleAuthCallback);

// SMS & Audit Logs
router.get('/sms-logs', verifyToken, requireRole(['ADMIN']), authController.getSmsLogs);

module.exports = router;

