const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { validateEnvironment } = require('./config/validateEnv');
const { connectDB, closeDB } = require('./config/db');
const configureSession = require('./config/session');
const routes = require('./routes');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Validate critical environment variables before starting
validateEnvironment();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
const isProduction = process.env.NODE_ENV === 'production';

// Configure Express proxy trust only in production reverse-proxy topologies (Cloudflare / Nginx / Vercel)
if (isProduction) {
  app.set('trust proxy', 1);
}

// Request Correlation ID Middleware (attaches x-request-id for end-to-end tracing)
app.use((req, res, next) => {
  const correlationId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = correlationId;
  res.setHeader('X-Request-Id', correlationId);
  next();
});

// Hardened Security Headers via Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    frameguard: { action: 'deny' },
    noSniff: true,
    hsts: isProduction
      ? {
          maxAge: 31536000, // 1 year HSTS
          includeSubDomains: true,
          preload: true,
        }
      : false,
  })
);

// Controlled CORS Configuration
const allowedOrigins = [
  FRONTEND_URL,
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // In development or if no origin (curl/mobile/Postman) or listed origins, or any Vercel domain (*.vercel.app)
      const isAllowedVercel = origin && /^https:\/\/[a-zA-Z0-9_.-]+\.vercel\.app$/.test(origin);
      if (!origin || allowedOrigins.includes(origin) || isAllowedVercel) {
        callback(null, true);
      } else if (!isProduction) {
        callback(null, true); // Dev convenience
      } else {
        callback(new Error(`Origin '${origin}' not permitted by CORS policy`));
      }
    },
    credentials: true, // Required for HttpOnly session cookies
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-internal-dev-key', 'x-bootstrap-secret', 'x-auth-token'],
  })
);

// Request Body Parsers with explicit size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Persistent Server-Side MongoDB Session Middleware
app.use(configureSession());

// Request Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} [${res.statusCode}] - ${duration}ms`);
  });
  next();
});

// Root Welcome Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    portal: 'PixxTech Central Portal API',
    phase: 'Phase 6 — Production Deployment, HTTPS, Security Hardening & End-to-End Testing',
    version: '6.0.0',
    status: 'online',
    requestId: req.id,
    healthCheck: '/api/health',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api', routes);

// 404 Handler
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

// Initialize Server
let server;
const startServer = () => {
  server = app.listen(PORT, () => {
    console.log('===========================================================');
    console.log('  PIXXTECH CENTRAL PORTAL - PHASE 6 PRODUCTION-READY BACKEND');
    console.log(`  Phase: Production Deployment, HTTPS, Security & Hardening`);
    console.log(`  Server URL: http://localhost:${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`  Allowed Client: ${FRONTEND_URL}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('===========================================================');
  });

  // Connect to MongoDB Atlas / Local MongoDB asynchronously without blocking HTTP listener
  connectDB().catch((err) => {
    logger.warn(`Initial MongoDB connection failed: ${err.message}`);
  });
};

// Graceful Shutdown Handler
const handleShutdown = async (signal) => {
  logger.info(`Received ${signal}. Gracefully terminating PixxTech Central Portal...`);
  if (server) {
    server.close(async () => {
      await closeDB();
      console.log('HTTP server and Database connection closed.');
      process.exit(0);
    });
  } else {
    await closeDB();
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));

if (process.env.VERCEL) {
  // On Vercel Serverless environment, initialize MongoDB connection
  connectDB().catch((err) => {
    logger.warn(`Initial MongoDB connection failed: ${err.message}`);
  });
} else if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
