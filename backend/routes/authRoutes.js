/**
 * PixxTech Central Portal - Authentication Routes
 * Phase 3: Central Authentication & Account Management
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { rateLimit } = require('express-rate-limit');

// Rate limiting for login attempts to prevent brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 15, // 15 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

// Strict rate limiter for system bootstrap attempts
const bootstrapLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many bootstrap attempts from this IP address. Please try again later.',
  },
});

// Rate limiter for password changes
const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password update requests. Please wait before retrying.',
  },
});

// Authentication endpoints
router.post('/login', loginLimiter, authController.login);
router.get('/me', requireAuth, authController.getMe);
router.post('/logout', authController.logout);
router.post('/change-password', requireAuth, passwordLimiter, authController.changePassword);

// First-time protected bootstrap endpoint (permanently self-disabling once Boss is created)
router.post('/bootstrap', bootstrapLimiter, authController.bootstrapAdmin);

module.exports = router;
