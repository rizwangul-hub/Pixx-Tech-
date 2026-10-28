const mongoose = require('mongoose');
const Software = require('../models/Software');
const {
  generateSSOTicket,
  verifySSOTicket,
  redactSensitiveData,
} = require('../services/ssoService');
const { recordActivity } = require('../utils/auditLogger');
const { getDbStatus } = require('../config/db');
const logger = require('../utils/logger');

/**
 * POST /api/sso/initiate
 * Initiate SSO flow: verify user permissions, check software config, issue signed SSO ticket
 */
exports.initiateSSO = async (req, res, next) => {
  try {
    const dbStatus = getDbStatus();
    if (!dbStatus.connected) {
      return res.status(503).json({
        success: false,
        message: 'Database is disconnected. Cannot initiate SSO.',
      });
    }

    const { softwareId, redirectUri, state, nonce } = req.body;

    if (!softwareId) {
      return res.status(400).json({
        success: false,
        message: 'Software identifier (ID or slug) is required to initiate SSO.',
      });
    }

    let software;
    if (mongoose.Types.ObjectId.isValid(softwareId)) {
      software = await Software.findById(softwareId);
    } else {
      software = await Software.findOne({ slug: softwareId.toLowerCase().trim() });
    }

    if (!software) {
      return res.status(404).json({
        success: false,
        message: `Application '${softwareId}' not found in registry.`,
      });
    }

    if (!software.isActive) {
      return res.status(403).json({
        success: false,
        message: `Application '${software.name}' is currently deactivated.`,
      });
    }

    // Role-based access enforcement:
    // Sarfraz Khan (Accountant) can ONLY access Pakistan Expense Tracker and Rota System!
    const isAllowed = req.user.hasSoftwareAccess(software);
    if (!isAllowed) {
      await recordActivity({
        actorUserId: req.user._id,
        action: 'SSO_ACCESS_DENIED',
        entityType: 'Software',
        entityId: software._id,
        details: {
          softwareName: software.name,
          softwareSlug: software.slug,
          userRole: req.user.role,
          reason: 'User lacks software permission',
        },
        req,
      });

      return res.status(403).json({
        success: false,
        message: `Access denied: Role '${req.user.role}' is not authorized to access '${software.name}'.`,
      });
    }

    // Check if SSO is enabled or requires direct launch
    if (!software.ssoEnabled && software.ssoProtocol !== 'DIRECT_LAUNCH') {
      return res.status(400).json({
        success: false,
        message: `SSO is not currently enabled for '${software.name}'. Current status: ${software.integrationStatus}`,
        data: {
          integrationStatus: software.integrationStatus,
          ssoProtocol: software.ssoProtocol,
        },
      });
    }

    // Validate redirectUri if provided
    let finalRedirectUri = redirectUri || (software.redirectUris && software.redirectUris[0]) || null;
    if (redirectUri && software.redirectUris && software.redirectUris.length > 0) {
      const isAllowedRedirect = software.redirectUris.some((uri) =>
        redirectUri.toLowerCase().startsWith(uri.toLowerCase())
      );
      if (!isAllowedRedirect) {
        return res.status(400).json({
          success: false,
          message: `Invalid redirect URI '${redirectUri}'. It is not in the whitelist for '${software.name}'.`,
        });
      }
    }

    // Ensure clientId exists
    if (!software.clientId) {
      software.clientId = software.slug;
    }

    // Generate cryptographically signed ticket
    const ticketResult = generateSSOTicket({
      user: req.user,
      software,
      state,
      nonce,
      redirectUri: finalRedirectUri,
    });

    // Record audit event with REDACTED ticket / secrets
    await recordActivity({
      actorUserId: req.user._id,
      action: 'SSO_TICKET_ISSUED',
      entityType: 'Software',
      entityId: software._id,
      details: redactSensitiveData({
        softwareName: software.name,
        softwareSlug: software.slug,
        clientId: software.clientId,
        ticketId: ticketResult.ticketId,
        nonce: ticketResult.nonce,
        state: ticketResult.state,
        redirectUri: ticketResult.redirectUri,
        expiresIn: ticketResult.expiresIn,
        ticket: ticketResult.ticket, // Will be redacted by redactSensitiveData
      }),
      req,
    });

    res.status(200).json({
      success: true,
      message: `SSO authorization ticket issued for ${software.name}`,
      data: {
        ticket: ticketResult.ticket,
        ticketId: ticketResult.ticketId,
        expiresIn: ticketResult.expiresIn,
        redirectUri: ticketResult.redirectUri,
        targetUrl: software.url,
        software: {
          id: software._id,
          name: software.name,
          slug: software.slug,
          ssoProtocol: software.ssoProtocol,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/sso/verify
 * Target application backend calls this endpoint to verify an SSO ticket and extract verified identity
 */
exports.verifySSO = async (req, res, next) => {
  try {
    const { ticket, clientId } = req.body;

    if (!ticket) {
      return res.status(400).json({
        success: false,
        message: 'Ticket is required for verification.',
      });
    }

    let decoded;
    try {
      decoded = verifySSOTicket(ticket, clientId);
    } catch (verifyError) {
      logger.warn(`SSO ticket verification rejected: ${verifyError.message}`);
      return res.status(401).json({
        success: false,
        code: verifyError.code || 'VERIFICATION_FAILED',
        message: verifyError.message,
      });
    }

    // Audit verification success (with sensitive fields redacted)
    await recordActivity({
      actorUserId: decoded.sub,
      action: 'SSO_TICKET_VERIFIED',
      entityType: 'Software',
      entityId: decoded.softwareId,
      details: redactSensitiveData({
        userEmail: decoded.email,
        audience: decoded.aud,
        softwareSlug: decoded.softwareSlug,
        ticketId: decoded.jti,
        ticket, // Redacted
      }),
      req,
    });

    res.status(200).json({
      success: true,
      message: 'SSO ticket successfully verified.',
      data: {
        sub: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        mappedRole: decoded.mappedRole,
        softwareId: decoded.softwareId,
        softwareSlug: decoded.softwareSlug,
        ticketId: decoded.jti,
        nonce: decoded.nonce,
        state: decoded.state,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/sso/status/:softwareId
 * Get SSO integration status and configuration for an application
 */
exports.getSSOStatus = async (req, res, next) => {
  try {
    const { softwareId } = req.params;

    let software;
    if (mongoose.Types.ObjectId.isValid(softwareId)) {
      software = await Software.findById(softwareId);
    } else {
      software = await Software.findOne({ slug: softwareId.toLowerCase().trim() });
    }

    if (!software) {
      return res.status(404).json({
        success: false,
        message: `Software '${softwareId}' not found.`,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: software._id,
        name: software.name,
        slug: software.slug,
        ssoEnabled: software.ssoEnabled,
        ssoProtocol: software.ssoProtocol,
        clientId: software.clientId,
        redirectUris: software.redirectUris,
        postLogoutRedirectUri: software.postLogoutRedirectUri,
        integrationStatus: software.integrationStatus,
        lastIntegrationCheck: software.lastIntegrationCheck,
        attributeMapping: software.attributeMapping,
      },
    });
  } catch (error) {
    next(error);
  }
};
