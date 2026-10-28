const mongoose = require('mongoose');
const logger = require('../utils/logger');

let cachedPromise = null;

const DEFAULT_MONGODB_URI = 'mongodb+srv://mern:stack@cluster0.a2wsoz3.mongodb.net/pixxtech?retryWrites=true&w=majority';

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
 * Reuses cached connection across Serverless function invocations.
 */
const connectDB = async () => {
  let uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

  if (uri && typeof uri === 'string') {
    uri = uri.trim();
    if (uri.startsWith('MONGODB_URI=')) {
      uri = uri.replace(/^MONGODB_URI=/, '').trim();
    }
    process.env.MONGODB_URI = uri;
  }

  // Check if already connected (readyState 1 = connected)
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If a connection promise is already in flight, wait for it
  if (cachedPromise) {
    try {
      return await cachedPromise;
    } catch {
      cachedPromise = null;
    }
  }

  // Configure Mongoose event listeners once
  if (mongoose.connection.listenerCount('connected') === 0) {
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

  cachedPromise = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 6000,
    })
    .then((conn) => {
      logger.info(`[Database] Connected to MongoDB host: ${conn.connection.host} (Database: ${conn.connection.name})`);
      return conn;
    })
    .catch((err) => {
      cachedPromise = null;
      logger.error(`[Database Error] Could not connect to MongoDB: ${err.message} (Target: ${sanitizeMongoUri(uri)})`);
      throw err;
    });

  try {
    return await cachedPromise;
  } catch {
    cachedPromise = null;
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
