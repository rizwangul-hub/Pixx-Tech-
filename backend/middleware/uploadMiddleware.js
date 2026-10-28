const multer = require('multer');
const { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } = require('../config/cloudinary');

// Use memory storage for direct streaming to Cloudinary
const storage = multer.memoryStorage();

/**
 * Checks an SVG buffer for dangerous active scripts, event handlers, and embedded objects (XSS defense)
 */
const containsUnsafeSvgContent = (buffer) => {
  if (!buffer) return false;
  const content = buffer.toString('utf8').toLowerCase();

  // Dangerous XML/SVG tags and attributes that can execute JavaScript
  const dangerousPatterns = [
    /<script\b[^>]*>/i,
    /<\/script>/i,
    /\bon[a-z]+\s*=/i, // onload, onerror, onclick, onmouseover, etc.
    /javascript\s*:/i,
    /<iframe\b[^>]*>/i,
    /<object\b[^>]*>/i,
    /<embed\b[^>]*>/i,
    /<foreignobject\b[^>]*>/i,
    /href\s*=\s*['"]\s*javascript:/i,
    /xlink:href\s*=\s*['"]\s*javascript:/i,
    /data\s*:\s*text\/html/i,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(content));
};

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type '${file.mimetype}'. Supported image types are JPEG, PNG, WEBP, and SVG.`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES, // 5MB
    files: 1,
  },
  fileFilter,
});

upload.containsUnsafeSvgContent = containsUnsafeSvgContent;

module.exports = upload;
