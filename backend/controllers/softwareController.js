const mongoose = require('mongoose');
const Software = require('../models/Software');
const { ROLES } = require('../config/roles');
const { recordActivity } = require('../utils/auditLogger');
const { getDbStatus } = require('../config/db');
const { deleteFromCloudinary } = require('../config/cloudinary');
const logger = require('../utils/logger');

// Initial 5 applications for development seeding (only if database is connected and collection is empty)
const SEED_APPLICATIONS = [
  {
    name: 'Pakistan Expense Tracker',
    slug: 'pakistan-expense-tracker',
    category: 'Finance & Accounting',
    description: 'Corporate expenditure tracking, localized tax calculation, currency conversions, and receipt auditing for Pakistan operations.',
    url: 'https://pixxtech-expense-tracker-fz2h.vercel.app',
    sortOrder: 1,
    isActive: true,
    ssoEnabled: true,
    ssoProtocol: 'JWT_BEARER',
    clientId: 'pak-expense-tracker',
    redirectUris: ['https://pixxtech-expense-tracker-fz2h.vercel.app/sso/callback'],
    integrationStatus: 'testing',
    attributeMapping: { email: 'email', username: 'username', role: { Boss: 'ADMIN', Manager: 'ADMIN', Developer: 'ADMIN', Accountant: 'DATA_ENTRY' } },
  },
  {
    name: 'UK Company',
    slug: 'uk-company',
    category: 'Corporate Administration',
    description: 'UK entity governance, statutory filing workflows, Companies House registry sync, and corporate compliance oversight.',
    url: 'https://uk-companies.vercel.app',
    sortOrder: 2,
    isActive: true,
    ssoEnabled: true,
    ssoProtocol: 'JWT_BEARER',
    clientId: 'uk-company',
    redirectUris: ['https://uk-companies.vercel.app/sso/callback'],
    integrationStatus: 'testing',
    attributeMapping: { email: 'email', username: 'username', role: { Boss: 'admin', Manager: 'manager', Developer: 'operator' } },
  },
  {
    name: 'Rota System',
    slug: 'rota-system',
    category: 'Workforce & Shifts',
    description: 'Automated staff shift scheduling, attendance tracking, holiday allowances, and team rota conflict resolution.',
    url: 'https://rota-system-eka1-eight.vercel.app',
    sortOrder: 3,
    isActive: true,
    ssoEnabled: true,
    ssoProtocol: 'JWT_BEARER',
    clientId: 'rota-system',
    redirectUris: ['https://rota-system-eka1-eight.vercel.app/sso/callback'],
    integrationStatus: 'testing',
    attributeMapping: { email: 'email', username: 'username', role: { Boss: 'ADMIN', Manager: 'ADMIN', Developer: 'ADMIN', Accountant: 'ATTENDANCE_OPERATOR' } },
  },
  {
    name: 'Bicycle Purchase System',
    slug: 'bicycle-purchase-system',
    category: 'Procurement & Logistics',
    description: 'Fleet inventory ordering, vendor quote comparison, purchase approval chains, and delivery verification.',
    url: 'https://bicycle-uuue.vercel.app',
    sortOrder: 4,
    isActive: true,
    ssoEnabled: false,
    ssoProtocol: 'DIRECT_LAUNCH',
    clientId: 'bicycle-purchase-system',
    integrationStatus: 'compatibility_review_required',
  },
  {
    name: 'Task Manager',
    slug: 'task-manager',
    category: 'Project Execution',
    description: 'Cross-functional sprint coordination, milestone tracking, priority backlogs, and engineering delivery status.',
    url: 'https://task-manager-flame-five-73.vercel.app',
    sortOrder: 5,
    isActive: true,
    ssoEnabled: true,
    ssoProtocol: 'JWT_BEARER',
    clientId: 'task-manager',
    redirectUris: ['https://task-manager-flame-five-73.vercel.app/sso/callback'],
    integrationStatus: 'testing',
    attributeMapping: { email: 'email', username: 'username', role: { Boss: 'Admin', Manager: 'Manager', Developer: 'Member' } },
  },
];

