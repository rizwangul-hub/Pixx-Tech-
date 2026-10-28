/**
 * PixxTech Central Portal - Audit Controller
 * Phase 3: Access to System and Security Audit Logs
 */

const ActivityLog = require('../models/ActivityLog');
const { getDbStatus } = require('../config/db');

/**
 * GET /api/audit
 * Retrieve security and operational audit logs (Restricted to Boss / audit.read)
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const dbStatus = getDbStatus();
    if (!dbStatus.connected) {
      return res.status(503).json({
        success: false,
        message: 'Database is currently disconnected. Cannot retrieve audit logs.',
      });
    }

    const { entityType, action, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (entityType && entityType !== 'All') {
      query.entityType = entityType;
    }

    if (action && action.trim() !== '') {
      query.action = { $regex: action.trim(), $options: 'i' };
    }

    const [totalLogs, logs] = await Promise.all([
      ActivityLog.countDocuments(query),
      ActivityLog.find(query)
        .populate('actorUserId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total: totalLogs,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalLogs / limitNum) || 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit log records.',
      error: error.message,
    });
  }
};
