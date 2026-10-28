/**
 * PixxTech Central Portal - Authentication Middleware
 * Phase 3: Session & Token-based Authentication
 */

const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'pixxtech_portal_session_jwt_secret_phase3';

/**
 * Enforces authenticated session or valid API token on protected routes
 */
const requireAuth = async (req, res, next) => {
  try {
    let userId = null;

    // 1. Primary: Server-side MongoDB session cookie
    if (req.session && req.session.userId) {
      userId = req.session.userId;
    }

    // 2. Secondary: Bearer JWT token or x-auth-token (for API clients, automated tests)
    if (!userId) {
      const authHeader = req.headers.authorization || req.headers['x-auth-token'];
      if (authHeader) {
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          if (decoded && decoded.id) {
            userId = decoded.id;
          }
        } catch {
          // Invalid token, ignore and proceed to rejection
        }
      }
    }

    // 3. Reject unauthenticated requests
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to the central portal.',
      });
    }

    // 4. Retrieve user and verify account status
    const user = await User.findById(userId);

    if (!user) {
      if (req.session) {
        req.session.destroy();
      }
      return res.status(401).json({
        success: false,
        message: 'User session invalid. User account no longer exists.',
      });
    }

    if (!user.isActive) {
      if (req.session) {
        req.session.destroy();
      }
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact the portal administrator.',
      });
    }

    // Attach active user to request
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal authentication validation failure.',
      error: err.message,
    });
  }
};

/**
 * Optional authentication middleware for endpoints that can serve both public and personalized data
 */
const optionalAuth = async (req, res, next) => {
  try {
    let userId = null;

    if (req.session && req.session.userId) {
      userId = req.session.userId;
    } else {
      const authHeader = req.headers.authorization || req.headers['x-auth-token'];
      if (authHeader) {
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          if (decoded && decoded.id) {
            userId = decoded.id;
          }
        } catch {
          // Token invalid, ignore for optional auth
        }
      }
    }

    if (userId) {
      const user = await User.findById(userId);
      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch {
    next();
  }
};

module.exports = {
  requireAuth,
  optionalAuth,
  protect: requireAuth,
};
