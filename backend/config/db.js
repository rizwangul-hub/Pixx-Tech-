const mongoose = require('mongoose');
const logger = require('../utils/logger');

let isConnecting = false;

/**
 * Sanitizes MongoDB connection string by stripping username and password for safe logging
 */
const sanitizeMongoUri = (uri) => {
  if (!uri) return 'undefined';
  try {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  } catch {
    return '***';
  }
};

/**
 * Connect to MongoDB Atlas or local MongoDB instance.
 * Avoids multiple connection calls if already connected or connecting.
 */
const connectDB = async () => {
  let uri = process.env.MONGODB_URI;

  if (uri && typeof uri === 'string') {
    uri = uri.trim();
    if (uri.startsWith('MONGODB_URI=')) {
      uri = uri.replace(/^MONGODB_URI=/, '').trim();
      process.env.MONGODB_URI = uri;
    }
  }

  if (!uri) {
    logger.warn('[Database] MONGODB_URI is not configured in environment variables.');
    return null;
  }

  // Check if already connected (readyState 1 = connected, 2 = connecting)
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (isConnecting) {
    logger.info('[Database] Connection attempt already in progress...');
    return null;
  }

  isConnecting = true;

  try {
    // Configure Mongoose event listeners once
    if (mongoose.connection.listenerCount('disconnected') === 0) {
      mongoose.connection.on('connected', () => {
        logger.info('[Database] MongoDB connection established successfully.');
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('[Database] MongoDB connection disconnected.');
      });

      mongoose.connection.on('error', (err) => {
        logger.error(`[Database Event Error] ${err.message}`);
      });
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000, // Safe timeout so the API starts and remains responsive
    });

    isConnecting = false;
    logger.info(`[Database] Connected to MongoDB host: ${conn.connection.host} (Database: ${conn.connection.name})`);
    return conn;
  } catch (error) {
    isConnecting = false;
    // Log safe error without exposing credentials
    logger.error(`[Database Error] Could not connect to MongoDB: ${error.message} (Target: ${sanitizeMongoUri(uri)})`);
    return null;
  }
};

/**
 * Returns the current database connection status details.
 * 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
 */
const getDbStatus = () => {
  const stateCode = mongoose.connection.readyState;
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const statusName = stateMap[stateCode] || 'unknown';
  const isConnected = stateCode === 1;

  return {
    connected: isConnected,
    state: statusName,
    readyState: stateCode,
    host: isConnected ? mongoose.connection.host : null,
    name: isConnected ? mongoose.connection.name : null,
  };
};

/**
 * Cleanly close connection during server shutdown
 */
const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.close(false);
      logger.info('[Database] MongoDB connection closed gracefully.');
    } catch (err) {
      logger.error(`[Database] Error during connection close: ${err.message}`);
    }
  }
};

module.exports = {
  connectDB,
  getDbStatus,
  closeDB,
};
