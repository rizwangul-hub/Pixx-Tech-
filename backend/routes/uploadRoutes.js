const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const upload = require('../middleware/uploadMiddleware');
const requireDevOrAuth = require('../middleware/devAuth');

// Upload software logo (protected by development/internal key until Phase 3 auth)
router.post('/software-logo', requireDevOrAuth, upload.single('image'), uploadController.uploadSoftwareLogo);

// Upload user avatar (protected by development/internal key until Phase 3 auth)
router.post('/avatar', requireDevOrAuth, upload.single('image'), uploadController.uploadAvatar);

module.exports = router;
