/**
 * PixxTech Central Portal - User Management Controller
 * Phase 3: Centralized Personnel Administration & Governance
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Software = require('../models/Software');
const { ROLES, normalizeRole } = require('../config/roles');
const { recordActivity } = require('../utils/auditLogger');
const { getDbStatus } = require('../config/db');

/**
 * GET /api/users
 * List users with pagination, role filtering, and search (Restricted to authorized roles)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const dbStatus = getDbStatus();
    if (!dbStatus.connected) {
      return res.status(503).json({
        success: false,
        message: 'Database is currently disconnected. Cannot retrieve users.',
      });
    }

    const { role, isActive, search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (role && role !== 'All') {
      query.role = normalizeRole(role);
    }

    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
      ];
    }

    const [totalUsers, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .populate('allowedSoftware', 'name slug category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      data: users.map((u) => u.getSafeProfile()),
      pagination: {
        total: totalUsers,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalUsers / limitNum) || 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users.',
      error: error.message,
    });
  }
};

/**
 * GET /api/users/:id
 * Retrieve single user by ID
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid User ID format.',
      });
    }

    const user = await User.findById(id).populate('allowedSoftware', 'name slug category');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: user.getSafeProfile(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user details.',
      error: error.message,
    });
  }
};

/**
 * POST /api/users
 * Create a new central portal user
 */
exports.createUser = async (req, res) => {
  try {
    const { name, email, username, password, role, allowedSoftware } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'User name, email, and initial password are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters in length.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Duplicate check
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this corporate email address already exists.',
      });
    }

    const targetRole = role ? normalizeRole(role) : ROLES.SOFTWARE_DEVELOPER;

    // Privilege Escalation Prevention: Only Boss can create accounts with role Boss
    if (targetRole === ROLES.BOSS && req.user.role !== ROLES.BOSS) {
      return res.status(403).json({
        success: false,
        message: 'Only an active Boss can provision a new Boss account.',
      });
    }

    // Validate software IDs if provided
    let validatedSoftwareIds = [];
    if (allowedSoftware && Array.isArray(allowedSoftware) && allowedSoftware.length > 0) {
      const validObjectIds = allowedSoftware.filter((sid) => mongoose.Types.ObjectId.isValid(sid));
      if (validObjectIds.length > 0) {
        const found = await Software.find({ _id: { $in: validObjectIds } }, '_id');
        validatedSoftwareIds = found.map((s) => s._id);
      }
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      username: username ? username.toLowerCase().trim() : undefined,
      passwordHash,
      role: targetRole,
      allowedSoftware: validatedSoftwareIds,
      isActive: true,
      passwordChangedAt: new Date(),
    });

    await recordActivity({
      actorUserId: req.user._id,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: newUser._id,
      details: { email: newUser.email, role: newUser.role },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Portal user created successfully.',
      data: newUser.getSafeProfile(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'User creation failed.',
      error: error.message,
    });
  }
};

/**
 * PATCH /api/users/:id
 * Update permitted user attributes and access assignments
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid User ID format.',
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Mass-assignment protection: Whitelist allowed fields only
    const { name, role, allowedSoftware, avatarUrl, avatarPublicId, username, newPassword } = req.body;

    // Self-promotion prevention: Non-Boss users cannot change their own role or promote others to Boss
    if (role) {
      const targetRole = normalizeRole(role);
      if (targetRole === ROLES.BOSS && req.user.role !== ROLES.BOSS) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied: Cannot promote any account to Boss without existing Boss authority.',
        });
      }

      // Last Active Boss Protection: Cannot demote the sole active Boss
      if (targetUser.role === ROLES.BOSS && targetRole !== ROLES.BOSS) {
        const remainingBosses = await User.countDocuments({
          role: ROLES.BOSS,
          isActive: true,
          _id: { $ne: targetUser._id },
        });
        if (remainingBosses === 0) {
          return res.status(400).json({
            success: false,
            message: 'Cannot demote the sole active Boss account. Organization must maintain at least one Boss.',
          });
        }
      }

      targetUser.role = targetRole;
    }

    if (name && typeof name === 'string') {
      targetUser.name = name.trim();
    }

    if (username !== undefined) {
      targetUser.username = username ? username.toLowerCase().trim() : undefined;
    }

    if (avatarUrl !== undefined) {
      targetUser.avatarUrl = avatarUrl;
    }

    if (avatarPublicId !== undefined) {
      targetUser.avatarPublicId = avatarPublicId;
    }

    // Update application assignments with validation
    if (allowedSoftware && Array.isArray(allowedSoftware)) {
      const validObjectIds = allowedSoftware.filter((sid) => mongoose.Types.ObjectId.isValid(sid));
      const found = await Software.find({ _id: { $in: validObjectIds } }, '_id');
      targetUser.allowedSoftware = found.map((s) => s._id);
    }

    // Admin password reset
    if (newPassword && typeof newPassword === 'string' && newPassword.length >= 8) {
      const salt = await bcrypt.genSalt(10);
      targetUser.passwordHash = await bcrypt.hash(newPassword, salt);
      targetUser.passwordChangedAt = new Date();
    }

    await targetUser.save();

    await recordActivity({
      actorUserId: req.user._id,
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: targetUser._id,
      details: { role: targetUser.role, allowedSoftwareCount: targetUser.allowedSoftware.length },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: targetUser.getSafeProfile(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'User update failed.',
      error: error.message,
    });
  }
};

/**
 * PATCH /api/users/:id/status
 * Activate or deactivate a central portal user account
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid User ID format.',
      });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive field must be a boolean (true or false).',
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Last Active Boss Protection: Cannot deactivate the sole active Boss account
    if (targetUser.role === ROLES.BOSS && isActive === false) {
      const remainingActiveBosses = await User.countDocuments({
        role: ROLES.BOSS,
        isActive: true,
        _id: { $ne: targetUser._id },
      });

      if (remainingActiveBosses === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate the sole active Boss account. The organization must retain at least one active administrator.',
        });
      }
    }

    targetUser.isActive = isActive;
    await targetUser.save();

    await recordActivity({
      actorUserId: req.user._id,
      action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entityType: 'User',
      entityId: targetUser._id,
      details: { email: targetUser.email, isActive },
      req,
    });

    res.status(200).json({
      success: true,
      message: `User account successfully ${isActive ? 'activated' : 'deactivated'}.`,
      data: targetUser.getSafeProfile(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user status.',
      error: error.message,
    });
  }
};
