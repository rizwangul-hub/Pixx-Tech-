const logger = require('../utils/logger');

/**
 * Phase 2 Development Mutation Security Gate
 * Protects POST, PATCH, and DELETE operations until Phase 3 JWT authentication is activated.
 * In production, mutations are locked down unless authorized by the internal development key.
 */
const requireDevOrAuth = (req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  const providedKey = req.headers['x-internal-dev-key'] || req.query.devKey;
  const configuredKey = process.env.INTERNAL_DEV_KEY || 'dev_secret_pixxtech_phase2';

  // Allow if valid internal dev key provided
  if (providedKey && providedKey === configuredKey) {
    return next();
  }

  // Allow in local development mode for testing
  if (isDev) {
    return next();
  }

  // Block in production or unauthenticated requests
  logger.warn(`[Security Alert] Blocked unauthenticated mutation attempt on ${req.method} ${req.originalUrl} from IP: ${req.ip}`);
  return res.status(403).json({
    success: false,
    message: 'Access Denied: Mutation endpoints are locked in production until Phase 3 authentication & RBAC are enabled.',
    hint: 'Provide header "x-internal-dev-key" for authorized internal operations.',
  });
};

module.exports = requireDevOrAuth;
