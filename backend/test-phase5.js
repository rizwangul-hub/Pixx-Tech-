/**
 * Phase 5 SSO Architecture & Application Compatibility Verification Suite
 * Tests Software model SSO fields, token generation, replay protection,
 * role-based access restrictions (Sarfraz Khan isolation), audit log redaction,
 * and the Pakistan Expense Tracker SSO exchange pilot.
 */

const assert = require('assert');
const jwt = require('jsonwebtoken');
const Software = require('./models/Software');
const {
  SSO_ISSUER,
  getSSOSecret,
  generateSSOTicket,
  verifySSOTicket,
  redactSensitiveData,
} = require('./services/ssoService');
const { ROLES } = require('./config/roles');

let testsPassed = 0;
let testsFailed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    testsFailed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    testsFailed++;
  }
}

async function main() {
  console.log('\n========================================================');
  console.log('   PIXXTECH CENTRAL PORTAL - PHASE 5 TEST SUITE');
  console.log('========================================================\n');

  // Group 1: Software Model SSO Schema & Defaults
  console.log('1. Software Model SSO Schema & Integration Status');

  runTest('Software model contains SSO fields with correct defaults', () => {
    const s = new Software({
      name: 'Test App',
      slug: 'test-app',
      url: 'https://test.pixxtech.internal',
    });
    assert.strictEqual(s.ssoEnabled, false, 'ssoEnabled default should be false');
    assert.strictEqual(s.ssoProtocol, 'DIRECT_LAUNCH', 'ssoProtocol default should be DIRECT_LAUNCH');
    assert.strictEqual(s.integrationStatus, 'not_configured', 'integrationStatus default should be not_configured');
    assert.deepStrictEqual(s.redirectUris, [], 'redirectUris default should be an empty array');
    assert.strictEqual(s.lastIntegrationCheck, null, 'lastIntegrationCheck default should be null');
    assert.strictEqual(typeof s.attributeMapping, 'object', 'attributeMapping should be an object');
  });

  runTest('Software model validates ssoProtocol enum values', () => {
    const validProtocols = ['OIDC', 'SAML', 'JWT_BEARER', 'CUSTOM', 'DIRECT_LAUNCH'];
    for (const proto of validProtocols) {
      const s = new Software({ name: 'Valid', slug: `valid-${proto.toLowerCase()}`, ssoProtocol: proto });
      const err = s.validateSync();
      assert(!err || !err.errors.ssoProtocol, `Protocol ${proto} should be valid`);
    }

    const invalid = new Software({ name: 'Invalid', slug: 'invalid-proto', ssoProtocol: 'UNSUPPORTED_PROTOCOL' });
    const err = invalid.validateSync();
    assert(err && err.errors.ssoProtocol, 'Unsupported protocol should fail validation');
  });

  runTest('Software model validates integrationStatus enum values', () => {
    const validStatuses = ['not_configured', 'compatibility_review_required', 'testing', 'verified', 'disabled'];
    for (const st of validStatuses) {
      const s = new Software({ name: 'Valid', slug: `valid-${st}`, integrationStatus: st });
      const err = s.validateSync();
      assert(!err || !err.errors.integrationStatus, `Status ${st} should be valid`);
    }

    const invalid = new Software({ name: 'Invalid', slug: 'invalid-status', integrationStatus: 'BROKEN_STATUS' });
    const err = invalid.validateSync();
    assert(err && err.errors.integrationStatus, 'Unsupported status should fail validation');
  });

  // Group 2: SSO Token Generation & Claims Verification
  console.log('\n2. Cryptographic SSO Ticket Generation & Lifecycle');

  const mockUser = {
    _id: '671ee1234567890abcdef001',
    name: 'Fahad Rasheed',
    email: 'fahad@pixxtechnologies.com',
    role: 'Manager',
  };

  const mockSoftware = {
    _id: '671ee1234567890abcdef999',
    name: 'Pakistan Expense Tracker',
    slug: 'pakistan-expense-tracker',
    clientId: 'pak-expense-tracker',
    url: 'https://pak-expense.pixxtech.internal',
    redirectUris: ['https://pak-expense.pixxtech.internal/sso/callback'],
    attributeMapping: {
      role: {
        Manager: 'ADMIN_PUBLISHER',
        Accountant: 'DATA_ENTRY',
      },
    },
  };

  let generatedTicket = null;

  runTest('generateSSOTicket issues signed JWT with valid OIDC claims and 5m expiry', () => {
    const ticketResult = generateSSOTicket({
      user: mockUser,
      software: mockSoftware,
      state: 'xyzState123',
      nonce: 'nonce987',
    });

    assert(ticketResult.ticket, 'Should generate a ticket string');
    assert.strictEqual(ticketResult.expiresIn, 300, 'Ticket must expire in 300 seconds (5 min)');
    assert.strictEqual(ticketResult.state, 'xyzState123');
    assert.strictEqual(ticketResult.nonce, 'nonce987');
    assert.strictEqual(ticketResult.redirectUri, 'https://pak-expense.pixxtech.internal/sso/callback');

    // Decode and inspect claims
    const decoded = jwt.decode(ticketResult.ticket);
    assert.strictEqual(decoded.iss, SSO_ISSUER, 'Issuer must be Central Portal');
    assert.strictEqual(decoded.sub, mockUser._id, 'Subject must be user _id');
    assert.strictEqual(decoded.aud, 'pak-expense-tracker', 'Audience must be clientId');
    assert.strictEqual(decoded.email, mockUser.email);
    assert.strictEqual(decoded.role, 'Manager');
    assert.strictEqual(decoded.mappedRole, 'ADMIN_PUBLISHER', 'Role mapping should map Manager -> ADMIN_PUBLISHER');
    assert(decoded.exp - decoded.iat <= 300, 'Expiry window must be 5 minutes');

    generatedTicket = ticketResult.ticket;
  });

  runTest('verifySSOTicket successfully validates ticket and prevents replay attack', () => {
    const decoded = verifySSOTicket(generatedTicket, 'pak-expense-tracker');
    assert.strictEqual(decoded.email, mockUser.email);
    assert.strictEqual(decoded.sub, mockUser._id);

    // Immediate replay attempt with the same ticket should fail
    let replayed = false;
    try {
      verifySSOTicket(generatedTicket, 'pak-expense-tracker');
      replayed = true;
    } catch (err) {
      assert.strictEqual(err.code, 'TICKET_REPLAYED', 'Should reject replayed ticket');
    }
    assert.strictEqual(replayed, false, 'Ticket must not be redeemable more than once');
  });

  runTest('verifySSOTicket rejects audience mismatch', () => {
    const ticketResult = generateSSOTicket({
      user: mockUser,
      software: mockSoftware,
    });

    let mismatch = false;
    try {
      verifySSOTicket(ticketResult.ticket, 'wrong-client-id');
      mismatch = true;
    } catch (err) {
      assert.strictEqual(err.code, 'AUDIENCE_MISMATCH');
    }
    assert.strictEqual(mismatch, false, 'Audience mismatch must be rejected');
  });

  runTest('verifySSOTicket rejects expired ticket', () => {
    // Generate a pre-expired token
    const secret = getSSOSecret();
    const expiredToken = jwt.sign(
      {
        iss: SSO_ISSUER,
        sub: mockUser._id,
        aud: 'pak-expense-tracker',
        jti: 'expired-jti-123',
      },
      secret,
      { expiresIn: '-1s' }
    );

    let passed = false;
    try {
      verifySSOTicket(expiredToken, 'pak-expense-tracker');
      passed = true;
    } catch (err) {
      assert.strictEqual(err.code, 'TICKET_EXPIRED');
    }
    assert.strictEqual(passed, false, 'Expired ticket must be rejected');
  });

  // Group 3: Sensitive Data Redaction for Audit Logs
  console.log('\n3. Security & Sensitive Data Redaction');

  runTest('redactSensitiveData scrubs tickets, client secrets, passwords, and tokens', () => {
    const auditPayload = {
      action: 'SSO_TICKET_ISSUED',
      clientId: 'pak-expense-tracker',
      userEmail: 'sarfraz@pixxtechnologies.com',
      ticket: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sensitiveTicketPayload',
      nested: {
        clientSecret: 'secret_live_key_9999',
        authToken: 'bearer_token_123',
        safeProperty: 'KeepMeIntact',
      },
    };

    const clean = redactSensitiveData(auditPayload);
    assert.strictEqual(clean.ticket, '[REDACTED]', 'ticket field must be redacted');
    assert.strictEqual(clean.nested.clientSecret, '[REDACTED]', 'clientSecret must be redacted');
    assert.strictEqual(clean.nested.authToken, '[REDACTED]', 'authToken must be redacted');
    assert.strictEqual(clean.nested.safeProperty, 'KeepMeIntact', 'Safe properties must be preserved');
    assert.strictEqual(clean.userEmail, 'sarfraz@pixxtechnologies.com');
  });

  // Group 4: Role-Based Access Isolation (Sarfraz Khan Access Boundary)
  console.log('\n4. Role-Based Access Isolation & Sarfraz Khan Boundary Enforcement');

  const User = require('./models/User');

  const userBoss = new User({
    name: 'Kamran Ijaz',
    email: 'kamran@pixxtechnologies.com',
    role: ROLES.BOSS,
  });

  const userManager = new User({
    name: 'Fahad Rasheed',
    email: 'fahad@pixxtechnologies.com',
    role: ROLES.MANAGER,
  });

  const userAccountant = new User({
    name: 'Sarfraz Khan',
    email: 'sarfraz@pixxtechnologies.com',
    role: ROLES.ACCOUNTANT,
  });

  const appPakExpense = new Software({
    name: 'Pakistan Expense Tracker',
    slug: 'pakistan-expense-tracker',
  });

  const appRota = new Software({
    name: 'Rota System',
    slug: 'rota-system',
  });

  const appUkCompany = new Software({
    name: 'UK Company',
    slug: 'uk-company',
  });

  const appBicycle = new Software({
    name: 'Bicycle Purchase System',
    slug: 'bicycle-purchase-system',
  });

  const appTaskManager = new Software({
    name: 'Task Manager',
    slug: 'task-manager',
  });

  runTest('Boss and Manager have access to all 5 applications', () => {
    const apps = [appPakExpense, appRota, appUkCompany, appBicycle, appTaskManager];
    for (const a of apps) {
      assert.strictEqual(userBoss.hasSoftwareAccess(a), true, `Boss must access ${a.name}`);
      assert.strictEqual(userManager.hasSoftwareAccess(a), true, `Manager must access ${a.name}`);
    }
  });

  runTest('Sarfraz Khan (Accountant) can ONLY access Pakistan Expense Tracker and Rota System', () => {
    // Authorized apps
    assert.strictEqual(userAccountant.hasSoftwareAccess(appPakExpense), true, 'Sarfraz Khan must access Pak Expense');
    assert.strictEqual(userAccountant.hasSoftwareAccess(appRota), true, 'Sarfraz Khan must access Rota System');

    // Strictly Unauthorized apps
    assert.strictEqual(userAccountant.hasSoftwareAccess(appUkCompany), false, 'Sarfraz Khan must NOT access UK Company');
    assert.strictEqual(userAccountant.hasSoftwareAccess(appBicycle), false, 'Sarfraz Khan must NOT access Bicycle System');
    assert.strictEqual(userAccountant.hasSoftwareAccess(appTaskManager), false, 'Sarfraz Khan must NOT access Task Manager');
  });

  // Group 5: Pilot Integration Simulation (Pakistan Expense Tracker Exchange)
  console.log('\n5. Pakistan Expense Tracker Pilot SSO Exchange Simulation');

  runTest('SSO ticket generated for Sarfraz Khan matches local account and custom role mapping', () => {
    const ticketResult = generateSSOTicket({
      user: userAccountant,
      software: {
        _id: '671ee1234567890abcdef999',
        name: 'Pakistan Expense Tracker',
        slug: 'pakistan-expense-tracker',
        clientId: 'pak-expense-tracker',
        attributeMapping: {
          role: {
            Accountant: 'DATA_ENTRY',
          },
        },
      },
    });

    const decoded = verifySSOTicket(ticketResult.ticket, 'pak-expense-tracker');
    assert.strictEqual(decoded.email, 'sarfraz@pixxtechnologies.com');
    assert.strictEqual(decoded.mappedRole, 'DATA_ENTRY', 'Sarfraz role must map to DATA_ENTRY');
  });

  console.log('\n========================================================');
  console.log(`   PHASE 5 TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('========================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
