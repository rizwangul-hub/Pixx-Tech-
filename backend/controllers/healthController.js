const { getDbStatus } = require('../config/db');
const { getCloudinaryStatus } = require('../config/cloudinary');

/**
 * GET /api/health
 * Comprehensive Health Check reporting actual database connection and service states safely.
 */
exports.getHealth = (req, res) => {
  const memoryUsage = process.memoryUsage();
  const dbStatus = getDbStatus();
  const cloudinaryStatus = getCloudinaryStatus();

  const isFullyConnected = dbStatus.connected;

  res.status(200).json({
    success: true,
    status: isFullyConnected ? 'operational' : 'degraded',
    service: 'PixxTech Central Portal API',
    phase: 'Phase 6 — Production Deployment, HTTPS, Security Hardening & End-to-End Testing',
    version: '6.0.0',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    // Database connection details without exposing credentials
    database: {
      connected: dbStatus.connected,
      state: dbStatus.state,
      provider: 'MongoDB Atlas / Mongoose',
      host: dbStatus.host || 'Not Connected',
      name: dbStatus.name || null,
    },
    // Cloudinary storage status
    cloudinary: {
      configured: cloudinaryStatus.configured,
      cloudName: cloudinaryStatus.cloudName || 'Not Configured',
      status: cloudinaryStatus.configured ? 'Ready' : 'Pending Credentials',
    },
    system: {
      heapUsedMB: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
      rssMB: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
    },
  });
};

/**
 * GET /api/health/live
 * Kubernetes / Container Liveness Probe - returns 200 if Node process is responsive
 */
exports.getLiveness = (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
};

/**
 * GET /api/health/ready
 * Container / Reverse-Proxy Readiness Probe - returns 200 only if DB is ready for traffic
 */
exports.getReadiness = (req, res) => {
  const dbStatus = getDbStatus();
  if (dbStatus.connected) {
    return res.status(200).json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(503).json({
    status: 'not_ready',
    database: 'disconnected',
    message: 'Central Portal is not ready to accept traffic because the database connection is pending or disconnected.',
    timestamp: new Date().toISOString(),
  });
};
