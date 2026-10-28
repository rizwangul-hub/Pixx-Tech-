/**
 * PixxTech Central Portal - Audit Routes
 * Phase 3: Security & Operational Logs
 */

const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { PERMISSIONS } = require('../config/roles');

router.use(requireAuth);

router.get('/', requirePermission(PERMISSIONS.AUDIT_READ), auditController.getAuditLogs);

module.exports = router;