/**
 * GET /api/software
 * Retrieve software records from MongoDB, enforcing role-based filtering
 */
exports.getAllSoftware = async (req, res, next) => {
  try {
    const dbStatus = getDbStatus();
    if (!dbStatus.connected) {
      return res.status(503).json({
        success: false,
        message: 'Database is currently disconnected. Cannot retrieve software records.',
        databaseStatus: dbStatus,
      });
    }

    const { category, isActive, search } = req.query;
    const query = {};

    // 1. Enforce Role-Based Access Rules
    // Accountant MUST ONLY receive Pakistan Expense Tracker and Rota System
    if (req.user && req.user.role === ROLES.ACCOUNTANT) {
      query.slug = { $in: ['pakistan-expense-tracker', 'rota-system'] };
    } else if (req.user && req.user.allowedSoftware && req.user.allowedSoftware.length > 0) {
      query._id = { $in: req.user.allowedSoftware };
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      const searchConditions = [
        { name: { $regex: q, $options: 'i' } },
        { slug: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ];
      if (query.slug) {
        query.$and = [{ slug: query.slug }, { $or: searchConditions }];
        delete query.slug;
      } else {
        query.$or = searchConditions;
      }
    }

    const softwareList = await Software.find(query).sort({ sortOrder: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: softwareList.length,
      data: softwareList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/software/:id
 * Retrieve a single software record by MongoDB ObjectId or Slug, verifying user authorization
 */
exports.getSoftwareById = async (req, res, next) => {
  try {
    const dbStatus = getDbStatus();
    if (!dbStatus.connected) {
      return res.status(503).json({
        success: false,
        message: 'Database is disconnected.',
      });
    }

    const { id } = req.params;
    let software = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      software = await Software.findById(id);
    } else {
      software = await Software.findOne({ slug: id.toLowerCase().trim() });
    }

    if (!software) {
      return res.status(404).json({
        success: false,
        message: `Software record '${id}' not found.`,
      });
    }

    // Role-based access validation on single item retrieval
    if (req.user) {
      const isAllowed = req.user.hasSoftwareAccess(software);
      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not authorized to view or access this application.',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: software,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/software/:id/launch
 * Authorize and audit application launch from central portal
 */
exports.launchSoftware = async (req, res, next) => {
  try {
    const dbStatus = getDbStatus();
    if (!dbStatus.connected) {
      return res.status(503).json({
        success: false,
        message: 'Database is disconnected.',
      });
    }

    const { id } = req.params;
    let software = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      software = await Software.findById(id);
    } else {
      software = await Software.findOne({ slug: id.toLowerCase().trim() });
    }

    if (!software) {
      return res.status(404).json({
        success: false,
        message: `Software record '${id}' not found.`,
      });
    }

    if (!software.isActive) {
      return res.status(403).json({
        success: false,
        message: `Application '${software.name}' is currently deactivated by portal administration.`,
      });
    }

    // Role-based access enforcement: Sarfraz Khan (Accountant) cannot launch UK Company or Task Manager!
    if (req.user) {
      const isAllowed = req.user.hasSoftwareAccess(software);
      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: `Access denied: Role '${req.user.role}' is not authorized to launch '${software.name}'.`,
        });
      }
    }

    // Record activity audit event for application launch
    await recordActivity({
      actorUserId: req.user ? req.user._id : null,
      action: 'APPLICATION_LAUNCHED',
      entityType: 'Software',
      entityId: software._id,
      details: {
        softwareName: software.name,
        slug: software.slug,
        targetUrl: software.url || 'Not configured',
      },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Launch authorized for ${software.name}`,
      data: {
        id: software._id,
        name: software.name,
        slug: software.slug,
        url: software.url,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/software
 * Create a new software record in MongoDB (Restricted to Boss / software.manage)
 */
exports.createSoftware = async (req, res, next) => {
  try {
    const dbStatus = getDbStatus();
    if (!dbStatus.connected) {
      return res.status(503).json({
        success: false,
        message: 'Database is disconnected. Cannot create software record.',
      });
    }

    const {
      name,
      slug,
      description,
      url,
      logoUrl,
      cloudinaryPublicId,
      category,
      isActive,
      sortOrder,
      ssoEnabled,
      ssoProtocol,
      clientId,
      clientSecret,
      redirectUris,
      postLogoutRedirectUri,
      integrationStatus,
      attributeMapping,
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Software name is required.',
      });
    }

    // Check slug collision
    const normalizedSlug = slug
      ? slug.toLowerCase().trim()
      : name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

    const existingSoftware = await Software.findOne({ slug: normalizedSlug });
    if (existingSoftware) {
      return res.status(409).json({
        success: false,
        message: `A software entry with slug '${normalizedSlug}' already exists. Please choose a unique name or slug.`,
      });
    }

    const newSoftware = await Software.create({
      name: name.trim(),
      slug: normalizedSlug,
      description: description ? description.trim() : '',
      url: url ? url.trim() : '',
      logoUrl: logoUrl ? logoUrl.trim() : '',
      cloudinaryPublicId: cloudinaryPublicId ? cloudinaryPublicId.trim() : '',
      category: category ? category.trim() : 'General',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
      ssoEnabled: ssoEnabled !== undefined ? Boolean(ssoEnabled) : false,
      ssoProtocol: ssoProtocol || 'DIRECT_LAUNCH',
      clientId: clientId ? clientId.trim() : '',
      clientSecret: clientSecret ? clientSecret.trim() : '',
      redirectUris: Array.isArray(redirectUris) ? redirectUris : [],
      postLogoutRedirectUri: postLogoutRedirectUri ? postLogoutRedirectUri.trim() : '',
      integrationStatus: integrationStatus || 'not_configured',
      attributeMapping: attributeMapping || undefined,
    });

    await recordActivity({
      actorUserId: req.user ? req.user._id : null,
      action: 'SOFTWARE_CREATED',
      entityType: 'Software',
      entityId: newSoftware._id,
      details: { name: newSoftware.name, slug: newSoftware.slug },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Software '${newSoftware.name}' registered successfully.`,
      data: newSoftware,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map((e) => e.message).join(', '),
      });
    }
    next(error);
  }
};

/**
 * PATCH /api/software/:id
 * Update an existing software record in MongoDB (Restricted to Boss / software.manage)
 */
exports.updateSoftware = async (req, res, next) => {
  try {
    const dbStatus = getDbStatus();
    if (!dbStatus.connected) {
      return res.status(503).json({
        success: false,
        message: 'Database is disconnected. Cannot update software record.',
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid software ID format: '${id}'.`,
      });
    }

    const software = await Software.findById(id);
    if (!software) {
      return res.status(404).json({
        success: false,
        message: `Software record '${id}' not found.`,
      });
    }

    const {
      name,
      slug,
      description,
      url,
      logoUrl,
      cloudinaryPublicId,
      category,
      isActive,
      sortOrder,
      ssoEnabled,
      ssoProtocol,
      clientId,
      clientSecret,
      redirectUris,
      postLogoutRedirectUri,
      integrationStatus,
      attributeMapping,
    } = req.body;

    // Check slug collision if slug changed
    if (slug && slug.toLowerCase().trim() !== software.slug) {
      const normalizedSlug = slug.toLowerCase().trim();
      const existing = await Software.findOne({ slug: normalizedSlug, _id: { $ne: id } });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Slug '${normalizedSlug}' is already in use by another application.`,
        });
      }
      software.slug = normalizedSlug;
    }

    // Handle Cloudinary logo replacement
    if (cloudinaryPublicId && software.cloudinaryPublicId && cloudinaryPublicId !== software.cloudinaryPublicId) {
      await deleteFromCloudinary(software.cloudinaryPublicId);
    }

    if (name !== undefined) software.name = name.trim();
    if (description !== undefined) software.description = description.trim();
    if (url !== undefined) software.url = url.trim();
    if (logoUrl !== undefined) software.logoUrl = logoUrl.trim();
    if (cloudinaryPublicId !== undefined) software.cloudinaryPublicId = cloudinaryPublicId.trim();
    if (category !== undefined) software.category = category.trim();
    if (isActive !== undefined) software.isActive = Boolean(isActive);
    if (sortOrder !== undefined) software.sortOrder = Number(sortOrder);
    if (ssoEnabled !== undefined) software.ssoEnabled = Boolean(ssoEnabled);
    if (ssoProtocol !== undefined) software.ssoProtocol = ssoProtocol;
    if (clientId !== undefined) software.clientId = clientId.trim();
    if (clientSecret !== undefined) software.clientSecret = clientSecret.trim();
    if (redirectUris !== undefined) software.redirectUris = Array.isArray(redirectUris) ? redirectUris : [];
    if (postLogoutRedirectUri !== undefined) software.postLogoutRedirectUri = postLogoutRedirectUri.trim();
    if (integrationStatus !== undefined) software.integrationStatus = integrationStatus;
    if (attributeMapping !== undefined) software.attributeMapping = attributeMapping;

    await software.save();

    await recordActivity({
      actorUserId: req.user ? req.user._id : null,
      action: 'SOFTWARE_UPDATED',
      entityType: 'Software',
      entityId: software._id,
      details: { name: software.name, slug: software.slug, isActive: software.isActive },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Software '${software.name}' updated successfully.`,
      data: software,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map((e) => e.message).join(', '),
      });
    }
    next(error);
  }
};

/**
 * DELETE /api/software/:id
 * Remove a software record and delete associated Cloudinary asset
 */
exports.deleteSoftware = async (req, res, next) => {
  try {
    const dbStatus = getDbStatus();
    if (!dbStatus.connected) {
      return res.status(503).json({
        success: false,
        message: 'Database is disconnected. Cannot delete software record.',
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid software ID format: '${id}'.`,
      });
    }

    const software = await Software.findById(id);
    if (!software) {
      return res.status(404).json({
        success: false,
        message: `Software record '${id}' not found.`,
      });
    }

    if (software.cloudinaryPublicId) {
      await deleteFromCloudinary(software.cloudinaryPublicId);
    }

    await Software.findByIdAndDelete(id);

    await recordActivity({
      actorUserId: req.user ? req.user._id : null,
      action: 'SOFTWARE_DELETED',
      entityType: 'Software',
      entityId: id,
      details: { name: software.name, slug: software.slug },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Software '${software.name}' has been permanently deleted from MongoDB registry.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/software/seed-development
 * Populate the 5 initial applications if database collection is empty
 */
exports.seedDevelopmentSoftware = async (req, res, next) => {
  try {
    const dbStatus = getDbStatus();
    if (!dbStatus.connected) {
      return res.status(503).json({
        success: false,
        message: 'Database is disconnected. Cannot seed records.',
      });
    }

    const existingCount = await Software.countDocuments();
    if (existingCount > 0) {
      return res.status(200).json({
        success: true,
        message: `Software collection already contains ${existingCount} application(s). Seed skipped.`,
        count: existingCount,
      });
    }

    const inserted = await Software.insertMany(SEED_APPLICATIONS);

    await recordActivity({
      actorUserId: req.user ? req.user._id : null,
      action: 'SOFTWARE_SEEDED_INITIAL',
      entityType: 'Software',
      details: { count: inserted.length },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Successfully seeded ${inserted.length} initial applications into MongoDB.`,
      data: inserted,
    });
  } catch (error) {
    next(error);
  }
};
