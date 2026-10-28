/**
 * PixxTech Central Portal - Software Routes
 * Phase 3: Access-Filtered Software Registry
 */

const express = require('express');
const router = express.Router();
const softwareController = require('../controllers/softwareController');
const { optionalAuth, requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { PERMISSIONS } = require('../config/roles');

// Read endpoints (Personalized via optionalAuth to filter by role e.g. Accountant)
router.get('/', optionalAuth, softwareController.getAllSoftware);
router.get('/:id', optionalAuth, softwareController.getSoftwareById);

// Application launch endpoint (verifies authorization and logs audit event)
router.post('/:id/launch', optionalAuth, softwareController.launchSoftware);

// Software mutation authorization middleware (Requires Boss / software.manage, with dev key fallback for testing)
const requireSoftwareManageOrDev = (req, res, next) => {
  const providedKey = req.headers['x-internal-dev-key'];
  const configuredKey = process.env.INTERNAL_DEV_KEY || 'dev_secret_pixxtech_phase2';
  if (providedKey && providedKey === configuredKey) {
    return next();
  }
  return requireAuth(req, res, () => {
    requirePermission(PERMISSIONS.SOFTWARE_MANAGE)(req, res, next);
  });
};

// Protected mutation endpoints
router.post('/', requireSoftwareManageOrDev, softwareController.createSoftware);
router.patch('/:id', requireSoftwareManageOrDev, softwareController.updateSoftware);
router.delete('/:id', requireSoftwareManageOrDev, softwareController.deleteSoftware);

// Seeding endpoint
router.post('/seed-development', requireSoftwareManageOrDev, softwareController.seedDevelopmentSoftware);

module.exports = router;
