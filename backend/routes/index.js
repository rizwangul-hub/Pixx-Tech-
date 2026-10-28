const express = require('express');
const router = express.Router();

const healthRoutes = require('./healthRoutes');
const softwareRoutes = require('./softwareRoutes');
const uploadRoutes = require('./uploadRoutes');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const auditRoutes = require('./auditRoutes');
const ssoRoutes = require('./ssoRoutes');

// Health Check endpoint: /api/health
router.use('/health', healthRoutes);

// Authentication endpoints: /api/auth
router.use('/auth', authRoutes);

// Single Sign-On (SSO) endpoints: /api/sso
router.use('/sso', ssoRoutes);

// User Management endpoints: /api/users
router.use('/users', userRoutes);

// Audit Log endpoints: /api/audit
router.use('/audit', auditRoutes);

// Software registry endpoints: /api/software
router.use('/software', softwareRoutes);

// Image upload endpoints: /api/uploads
router.use('/uploads', uploadRoutes);

// Root /api info
router.get('/', (req, res) => {
  res.status(200).json({
    name: 'PixxTech Central Portal API',
    version: '6.0.0',
    phase: 'Phase 6 — Production Deployment, HTTPS, Security Hardening & End-to-End Testing',
    status: 'online',
    endpoints: {
      health: 'GET /api/health',
      authLogin: 'POST /api/auth/login',
      authMe: 'GET /api/auth/me [Protected]',
      authLogout: 'POST /api/auth/logout [Protected]',
      authChangePassword: 'POST /api/auth/change-password [Protected]',
      authBootstrap: 'POST /api/auth/bootstrap [Protected Setup]',
      ssoInitiate: 'POST /api/sso/initiate [Protected]',
      ssoVerify: 'POST /api/sso/verify',
      ssoStatus: 'GET /api/sso/status/:softwareId [Protected]',
      usersList: 'GET /api/users [Boss / Manager]',
      usersCreate: 'POST /api/users [Boss Only]',
      usersUpdate: 'PATCH /api/users/:id [Boss Only]',
      usersStatus: 'PATCH /api/users/:id/status [Boss Only]',
      auditLogs: 'GET /api/audit [Boss Only]',
      softwareList: 'GET /api/software [Role-Filtered]',
      softwareById: 'GET /api/software/:id [Role-Checked]',
      softwareCreate: 'POST /api/software [Boss Only]',
      softwareUpdate: 'PATCH /api/software/:id [Boss Only]',
      softwareDelete: 'DELETE /api/software/:id [Boss Only]',
      uploadLogo: 'POST /api/uploads/software-logo [Protected]',
      uploadAvatar: 'POST /api/uploads/avatar [Protected]',
    },
  });
});

module.exports = router;
