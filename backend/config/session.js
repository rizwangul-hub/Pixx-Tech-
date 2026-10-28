/**
 * PixxTech Central Portal - Session Configuration
 * Phase 3: Persistent Server-Side MongoDB Sessions & Secure Cookie Configuration
 */

const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const logger = require('../utils/logger');

const configureSession = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const sessionSecret = process.env.SESSION_SECRET || 'pixxtech_portal_secure_session_secret_2026';
  const DEFAULT_URI = 'mongodb+srv://mern:stack@cluster0.a2wsoz3.mongodb.net/pixxtech?retryWrites=true&w=majority';

  let rawUri = process.env.MONGODB_URI || DEFAULT_URI;
  if (rawUri && typeof rawUri === 'string') {
    rawUri = rawUri.trim();
    if (rawUri.startsWith('MONGODB_URI=')) {
      rawUri = rawUri.replace(/^MONGODB_URI=/, '').trim();
      process.env.MONGODB_URI = rawUri;
    }
  }

  let store;
  if (rawUri && process.env.NODE_ENV !== 'test') {
    try {
      store = MongoStore.create({
        mongoUrl: rawUri,
        collectionName: 'portal_sessions',
        ttl: 7 * 24 * 60 * 60, // 7 days in seconds
        autoRemove: 'native',
        touchAfter: 24 * 3600, // Touch session only once every 24h unless data modified
      });
      logger.info('[Session] Persistent MongoDB session store configured.');
    } catch (err) {
      logger.warn(`[Session] Failed to initialize MongoStore, falling back to in-memory store: ${err.message}`);
    }
  } else {
    logger.info('[Session] In-memory session store active for test/development environment.');
  }

  return session({
    name: 'pixxtech.sid',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      httpOnly: true, // Prevents client-side script access
      secure: isProduction || Boolean(process.env.VERCEL), // Transmitted over HTTPS in production / Vercel
      sameSite: isProduction || Boolean(process.env.VERCEL) ? 'none' : 'lax', // 'none' allows cross-subdomain Vercel auth
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      path: '/',
    },
  });
};

module.exports = configureSession;
