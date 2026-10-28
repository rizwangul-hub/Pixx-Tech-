/**
 * Environment Configuration Validator
 * Validates critical environment variables at application startup.
 * Fails safely in production when essential security keys are omitted.
 */

const logger = require('../utils/logger');

const validateEnvironment = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors = [];
  const warnings = [];

  // Critical Variables for Production
  if (isProduction) {
    if (!process.env.MONGODB_URI) {
      errors.push('MONGODB_URI is required in production mode for persistent storage.');
    }

    if (!process.env.SESSION_SECRET) {
      errors.push('SESSION_SECRET is required in production to secure server-side session cookies.');
    } else if (process.env.SESSION_SECRET.length < 16) {
      errors.push('SESSION_SECRET must be at least 16 characters long for cryptographic integrity.');
    } else if (process.env.SESSION_SECRET.includes('development') || process.env.SESSION_SECRET.includes('placeholder')) {
      errors.push('SESSION_SECRET is using an insecure default or placeholder value.');
    }

    if (!process.env.JWT_SECRET) {
      errors.push('JWT_SECRET is required in production to sign authentication and API tokens.');
    } else if (process.env.JWT_SECRET.length < 16) {
      errors.push('JWT_SECRET must be at least 16 characters long for cryptographic integrity.');
    }

    if (!process.env.FRONTEND_URL && !process.env.CLIENT_URL) {
      warnings.push('FRONTEND_URL / CLIENT_URL not explicitly set. Defaulting CORS to localhost.');
    }
  } else {
    // Development / Test mode warnings
    if (!process.env.MONGODB_URI) {
      warnings.push('MONGODB_URI is omitted. Backend will operate in disconnected/fallback mode.');
    }
    if (!process.env.SESSION_SECRET) {
      warnings.push('SESSION_SECRET is omitted. Using internal fallback secret for development.');
    }
    if (!process.env.JWT_SECRET) {
      warnings.push('JWT_SECRET is omitted. Using internal fallback secret for development.');
    }
  }

  // Cloudinary Check (Both Production and Development)
  const hasCloudinaryName = Boolean(process.env.CLOUDINARY_CLOUD_NAME);
  const hasCloudinaryKey = Boolean(process.env.CLOUDINARY_API_KEY);
  const hasCloudinarySecret = Boolean(process.env.CLOUDINARY_API_SECRET);

  if ((hasCloudinaryName || hasCloudinaryKey || hasCloudinarySecret) &&
      !(hasCloudinaryName && hasCloudinaryKey && hasCloudinarySecret)) {
    warnings.push('Partial Cloudinary configuration detected. Cloud media uploads will fail until all 3 keys are provided.');
  }

  // Log warnings
  warnings.forEach((warn) => logger.warn(`[Config Warning] ${warn}`));

  // In production, fatal errors must halt startup safely
  if (errors.length > 0) {
    logger.error('======================================================');
    logger.error('CRITICAL ENVIRONMENT CONFIGURATION ERROR(S) DETECTED:');
    errors.forEach((err, idx) => logger.error(`  ${idx + 1}. ${err}`));
    logger.error('Startup aborted. Please correct your environment variables.');
    logger.error('======================================================');
    throw new Error(`Production startup aborted due to missing configuration: ${errors.join('; ')}`);
  }

  return { valid: true, warnings, errors };
};

module.exports = { validateEnvironment };
