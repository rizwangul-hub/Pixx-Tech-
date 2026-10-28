const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

// GET /api/health - Detailed system diagnostic check
router.get('/', healthController.getHealth);

// GET /api/health/live - Process liveness probe
router.get('/live', healthController.getLiveness);

// GET /api/health/ready - Database readiness probe
router.get('/ready', healthController.getReadiness);

module.exports = router;
