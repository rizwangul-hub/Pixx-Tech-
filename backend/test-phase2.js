/**
 * PixxTech Central Portal - Phase 2 Automated Test Suite
 * Verifies MongoDB Models, Validation, Error Handling, Cloudinary Config, and Health Probe.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { getDbStatus } = require('./config/db');
const { getCloudinaryStatus, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } = require('./config/cloudinary');
const Software = require('./models/Software');
const User = require('./models/User');
const ActivityLog = require('./models/ActivityLog');

async function runTests() {
  console.log('====================================================');
  console.log('  PIXXTECH CENTRAL PORTAL - PHASE 2 TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // Test 1: Mongoose Models Compilation
  try {
    assert(Software && Software.modelName === 'Software', 'Software model compiled successfully');
    assert(User && User.modelName === 'User', 'User model compiled successfully');
    assert(ActivityLog && ActivityLog.modelName === 'ActivityLog', 'ActivityLog model compiled successfully');
  } catch (err) {
    assert(false, `Model compilation failed: ${err.message}`);
  }

  // Test 2: Software Model Validation - Name Required
  try {
    const invalidSoft = new Software({ description: 'No name' });
    let caughtErr = null;
    try {
      await invalidSoft.validate();
    } catch (e) {
      caughtErr = e;
    }
    assert(caughtErr && caughtErr.errors.name, 'Software model rejects document without required name');
  } catch (err) {
    assert(false, `Unexpected error on required name test: ${err.message}`);
  }

  // Test 3: Software Model Validation - URL format
  try {
    const badUrlSoft = new Software({
      name: 'Bad URL App',
      slug: 'bad-url-app',
      url: 'not-a-valid-http-url',
    });
    let caughtErr = null;
    try {
      await badUrlSoft.validate();
    } catch (e) {
      caughtErr = e;
    }
    assert(caughtErr && caughtErr.errors.url, 'Software model rejects invalid non-HTTP URL');
  } catch (err) {
    assert(false, `Unexpected error on URL validation test: ${err.message}`);
  }

  // Test 4: Software Model Validation - Valid HTTP/HTTPS URL
  try {
    const validUrlSoft = new Software({
      name: 'Valid URL App',
      slug: 'valid-url-app',
      url: 'https://app.pixxtech.internal',
    });
    let caughtErr = null;
    try {
      await validUrlSoft.validate();
    } catch (e) {
      caughtErr = e;
    }
    assert(!caughtErr, 'Software model accepts valid HTTPS URL');
  } catch (err) {
    assert(false, `Valid URL test failed: ${err.message}`);
  }

  // Test 5: Software Slug Auto-Generation
  try {
    const autoSlugSoft = new Software({
      name: 'Automated Slug Generator Test App',
    });
    await autoSlugSoft.validate();
    assert(
      autoSlugSoft.slug === 'automated-slug-generator-test-app',
      `Auto-slug generation produces normalized slug: '${autoSlugSoft.slug}'`
    );
  } catch (err) {
    assert(false, `Auto-slug test failed: ${err.message}`);
  }

  // Test 6: User Model - Normalization & Password Hash Protection
  try {
    const testUser = new User({
      name: 'Alex Sterling',
      email: '  ALEX.STERLING@PixxTech.IO  ',
      role: 'admin',
      passwordHash: 'secret_hash_value',
    });
    await testUser.validate();
    assert(testUser.email === 'alex.sterling@pixxtech.io', 'User model normalizes email to lowercase and trims whitespace');

    const jsonUser = testUser.toJSON();
    assert(!jsonUser.passwordHash, 'User model toJSON() removes passwordHash from serialization');
  } catch (err) {
    assert(false, `User model test failed: ${err.message}`);
  }

  // Test 7: User Model - Role Validation
  try {
    const badRoleUser = new User({
      name: 'Test Bad Role',
      email: 'bad.role@pixxtech.io',
      role: 'super_unauthorized_god_role',
    });
    let caughtErr = null;
    try {
      await badRoleUser.validate();
    } catch (e) {
      caughtErr = e;
    }
    assert(caughtErr && caughtErr.errors.role, 'User model rejects role outside of planned roles');
  } catch (err) {
    assert(false, `Role test failed: ${err.message}`);
  }

  // Test 8: ActivityLog Model Validation
  try {
    const log = new ActivityLog({
      action: 'Software Created',
      entityType: 'Software',
      entityId: 'soft-12345',
      details: { name: 'Pakistan Expense Tracker' },
    });
    let caughtErr = null;
    try {
      await log.validate();
    } catch (e) {
      caughtErr = e;
    }
    assert(!caughtErr && log.createdAt instanceof Date, 'ActivityLog model creates immutable timestamped entry');
  } catch (err) {
    assert(false, `ActivityLog test failed: ${err.message}`);
  }

  // Test 9: Cloudinary MIME Type and File Size Limits
  try {
    assert(ALLOWED_MIME_TYPES.includes('image/png'), 'Cloudinary config permits image/png');
    assert(ALLOWED_MIME_TYPES.includes('image/jpeg'), 'Cloudinary config permits image/jpeg');
    assert(ALLOWED_MIME_TYPES.includes('image/webp'), 'Cloudinary config permits image/webp');
    assert(ALLOWED_MIME_TYPES.includes('image/svg+xml'), 'Cloudinary config permits image/svg+xml');
    assert(!ALLOWED_MIME_TYPES.includes('application/x-msdownload'), 'Cloudinary config rejects executable files');
    assert(!ALLOWED_MIME_TYPES.includes('text/plain'), 'Cloudinary config rejects text/plain');
    assert(MAX_FILE_SIZE_BYTES === 5 * 1024 * 1024, 'Cloudinary file size limit enforced at 5MB');
  } catch (err) {
    assert(false, `Cloudinary MIME test failed: ${err.message}`);
  }

  // Test 9b: SVG Upload Security & Active Content Sanitization (Phase 2 Hardening)
  try {
    const { containsUnsafeSvgContent } = require('./middleware/uploadMiddleware');
    const maliciousScriptSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert("XSS")</script></svg>');
    const maliciousOnloadSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="fetch(\'/steal\')"></svg>');
    const maliciousJsHrefSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><circle r="10"/></a></svg>');
    const safeCleanSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#35D6FF"/></svg>');

    assert(containsUnsafeSvgContent(maliciousScriptSvg), 'SVG sanitizer blocks <script> tags in uploaded vector graphics');
    assert(containsUnsafeSvgContent(maliciousOnloadSvg), 'SVG sanitizer blocks onload/event handlers in uploaded vector graphics');
    assert(containsUnsafeSvgContent(maliciousJsHrefSvg), 'SVG sanitizer blocks javascript: URIs in uploaded vector graphics');
    assert(!containsUnsafeSvgContent(safeCleanSvg), 'SVG sanitizer permits clean, passive vector graphics');
  } catch (err) {
    assert(false, `SVG security test failed: ${err.message}`);
  }

  // Test 10: Database Connection Status Accuracy
  try {
    const dbStatus = getDbStatus();
    assert(typeof dbStatus.connected === 'boolean', `Database status accurately reported as boolean: connected=${dbStatus.connected}`);
    assert(dbStatus.state === 'disconnected' || dbStatus.state === 'connected', `Database state accurately identified: state='${dbStatus.state}'`);
  } catch (err) {
    assert(false, `DB status test failed: ${err.message}`);
  }

  // Test 11: Security Check - No Credentials in Status
  try {
    const cStatus = getCloudinaryStatus();
    assert(!cStatus.apiSecret && !cStatus.CLOUDINARY_API_SECRET, 'Cloudinary status never exposes API Secret');
  } catch (err) {
    assert(false, `Credential leak test failed: ${err.message}`);
  }

  console.log('\n====================================================');
  console.log(`  TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
