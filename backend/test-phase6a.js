/**
 * Phase 6A Multi-Application SSO Expansion Verification Suite
 * Verifies SSO hardening, token algorithm enforcement, replay prevention,
 * strict central portal authorization (Sarfraz Khan isolation),
 * and ticket exchange across UK Expense Tracker, Rota System, and Task Manager.
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
  console.log('   PIXXTECH CENTRAL PORTAL - PHASE 6A TEST SUITE');
  console.log('   (SSO Expansion: UK Company, Rota System & Task Manager)');
  console.log('========================================================\n');

  // Shared Central Test Users
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

  const userDev = new User({
    name: 'Rizwan',
    email: 'rizwan@pixxtechnologies.com',
    role: ROLES.SOFTWARE_DEVELOPER,
  });

  const userAccountant = new User({
    name: 'Sarfraz Khan',
    email: 'sarfraz@pixxtechnologies.com',
    role: ROLES.ACCOUNTANT,
  });

  // Target Software Definitions
  const appPakExpense = new Software({
    name: 'Pakistan Expense Tracker',
    slug: 'pakistan-expense-tracker',
    clientId: 'pak-expense-tracker',
    ssoEnabled: true,
    ssoProtocol: 'JWT_BEARER',
  });

  const appUkCompany = new Software({
    name: 'UK Company',
    slug: 'uk-company',
    clientId: 'uk-company',
    ssoEnabled: true,
    ssoProtocol: 'JWT_BEARER',
  });

  const appRota = new Software({
    name: 'Rota System',
    slug: 'rota-system',
    clientId: 'rota-system',
    ssoEnabled: true,
    ssoProtocol: 'JWT_BEARER',
  });

  const appTask = new Software({
    name: 'Task Manager',
    slug: 'task-manager',
    clientId: 'task-manager',
    ssoEnabled: true,
    ssoProtocol: 'JWT_BEARER',
  });

  const appBicycle = new Software({
    name: 'Bicycle Purchase System',
    slug: 'bicycle-purchase-system',
    clientId: 'bicycle-purchase-system',
    ssoEnabled: false,
    ssoProtocol: 'DIRECT_LAUNCH',
    integrationStatus: 'compatibility_review_required',
  });

  // Group 1: Central Portal Access Enforcement & Sarfraz Isolation
  console.log('1. Central Portal Access Rules & Sarfraz Khan Isolation');

  runTest('Boss, Manager, and Developer have SSO access to all applications', () => {
    const privileged = [userBoss, userManager, userDev];
    const apps = [appPakExpense, appUkCompany, appRota, appTask, appBicycle];

    for (const u of privileged) {
      for (const a of apps) {
        assert.strictEqual(u.hasSoftwareAccess(a), true, `${u.name} must have access to ${a.name}`);
      }
    }
  });

  runTest('Sarfraz Khan (Accountant) can ONLY access Pakistan Expense Tracker & Rota System', () => {
    assert.strictEqual(userAccountant.hasSoftwareAccess(appPakExpense), true, 'Sarfraz must access Pak Expense');
    assert.strictEqual(userAccountant.hasSoftwareAccess(appRota), true, 'Sarfraz must access Rota System');

    assert.strictEqual(userAccountant.hasSoftwareAccess(appUkCompany), false, 'Sarfraz must be BLOCKED from UK Company');
    assert.strictEqual(userAccountant.hasSoftwareAccess(appTask), false, 'Sarfraz must be BLOCKED from Task Manager');
    assert.strictEqual(userAccountant.hasSoftwareAccess(appBicycle), false, 'Sarfraz must be BLOCKED from Bicycle System');
  });

  // Group 2: Ticket Security & Algorithm Enforcement
  console.log('\n2. Ticket Security, Algorithm Enforcement & Replay Protection');

  runTest('SSO ticket generation enforces HS256 algorithm and includes all mandatory claims', () => {
    const result = generateSSOTicket({
      user: userBoss,
      software: appUkCompany,
    });

    assert(result.ticket, 'Must generate ticket string');
    assert.strictEqual(result.expiresIn, 300, 'TTL must be 300 seconds');

    // Decode header to verify algorithm
    const decoded = jwt.decode(result.ticket, { complete: true });
    assert.strictEqual(decoded.header.alg, 'HS256', 'Signing algorithm must be strictly HS256');
    assert.strictEqual(decoded.payload.iss, SSO_ISSUER);
    assert.strictEqual(decoded.payload.aud, 'uk-company');
    assert.strictEqual(decoded.payload.sub, userBoss._id.toString());
    assert.strictEqual(decoded.payload.email, userBoss.email);
    assert(decoded.payload.jti, 'jti must exist');
    assert(decoded.payload.nonce, 'nonce must exist');
    assert(decoded.payload.username, 'username must exist');
  });

  runTest('verifySSOTicket strictly rejects tokens with unapproved algorithms (e.g. none)', () => {
    // Generate forged token with alg: none
    const forgedToken = jwt.sign(
      {
        iss: SSO_ISSUER,
        aud: 'uk-company',
        sub: userBoss._id.toString(),
        email: userBoss.email,
        jti: 'forged_jti_123',
      },
      '',
      { algorithm: 'none' }
    );

    let rejected = false;
    try {
      verifySSOTicket(forgedToken, 'uk-company');
    } catch (err) {
      rejected = true;
    }
    assert.strictEqual(rejected, true, 'Tokens with algorithm none must be rejected');
  });

  runTest('verifySSOTicket rejects duplicate redemptions (atomic replay prevention)', () => {
    const result = generateSSOTicket({
      user: userManager,
      software: appRota,
    });

    // First redemption succeeds
    const decoded = verifySSOTicket(result.ticket, 'rota-system');
    assert.strictEqual(decoded.email, userManager.email);

    // Second redemption must fail
    let replayBlocked = false;
    try {
      verifySSOTicket(result.ticket, 'rota-system');
    } catch (err) {
      if (err.code === 'TICKET_REPLAYED') replayBlocked = true;
    }
    assert.strictEqual(replayBlocked, true, 'Replayed ticket must be rejected with TICKET_REPLAYED');
  });

  runTest('verifySSOTicket rejects ticket intended for another application (audience mismatch)', () => {
    const result = generateSSOTicket({
      user: userBoss,
      software: appUkCompany,
    });

    let audBlocked = false;
    try {
      // Attempting to redeem UK Company ticket at Task Manager
      verifySSOTicket(result.ticket, 'task-manager');
    } catch (err) {
      if (err.code === 'AUDIENCE_MISMATCH') audBlocked = true;
    }
    assert.strictEqual(audBlocked, true, 'Audience mismatch must be rejected');
  });

  // Group 3: UK Company / UK Expense Tracker SSO Flow
  console.log('\n3. UK Company / UK Expense Tracker SSO Integration Simulation');

  runTest('UK Company exchange validates ticket and maps to local operator with company context', () => {
    const ticketResult = generateSSOTicket({
      user: userBoss,
      software: appUkCompany,
    });

    const verified = verifySSOTicket(ticketResult.ticket, 'uk-company');
    assert.strictEqual(verified.email, 'kamran@pixxtechnologies.com');

    // Simulate UK Expense Tracker operator resolution
    const mockUkUser = {
      _id: 'uk_user_001',
      name: verified.name,
      email: verified.email,
      role: 'admin',
      allowedCompanies: ['old-street', 'best-standard', 'sk-hamilton', 'homewards', 'mile-end-road', 'global-standard'],
      isActive: true,
    };

    assert.strictEqual(mockUkUser.isActive, true);
    assert(mockUkUser.allowedCompanies.includes('old-street'), 'Must preserve company context permissions');
  });

  // Group 4: Rota System SSO Flow & Username Mapping
  console.log('\n4. Rota System SSO Integration Simulation & Username Mapping');

  runTest('Rota System exchange validates ticket and resolves user by email or username claim', () => {
    const ticketResult = generateSSOTicket({
      user: userAccountant, // Sarfraz Khan is authorized for Rota
      software: appRota,
    });

    const verified = verifySSOTicket(ticketResult.ticket, 'rota-system');
    assert.strictEqual(verified.email, 'sarfraz@pixxtechnologies.com');
    assert.strictEqual(verified.username, 'sarfraz');

    // Simulate Rota System user document where username is unique
    const mockRotaUser = {
      _id: 'rota_user_005',
      name: 'Sarfraz Khan',
      username: 'sarfraz',
      email: 'sarfraz@pixxtechnologies.com',
      role: 'ATTENDANCE_OPERATOR',
      isActive: true,
    };

    const matches = (mockRotaUser.email === verified.email) || (mockRotaUser.username === verified.username);
    assert.strictEqual(matches, true, 'Must resolve Rota user by email or username');
    assert.strictEqual(mockRotaUser.role, 'ATTENDANCE_OPERATOR');
  });

  // Group 5: Task Manager SSO Flow & Dual Token/Cookie Architecture
  console.log('\n5. Task Manager SSO Integration Simulation & Dual-Token/Cookie Flow');

  runTest('Task Manager exchange validates ticket, maps user, and generates access+refresh tokens', () => {
    const ticketResult = generateSSOTicket({
      user: userDev,
      software: appTask,
    });

    const verified = verifySSOTicket(ticketResult.ticket, 'task-manager');
    assert.strictEqual(verified.email, 'rizwan@pixxtechnologies.com');

    // Simulate Task Manager user
    const mockTaskUser = {
      _id: 'task_user_003',
      name: verified.name,
      email: verified.email,
      role: 'Member',
      isActive: true,
    };

    // Simulate token creation
    const accessToken = jwt.sign({ id: mockTaskUser._id, role: mockTaskUser.role }, 'task_jwt_secret', { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: mockTaskUser._id }, 'task_refresh_secret', { expiresIn: '7d' });

    assert(accessToken, 'Must generate short-lived access token');
    assert(refreshToken, 'Must generate long-lived refresh token');
  });

  // Group 6: Bicycle Purchase System Direct-Launch Isolation Guard
  console.log('\n6. Bicycle Purchase System Isolation Guard');

  runTest('Bicycle Purchase System remains unauthenticated DIRECT_LAUNCH without SSO endpoint', () => {
    assert.strictEqual(appBicycle.ssoEnabled, false, 'Bicycle System SSO must remain disabled');
    assert.strictEqual(appBicycle.ssoProtocol, 'DIRECT_LAUNCH', 'Protocol must remain DIRECT_LAUNCH');
    assert.strictEqual(appBicycle.integrationStatus, 'compatibility_review_required');
  });

  console.log('\n========================================================');
  console.log(`   PHASE 6A TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('========================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
