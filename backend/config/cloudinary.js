const cloudinary = require('cloudinary').v2;
const streamifier = require('stream');
const logger = require('../utils/logger');

// Check if credentials exist
const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  logger.info(`[Cloudinary] Initialized with Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
} else {
  logger.warn('[Cloudinary] Cloudinary credentials are missing or incomplete in environment.');
}

// Allowed folders
const CLOUDINARY_FOLDERS = {
  SOFTWARE_LOGOS: 'pixxtech/software-logos',
  USER_AVATARS: 'pixxtech/user-avatars',
  GENERAL_ASSETS: 'pixxtech/general-assets',
};

// Permitted MIME types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Uploads a buffer stream to Cloudinary
 */
const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!isConfigured) {
      return reject(new Error('Cloudinary is not configured. Please supply Cloudinary credentials in .env.'));
    }

    const folder = options.folder || CLOUDINARY_FOLDERS.GENERAL_ASSETS;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
        transformation: options.transformation || [{ quality: 'auto', fetch_format: 'auto' }],
        ...options,
      },
      (error, result) => {
        if (error) {
          logger.error(`[Cloudinary Upload Error] ${error.message}`);
          return reject(error);
        }
        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
        });
      }
    );

    const readable = new streamifier.Readable();
    readable.push(fileBuffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

/**
 * Deletes an existing asset by publicId from Cloudinary
 */
const deleteFromCloudinary = async (publicId) => {
  if (!isConfigured || !publicId) return null;
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info(`[Cloudinary] Asset deleted: ${publicId} (Result: ${result.result})`);
    return result;
  } catch (err) {
    logger.error(`[Cloudinary Delete Error] ${publicId}: ${err.message}`);
    return null;
  }
};

const getCloudinaryStatus = () => ({
  configured: isConfigured,
  cloudName: isConfigured ? process.env.CLOUDINARY_CLOUD_NAME : null,
  folders: CLOUDINARY_FOLDERS,
});

module.exports = {
  cloudinary,
  isConfigured: () => isConfigured,
  getCloudinaryStatus,
  uploadToCloudinary,
  deleteFromCloudinary,
  CLOUDINARY_FOLDERS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
};
