/**
 * PixxTech Central Portal - User Management Routes
 * Phase 3: Personnel Administration & Access Control
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { PERMISSIONS } = require('../config/roles');

// All user management routes require valid authentication
router.use(requireAuth);

// List users and retrieve user profile
router.get('/', requirePermission(PERMISSIONS.USERS_READ), userController.getAllUsers);
router.get('/:id', requirePermission(PERMISSIONS.USERS_READ), userController.getUserById);

// Create, update, and change status of users
router.post('/', requirePermission(PERMISSIONS.USERS_CREATE), userController.createUser);
router.patch('/:id', requirePermission(PERMISSIONS.USERS_UPDATE), userController.updateUser);
router.patch('/:id/status', requirePermission(PERMISSIONS.USERS_DEACTIVATE), userController.updateUserStatus);

module.exports = router;
