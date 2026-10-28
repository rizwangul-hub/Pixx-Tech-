const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Atomic used tickets cache for replay prevention (stores jti -> expiryTimestamp)
const usedTicketsCache = new Map();
const pendingRedemptions = new Set(); // Concurrency lock for inflight redemptions

// Periodically clean up expired ticket IDs from memory
setInterval(() => {
  const now = Date.now();
  for (const [jti, expMs] of usedTicketsCache.entries()) {
    if (now > expMs) {
      usedTicketsCache.delete(jti);
    }
  }
}, 60000).unref(); // unref so it won't block process exit in tests

const SSO_ISSUER = 'https://portal.pixxtech.internal';
const ALLOWED_ALGORITHMS = ['HS256'];

const getSSOSecret = () => {
  return process.env.SSO_SECRET || process.env.JWT_SECRET || 'pixxtech_central_portal_sso_secret_2026';
};

/**
 * Redact sensitive fields (tokens, secrets, passwords) from metadata/audit objects
 */
const redactSensitiveData = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const sensitiveKeys = ['ticket', 'token', 'clientSecret', 'password', 'secret', 'authorization', 'refreshToken'];
  const sanitized = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = redactSensitiveData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

/**
 * Generate a short-lived (5 min), cryptographically signed SSO ticket
 */
const generateSSOTicket = ({ user, software, state, nonce, redirectUri }) => {
  if (!user || !user._id) {
    throw new Error('Valid user context is required to issue SSO ticket.');
  }
  if (!software || !software.clientId) {
    throw new Error('Valid registered software with clientId is required.');
  }

  const jti = crypto.randomBytes(16).toString('hex');
  const secret = getSSOSecret();
  const ticketNonce = nonce || crypto.randomBytes(12).toString('hex');

  // Map roles if custom mapping is configured on the software record
  let mappedRole = user.role;
  if (software.attributeMapping && software.attributeMapping.role && software.attributeMapping.role[user.role]) {
    mappedRole = software.attributeMapping.role[user.role];
  }

  // Derive stable username from user record or email prefix
  const username = user.username || (user.email ? user.email.split('@')[0].toLowerCase().trim() : 'user');

  const payload = {
    iss: SSO_ISSUER,
    sub: user._id.toString(),
    aud: software.clientId,
    softwareId: software._id.toString(),
    softwareSlug: software.slug,
    email: user.email,
    username,
    name: user.name,
    role: user.role,
    mappedRole,
    jti,
    nonce: ticketNonce,
    state: state || null,
    redirectUri: redirectUri || (software.redirectUris && software.redirectUris[0]) || null,
  };

  const ticket = jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: '5m', // 5 minutes validity
  });

  return {
    ticket,
    ticketId: jti,
    expiresIn: 300,
    nonce: ticketNonce,
    state: state || null,
    redirectUri: payload.redirectUri,
    targetUrl: software.url,
  };
};

/**
 * Verify and exchange an SSO ticket with atomic replay and concurrency protection
 */
const verifySSOTicket = (ticket, expectedAudience = null) => {
  if (!ticket || typeof ticket !== 'string') {
    throw new Error('SSO ticket is required for verification.');
  }

  const secret = getSSOSecret();

  let decoded;
  try {
    decoded = jwt.verify(ticket, secret, {
      issuer: SSO_ISSUER,
      algorithms: ALLOWED_ALGORITHMS,
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      const expiredErr = new Error('SSO ticket has expired. Please re-authenticate via Central Portal.');
      expiredErr.code = 'TICKET_EXPIRED';
      throw expiredErr;
    }
    const invalidErr = new Error(`Invalid SSO ticket signature or structure: ${err.message}`);
    invalidErr.code = 'TICKET_INVALID';
    throw invalidErr;
  }

  // Validate required claims
  if (!decoded.jti || !decoded.sub || !decoded.email || !decoded.aud) {
    const claimsErr = new Error('SSO ticket is missing mandatory identity claims (jti, sub, email, or aud).');
    claimsErr.code = 'MISSING_CLAIMS';
    throw claimsErr;
  }

  // Validate audience if specified
  if (expectedAudience && decoded.aud !== expectedAudience) {
    const audErr = new Error(`Ticket audience mismatch. Expected: '${expectedAudience}', Got: '${decoded.aud}'`);
    audErr.code = 'AUDIENCE_MISMATCH';
    throw audErr;
  }

  // Atomic Replay & Concurrency Prevention
  if (usedTicketsCache.has(decoded.jti) || pendingRedemptions.has(decoded.jti)) {
    const replayErr = new Error('SSO ticket has already been redeemed or is currently being processed (replay detected).');
    replayErr.code = 'TICKET_REPLAYED';
    throw replayErr;
  }

  // Lock ticket in-flight
  pendingRedemptions.add(decoded.jti);
  try {
    const expMs = (decoded.exp || Math.floor(Date.now() / 1000) + 300) * 1000;
    usedTicketsCache.set(decoded.jti, expMs);
  } finally {
    pendingRedemptions.delete(decoded.jti);
  }

  return decoded;
};

module.exports = {
  SSO_ISSUER,
  ALLOWED_ALGORITHMS,
  getSSOSecret,
  generateSSOTicket,
  verifySSOTicket,
  redactSensitiveData,
};
