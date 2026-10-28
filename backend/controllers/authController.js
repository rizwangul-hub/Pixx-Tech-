/**
 * PixxTech Central Portal - Authentication Controller
 * Phase 3: Secure Login, Session Management, Logout & Password Management
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ROLES } = require('../config/roles');
const { recordActivity } = require('../utils/auditLogger');
const { getDbStatus } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'pixxtech_portal_session_jwt_secret_phase3';

/**
 * POST /api/auth/login
 * Authenticate user, regenerate session ID to prevent session fixation, and return safe profile
 */
exports.login = async (req, res) => {
  try {
    const dbStatus = getDbStatus();
    if (!dbStatus.connected) {
      return res.status(503).json({
        success: false,
        message: 'Database is currently offline. Cannot authenticate credentials.',
      });
    }

    const { email, username, password } = req.body;
    const identifier = (email || username || '').toLowerCase().trim();

    // 1. Validate request body presence
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Corporate email/username and security password are required.',
      });
    }

    // 2. Query user by normalized email, username, or alternate emails, explicitly selecting passwordHash
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }, { alternateEmails: identifier }],
    }).select('+passwordHash');

    // Generic error message to prevent account enumeration
    const genericAuthError = 'Invalid corporate email/username or password.';

    if (!user) {
      await recordActivity({
        action: 'AUTH_LOGIN_FAILED',
        entityType: 'Auth',
        details: { identifier, reason: 'User not found' },
        req,
      });
      return res.status(401).json({
        success: false,
        message: genericAuthError,
      });
    }

    // 3. Verify account active status
    if (!user.isActive) {
      await recordActivity({
        actorUserId: user._id,
        action: 'AUTH_LOGIN_REJECTED_INACTIVE',
        entityType: 'Auth',
        details: { identifier: user.email },
        req,
      });
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact the portal administrator for access restoration.',
      });
    }

    // 4. Verify password with bcrypt
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      await recordActivity({
        actorUserId: user._id,
        action: 'AUTH_LOGIN_FAILED',
        entityType: 'Auth',
        details: { identifier: user.email, reason: 'Incorrect password' },
        req,
      });
      return res.status(401).json({
        success: false,
        message: genericAuthError,
      });
    }

    // 5. Update last successful login timestamp
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    // 6. Generate compact JWT token (for API clients and headless test runners)
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 7. Secure Session Management: Regenerate session ID to prevent session fixation
    const completeLoginResponse = () => {
      recordActivity({
        actorUserId: user._id,
        action: 'AUTH_LOGIN_SUCCESS',
        entityType: 'Auth',
        entityId: user._id,
        details: { email: user.email, role: user.role },
        req,
      });

      return res.status(200).json({
        success: true,
        message: 'Central portal authentication successful.',
        token,
        user: user.getSafeProfile(),
      });
    };

    if (req.session) {
      req.session.regenerate((err) => {
        if (err) {
          // If session regeneration fails, proceed with existing session store
          req.session.userId = user._id;
          req.session.role = user.role;
          return completeLoginResponse();
        }
        req.session.userId = user._id;
        req.session.role = user.role;
        return completeLoginResponse();
      });
    } else {
      return completeLoginResponse();
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication processing error.',
      error: error.message,
    });
  }
};

/**
 * GET /api/auth/me
 * Return current authenticated user's safe profile and permissions
 */
exports.getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    return res.status(200).json({
      success: true,
      user: req.user.getSafeProfile(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/logout
 * Terminate central portal session and clear session cookie
 * Note: External applications retain their independent sessions
 */
exports.logout = async (req, res) => {
  try {
    const actorId = req.user ? req.user._id : (req.session ? req.session.userId : null);

    if (actorId) {
      await recordActivity({
        actorUserId: actorId,
        action: 'AUTH_LOGOUT',
        entityType: 'Auth',
        entityId: actorId,
        details: { notice: 'Portal session terminated. External app sessions untouched.' },
        req,
      });
    }

    if (req.session) {
      req.session.destroy((err) => {
        res.clearCookie('pixxtech.sid', { path: '/' });
        return res.status(200).json({
          success: true,
          message: 'Logged out of PixxTech Central Portal successfully. External app sessions remain unaffected.',
        });
      });
    } else {
      res.clearCookie('pixxtech.sid', { path: '/' });
      return res.status(200).json({
        success: true,
        message: 'Logged out of PixxTech Central Portal successfully.',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Logout processing error.',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/change-password
 * Change current user password after verifying existing password
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are both required.',
      });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters in length.',
      });
    }

    // Retrieve user with passwordHash
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    // Verify current password
    const isCurrentMatch = await user.comparePassword(currentPassword);
    if (!isCurrentMatch) {
      await recordActivity({
        actorUserId: user._id,
        action: 'AUTH_PASSWORD_CHANGE_FAILED',
        entityType: 'Auth',
        details: { reason: 'Incorrect current password' },
        req,
      });
      return res.status(401).json({
        success: false,
        message: 'Current password does not match.',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.passwordChangedAt = new Date();
    await user.save();

    await recordActivity({
      actorUserId: user._id,
      action: 'AUTH_PASSWORD_CHANGED',
      entityType: 'Auth',
      entityId: user._id,
      details: { notice: 'Password successfully updated' },
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Password successfully updated.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Password update failed.',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/bootstrap
 * Protected first-time administrator setup mechanism.
 * Disables itself permanently as soon as an active Boss exists.
 */
exports.bootstrapAdmin = async (req, res) => {
  try {
    const dbStatus = getDbStatus();
    if (!dbStatus.connected) {
      return res.status(503).json({
        success: false,
        message: 'Database is currently offline. Cannot perform administrator bootstrap.',
      });
    }

    // 1. Verify bootstrap secret from header or env
    const providedSecret = req.headers['x-bootstrap-secret'] || req.body.bootstrapSecret;
    const configuredSecret = process.env.BOOTSTRAP_SECRET || 'pixxtech_initial_bootstrap_secret_2026';

    if (!providedSecret || providedSecret !== configuredSecret) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Invalid or missing administrator bootstrap token.',
      });
    }

    // 2. Prevent reuse: check if an active Boss account already exists in the database
    const existingBossCount = await User.countDocuments({ role: ROLES.BOSS });
    if (existingBossCount > 0) {
      return res.status(403).json({
        success: false,
        message: 'Bootstrap permanently disabled: An active Boss administrator already exists in the system.',
      });
    }

    const { name, email, username, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Administrator name, email address, and security password are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Administrator password must be at least 8 characters.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate email
    const duplicate = await User.findOne({ email: normalizedEmail });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create the initial Boss account
    const bossUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      username: username ? username.toLowerCase().trim() : undefined,
      passwordHash,
      role: ROLES.BOSS,
      isActive: true,
      passwordChangedAt: new Date(),
    });

    await recordActivity({
      actorUserId: bossUser._id,
      action: 'ADMIN_BOOTSTRAP_COMPLETED',
      entityType: 'Auth',
      entityId: bossUser._id,
      details: { email: bossUser.email, role: bossUser.role },
      req,
    });

    return res.status(201).json({
      success: true,
      message: 'Initial Boss administrator account successfully created. Bootstrap is now permanently disabled.',
      user: bossUser.getSafeProfile(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Administrator bootstrap failed.',
      error: error.message,
    });
  }
};
