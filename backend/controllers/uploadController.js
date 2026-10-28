const { uploadToCloudinary, CLOUDINARY_FOLDERS, isConfigured } = require('../config/cloudinary');
const { containsUnsafeSvgContent } = require('../middleware/uploadMiddleware');
const ActivityLog = require('../models/ActivityLog');
const logger = require('../utils/logger');

/**
 * POST /api/uploads/software-logo
 * Securely uploads a software application logo to Cloudinary
 */
exports.uploadSoftwareLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided in request. Field name must be "image".',
      });
    }

    // SVG Security Check (Phase 2): Block active content, scripts, and embedded objects
    if (req.file.mimetype === 'image/svg+xml' && containsUnsafeSvgContent(req.file.buffer)) {
      return res.status(400).json({
        success: false,
        message: 'Upload rejected: The provided SVG file contains unsafe active scripts or executable tags.',
      });
    }

    if (!isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Cloudinary image storage service is not configured on this server.',
      });
    }

    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: CLOUDINARY_FOLDERS.SOFTWARE_LOGOS,
      transformation: [
        { width: 400, height: 400, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
      ],
    });

    // Audit log
    try {
      await ActivityLog.create({
        action: 'Software Logo Uploaded',
        entityType: 'Upload',
        entityId: uploadResult.publicId,
        details: {
          publicId: uploadResult.publicId,
          format: uploadResult.format,
          bytes: uploadResult.bytes,
        },
      });
    } catch (logErr) {
      logger.warn(`Failed to log upload event: ${logErr.message}`);
    }

    res.status(200).json({
      success: true,
      message: 'Software logo uploaded successfully to Cloudinary.',
      data: {
        secureUrl: uploadResult.secureUrl,
        publicId: uploadResult.publicId,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
      },
    });
  } catch (error) {
    logger.error(`[Upload Error] ${error.message}`);
    res.status(500).json({
      success: false,
      message: `Failed to upload image: ${error.message}`,
    });
  }
};

/**
 * POST /api/uploads/avatar
 * Securely uploads a user profile avatar to Cloudinary
 */
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No avatar image file provided. Field name must be "image".',
      });
    }

    // SVG Security Check (Phase 2): Block active content, scripts, and embedded objects
    if (req.file.mimetype === 'image/svg+xml' && containsUnsafeSvgContent(req.file.buffer)) {
      return res.status(400).json({
        success: false,
        message: 'Upload rejected: The provided SVG file contains unsafe active scripts or executable tags.',
      });
    }

    if (!isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Cloudinary image storage service is not configured on this server.',
      });
    }

    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: CLOUDINARY_FOLDERS.USER_AVATARS,
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'face', quality: 'auto', fetch_format: 'auto' },
      ],
    });

    // Audit log
    try {
      await ActivityLog.create({
        action: 'User Avatar Uploaded',
        entityType: 'Upload',
        entityId: uploadResult.publicId,
        details: {
          publicId: uploadResult.publicId,
          format: uploadResult.format,
          bytes: uploadResult.bytes,
        },
      });
    } catch (logErr) {
      logger.warn(`Failed to log avatar upload: ${logErr.message}`);
    }

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully to Cloudinary.',
      data: {
        secureUrl: uploadResult.secureUrl,
        publicId: uploadResult.publicId,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
      },
    });
  } catch (error) {
    logger.error(`[Avatar Upload Error] ${error.message}`);
    res.status(500).json({
      success: false,
      message: `Failed to upload avatar: ${error.message}`,
    });
  }
};
