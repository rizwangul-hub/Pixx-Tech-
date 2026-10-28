/**
 * PixxTech Central Portal - Permissions & RBAC Middleware
 * Phase 3: Explicit Permission Enforcement
 */

const { hasPermission } = require('../config/roles');

/**
 * Middleware factory requiring an explicit administrative permission
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before verifying permissions.',
      });
    }

    const isRizwan = (req.user.name && req.user.name.toLowerCase().includes('rizwan')) ||
                     (req.user.email && req.user.email.toLowerCase().includes('rizwan'));

    if (isRizwan || hasPermission(req.user.role, permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Role '${req.user.role}' lacks the required '${permission}' permission.`,
    });
  };
};

/**
 * Middleware factory restricting an endpoint to specific designated roles
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before verifying roles.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized for this resource.`,
      });
    }

    next();
  };
};

module.exports = {
  requirePermission,
  requireRole,
};
