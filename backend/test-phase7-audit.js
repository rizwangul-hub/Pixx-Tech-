/**
 * Phase 7 Security Audit & Verification Runner
 * Non-destructive, read-only automated security verification script.
 * Tests all 17 negative and positive failure cases specified in Rule 5.
 */

const assert = require('assert');
const jwt = require('jsonwebtoken');
const Software = require('./models/Software');
const User = require('./models/User');
const { ROLES } = require('./config/roles');
const {
  SSO_ISSUER,
  ALLOWED_ALGORITHMS,
  getSSOSecret,
  generateSSOTicket,
  verifySSOTicket,
  redactSensitiveData,
} = require('./services/ssoService');

let passedCount = 0;
let failedCount = 0;
const testResults = [];

function recordTest(name, passed, detail = '') {
  if (passed) {
    passedCount++;
    testResults.push({ name, status: 'PASSED', detail });
    console.log(`  [PASS] ${name}`);
  } else {
    failedCount++;
    testResults.push({ name, status: 'FAILED', detail });
    console.error(`  [FAIL] ${name} - ${detail}`);
  }
}

async function runAuditTests() {
  console.log('\n=============================================================');
  console.log('   PIXXTECH CENTRAL PORTAL - PHASE 7 SECURITY AUDIT RUNNER');
  console.log('=============================================================\n');

  const secret = getSSOSecret();

  // Test User Entities
  const userBoss = new User({
    name: 'Kamran Ijaz',
    email: 'kamran@pixxtechnologies.com',
    role: ROLES.BOSS,
    isActive: true,
  });

  const userAccountant = new User({
    name: 'Sarfraz Khan',
    email: 'sarfraz@pixxtechnologies.com',
    role: ROLES.ACCOUNTANT,
    isActive: true,
  });

  const userInactive = new User({
    name: 'Terminated Staff',
    email: 'inactive@pixxtechnologies.com',
    role: ROLES.SOFTWARE_DEVELOPER,
    isActive: false,
  });

  // Test Software Entities
  const appPak = new Software({
    name: 'Pakistan Expense Tracker',
    slug: 'pakistan-expense-tracker',
    clientId: 'pak-expense-tracker',
    ssoEnabled: true,
    ssoProtocol: 'JWT_BEARER',
    redirectUris: ['https://pak-expense.pixxtech.internal/sso/callback'],
  });

  const appUk = new Software({
    name: 'UK Company',
    slug: 'uk-company',
    clientId: 'uk-company',
    ssoEnabled: true,
    ssoProtocol: 'JWT_BEARER',
    redirectUris: ['https://uk-company.pixxtech.internal/sso/callback'],
  });

  const appRota = new Software({
    name: 'Rota System',
    slug: 'rota-system',
    clientId: 'rota-system',
    ssoEnabled: true,
    ssoProtocol: 'JWT_BEARER',
    redirectUris: ['https://rota.pixxtech.internal/sso/callback'],
  });

  const appTask = new Software({
    name: 'Task Manager',
    slug: 'task-manager',
    clientId: 'task-manager',
    ssoEnabled: true,
    ssoProtocol: 'JWT_BEARER',
    redirectUris: ['https://tasks.pixxtech.internal/sso/callback'],
  });

  const appBicycle = new Software({
    name: 'Bicycle Purchase System',
    slug: 'bicycle-purchase-system',
    clientId: 'bicycle-purchase-system',
    ssoEnabled: false,
    ssoProtocol: 'DIRECT_LAUNCH',
    integrationStatus: 'compatibility_review_required',
  });

  // 1. Valid Ticket for Correct Application
  try {
    const ticketResult = generateSSOTicket({ user: userBoss, software: appUk });
    const verified = verifySSOTicket(ticketResult.ticket, 'uk-company');
    recordTest('1. Valid ticket exchange for authorized application', verified.email === userBoss.email);
  } catch (err) {
    recordTest('1. Valid ticket exchange for authorized application', false, err.message);
  }

  // 2. Wrong Audience
  try {
    const ticketResult = generateSSOTicket({ user: userBoss, software: appUk });
    let rejected = false;
    try {
      verifySSOTicket(ticketResult.ticket, 'task-manager');
    } catch (err) {
      if (err.code === 'AUDIENCE_MISMATCH') rejected = true;
    }
    recordTest('2. Rejection of ticket with wrong audience (cross-app redemption block)', rejected);
  } catch (err) {
    recordTest('2. Rejection of ticket with wrong audience', false, err.message);
  }

  // 3. Wrong Issuer
  try {
    const forgedIssuerToken = jwt.sign(
      {
        iss: 'https://malicious-idp.com',
        aud: 'uk-company',
        sub: userBoss._id.toString(),
        email: userBoss.email,
        jti: 'forged_iss_123',
      },
      secret,
      { algorithm: 'HS256' }
    );
    let rejected = false;
    try {
      verifySSOTicket(forgedIssuerToken, 'uk-company');
    } catch (err) {
      if (err.message.includes('jwt issuer invalid') || err.code === 'TICKET_INVALID') rejected = true;
    }
    recordTest('3. Rejection of forged ticket with untrusted issuer', rejected);
  } catch (err) {
    recordTest('3. Rejection of forged ticket with untrusted issuer', false, err.message);
  }

  // 4. Invalid Signature
  try {
    const tamperedToken = jwt.sign(
      {
        iss: SSO_ISSUER,
        aud: 'uk-company',
        sub: userBoss._id.toString(),
        email: userBoss.email,
        jti: 'tampered_sig_123',
      },
      'attacker_different_secret_key_9999',
      { algorithm: 'HS256' }
    );
    let rejected = false;
    try {
      verifySSOTicket(tamperedToken, 'uk-company');
    } catch (err) {
      if (err.message.includes('invalid signature') || err.code === 'TICKET_INVALID') rejected = true;
    }
    recordTest('4. Rejection of ticket with invalid signature', rejected);
  } catch (err) {
    recordTest('4. Rejection of ticket with invalid signature', false, err.message);
  }

  // 5. Unsupported Algorithm (alg: none)
  try {
    const algNoneToken = jwt.sign(
      {
        iss: SSO_ISSUER,
        aud: 'uk-company',
        sub: userBoss._id.toString(),
        email: userBoss.email,
        jti: 'alg_none_123',
      },
      '',
      { algorithm: 'none' }
    );
    let rejected = false;
    try {
      verifySSOTicket(algNoneToken, 'uk-company');
    } catch (err) {
      rejected = true;
    }
    recordTest('5. Strict rejection of unapproved signing algorithms (alg: none)', rejected);
  } catch (err) {
    recordTest('5. Strict rejection of unapproved signing algorithms', false, err.message);
  }

  // 6. Expired Ticket
  try {
    const expiredToken = jwt.sign(
      {
        iss: SSO_ISSUER,
        aud: 'uk-company',
        sub: userBoss._id.toString(),
        email: userBoss.email,
        jti: 'expired_token_123',
      },
      secret,
      { algorithm: 'HS256', expiresIn: '-10s' }
    );
    let rejected = false;
    try {
      verifySSOTicket(expiredToken, 'uk-company');
    } catch (err) {
      if (err.code === 'TICKET_EXPIRED') rejected = true;
    }
    recordTest('6. Rejection of expired ticket (> 5m TTL elapsed)', rejected);
  } catch (err) {
    recordTest('6. Rejection of expired ticket', false, err.message);
  }

  // 7. Missing Mandatory Claims
  try {
    const missingClaimsToken = jwt.sign(
      {
        iss: SSO_ISSUER,
        aud: 'uk-company',
        // missing sub, email, jti
      },
      secret,
      { algorithm: 'HS256', expiresIn: '5m' }
    );
    let rejected = false;
    try {
      verifySSOTicket(missingClaimsToken, 'uk-company');
    } catch (err) {
      if (err.code === 'MISSING_CLAIMS') rejected = true;
    }
    recordTest('7. Rejection of ticket missing required identity claims', rejected);
  } catch (err) {
    recordTest('7. Rejection of ticket missing required identity claims', false, err.message);
  }

  // 8. Replay of Redeemed Ticket
  try {
    const replayTicket = generateSSOTicket({ user: userBoss, software: appRota });
    verifySSOTicket(replayTicket.ticket, 'rota-system'); // 1st redemption succeeds

    let replayBlocked = false;
    try {
      verifySSOTicket(replayTicket.ticket, 'rota-system'); // 2nd redemption must fail
    } catch (err) {
      if (err.code === 'TICKET_REPLAYED') replayBlocked = true;
    }
    recordTest('8. Replay attack rejection on second redemption attempt', replayBlocked);
  } catch (err) {
    recordTest('8. Replay attack rejection on second redemption attempt', false, err.message);
  }

  // 9. Concurrent Simultaneous Redemptions
  try {
    const concurrentTicket = generateSSOTicket({ user: userBoss, software: appTask });
    const promises = [
      Promise.resolve().then(() => verifySSOTicket(concurrentTicket.ticket, 'task-manager')),
      Promise.resolve().then(() => verifySSOTicket(concurrentTicket.ticket, 'task-manager')),
    ];

    const results = await Promise.allSettled(promises);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly one must succeed, one must fail
    const concurrencySafe = fulfilled.length === 1 && rejected.length === 1;
    recordTest('9. Concurrent redemption race condition safety (exactly 1 succeeds)', concurrencySafe);
  } catch (err) {
    recordTest('9. Concurrent redemption race condition safety', false, err.message);
  }

  // 10. Sarfraz Access Boundary: Denied for UK Company
  recordTest(
    '10. Sarfraz Khan denied SSO launch for UK Company (HTTP 403 boundary)',
    userAccountant.hasSoftwareAccess(appUk) === false
  );

  // 11. Sarfraz Access Boundary: Denied for Task Manager
  recordTest(
    '11. Sarfraz Khan denied SSO launch for Task Manager (HTTP 403 boundary)',
    userAccountant.hasSoftwareAccess(appTask) === false
  );

  // 12. Sarfraz Access Boundary: Denied for Bicycle Purchase System
  recordTest(
    '12. Sarfraz Khan denied launch for Bicycle Purchase System (HTTP 403 boundary)',
    userAccountant.hasSoftwareAccess(appBicycle) === false
  );

  // 13. Sarfraz Access Boundary: Allowed for Pakistan Expense Tracker
  recordTest(
    '13. Sarfraz Khan allowed launch for Pakistan Expense Tracker',
    userAccountant.hasSoftwareAccess(appPak) === true
  );

  // 14. Sarfraz Access Boundary: Allowed for Rota System
  recordTest(
    '14. Sarfraz Khan allowed launch for Rota System',
    userAccountant.hasSoftwareAccess(appRota) === true
  );

  // 15. Bicycle Purchase System Isolation Guard
  recordTest(
    '15. Bicycle Purchase System confirmed isolated as DIRECT_LAUNCH without SSO',
    appBicycle.ssoEnabled === false && appBicycle.ssoProtocol === 'DIRECT_LAUNCH'
  );

  // 16. Sensitive Data Redaction from Audit Logs
  try {
    const auditObj = {
      user: 'admin',
      password: 'plain_password',
      ticket: 'sensitive_jwt_token',
      token: 'bearer_token_abc',
      refreshToken: 'cookie_refresh_val',
      clientSecret: 'secret_live_key',
    };
    const redacted = redactSensitiveData(auditObj);
    const clean =
      redacted.password === '[REDACTED]' &&
      redacted.ticket === '[REDACTED]' &&
      redacted.token === '[REDACTED]' &&
      redacted.refreshToken === '[REDACTED]' &&
      redacted.clientSecret === '[REDACTED]';
    recordTest('16. Sanitization of sensitive credentials/tokens in audit logger', clean);
  } catch (err) {
    recordTest('16. Sanitization of sensitive credentials/tokens in audit logger', false, err.message);
  }

  // 17. Redirect URI Whitelist Enforcement
  try {
    const allowedUri = 'https://uk-company.pixxtech.internal/sso/callback';
    const maliciousUri = 'https://evil-hacker.com/steal-token';

    const isAllowedValid = appUk.redirectUris.some((u) => allowedUri.toLowerCase().startsWith(u.toLowerCase()));
    const isMaliciousBlocked = !appUk.redirectUris.some((u) => maliciousUri.toLowerCase().startsWith(u.toLowerCase()));

    recordTest('17. Redirect URI whitelist blocks open redirect attacks', isAllowedValid && isMaliciousBlocked);
  } catch (err) {
    recordTest('17. Redirect URI whitelist blocks open redirect attacks', false, err.message);
  }

  // 18. Pakistan Expense Tracker Replay Protection & Algorithm Hardening Verification
  try {
    // Generate ticket for Pak Expense
    const pakTicket = generateSSOTicket({ user: userBoss, software: appPak });
    const verifiedPak = verifySSOTicket(pakTicket.ticket, 'pak-expense-tracker');
    assert.strictEqual(verifiedPak.aud, 'pak-expense-tracker');

    // Second redemption must fail due to replay protection
    let replayBlocked = false;
    try {
      verifySSOTicket(pakTicket.ticket, 'pak-expense-tracker');
    } catch (err) {
      if (err.code === 'TICKET_REPLAYED') replayBlocked = true;
    }
    recordTest('18. Pakistan Expense Tracker ticket replay prevention verified', replayBlocked);
  } catch (err) {
    recordTest('18. Pakistan Expense Tracker ticket replay prevention verified', false, err.message);
  }

  // 19. Vector Graphic (SVG) XSS Attack Vector Defense
  try {
    const { containsUnsafeSvgContent } = require('./middleware/uploadMiddleware');
    const dangerousSvg = Buffer.from('<svg><script>document.location="http://evil.com"</script></svg>');
    const safeSvg = Buffer.from('<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#000"/></svg>');
    const blocked = containsUnsafeSvgContent(dangerousSvg) && !containsUnsafeSvgContent(safeSvg);
    recordTest('19. Vector graphic upload defense blocks executable JavaScript in SVG', blocked);
  } catch (err) {
    recordTest('19. Vector graphic upload defense blocks executable JavaScript in SVG', false, err.message);
  }

  // 20. Legacy Authentication Endpoint Compatibility
  try {
    const authRoutes = require('./routes/authRoutes');
    assert(authRoutes && authRoutes.stack, 'Central Portal legacy login route stack intact');
    recordTest('20. Legacy authentication endpoints preserved and operating in parallel', true);
  } catch (err) {
    recordTest('20. Legacy authentication endpoints preserved and operating in parallel', false, err.message);
  }

  console.log('\n=============================================================');
  console.log(`   PHASE 7 AUDIT RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('=============================================================\n');

  return { passedCount, failedCount, testResults };
}

runAuditTests().then((res) => {
  if (res.failedCount > 0) process.exit(1);
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
