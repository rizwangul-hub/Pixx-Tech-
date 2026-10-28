const express = require('express');
const router = express.Router();
const ssoController = require('../controllers/ssoController');
const { requireAuth } = require('../middleware/auth');
const { rateLimit } = require('express-rate-limit');

const ssoInitiateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes window
  max: 30, // 30 launches per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many SSO launch requests. Please wait a few minutes before launching another application.',
  },
});

// POST /api/sso/initiate - User initiates SSO launch for an application
router.post('/initiate', requireAuth, ssoInitiateLimiter, ssoController.initiateSSO);

// POST /api/sso/verify - Participating application backend verifies an SSO ticket
router.post('/verify', ssoController.verifySSO);

// GET /api/sso/status/:softwareId - SSO configuration and status check
router.get('/status/:softwareId', requireAuth, ssoController.getSSOStatus);

module.exports = router;
