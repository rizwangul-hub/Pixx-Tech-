/**
 * PixxTech Central Portal - Audit Logger Service
 * Phase 3: Centralized Security Audit Logging
 */

const ActivityLog = require('../models/ActivityLog');
const { getDbStatus } = require('../config/db');
const logger = require('./logger');

/**
 * Record a security-sensitive event in the ActivityLog collection.
 * Automatically sanitizes sensitive keys and records non-sensitive operational details.
 */
const recordActivity = async ({
  actorUserId = null,
  action,
  entityType = 'System',
  entityId = null,
  details = {},
  req = null,
}) => {
  try {
    const ip = req
      ? req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || null
      : null;
    const userAgent = req ? req.headers['user-agent'] : null;

    // Deep copy and strip any sensitive fields
    const safeDetails = { ...details };
    delete safeDetails.password;
    delete safeDetails.passwordHash;
    delete safeDetails.newPassword;
    delete safeDetails.currentPassword;
    delete safeDetails.secret;
    delete safeDetails.cookie;
    delete safeDetails.token;
    delete safeDetails.authorization;

    if (ip) safeDetails.ip = String(ip).split(',')[0].trim();
    if (userAgent) safeDetails.userAgent = String(userAgent).substring(0, 150);

    const dbStatus = getDbStatus();
    if (!dbStatus.connected) {
      // In standalone tests or when MongoDB is offline, avoid Mongoose buffer timeouts
      return null;
    }

    const logEntry = await ActivityLog.create({
      actorUserId: actorUserId || null,
      action,
      entityType,
      entityId: entityId ? String(entityId) : null,
      details: safeDetails,
      createdAt: new Date(),
    });

    return logEntry;
  } catch (err) {
    // Non-blocking error: system operations continue even if logging fails
    logger.warn(`[Audit Logger] Failed to write activity record: ${err.message}`);
    return null;
  }
};

module.exports = {
  recordActivity,
};
