/**
 * PixxTech Central Portal - Secure Admin Bootstrap CLI
 * Phase 3: First-time Boss Account Setup
 *
 * Usage:
 *   node backend/scripts/bootstrapAdmin.js --name "Kamran Ijaz" --email "kamran@pixxtech.com" --password "SecurePass123!"
 * Or set environment variables:
 *   BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { ROLES } = require('../config/roles');
const { connectDB, closeDB } = require('../config/db');

async function runBootstrap() {
  console.log('===========================================================');
  console.log('  PIXXTECH CENTRAL PORTAL - BOSS ACCOUNT BOOTSTRAP');
  console.log('===========================================================');

  await connectDB();

  try {
    // 1. Verify no active Boss account exists
    const existingBoss = await User.findOne({ role: ROLES.BOSS });
    if (existingBoss) {
      console.error('[ERROR] Bootstrap aborted: A Boss administrator account already exists.');
      console.error(`  Active administrator email: ${existingBoss.email}`);
      console.error('  For security, bootstrap can only be executed when no administrator exists.');
      await closeDB();
      process.exit(1);
    }

    // 2. Parse arguments
    const args = process.argv.slice(2);
    let name = process.env.BOOTSTRAP_ADMIN_NAME || '';
    let email = process.env.BOOTSTRAP_ADMIN_EMAIL || '';
    let password = process.env.BOOTSTRAP_ADMIN_PASSWORD || '';

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--name' && args[i + 1]) name = args[i + 1];
      if (args[i] === '--email' && args[i + 1]) email = args[i + 1];
      if (args[i] === '--password' && args[i + 1]) password = args[i + 1];
    }

    if (!name || !email || !password) {
      console.error('[ERROR] Missing required parameters. Please provide --name, --email, and --password');
      console.error('Example: node backend/scripts/bootstrapAdmin.js --name "Kamran Ijaz" --email "kamran@pixxtech.com" --password "YourStrongPassword"');
      await closeDB();
      process.exit(1);
    }

    if (password.length < 8) {
      console.error('[ERROR] Password must be at least 8 characters in length.');
      await closeDB();
      process.exit(1);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 3. Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Create the initial Boss account
    const boss = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: ROLES.BOSS,
      isActive: true,
      passwordChangedAt: new Date(),
    });

    console.log('[SUCCESS] Initial Boss account successfully created!');
    console.log(`  Name: ${boss.name}`);
    console.log(`  Email: ${boss.email}`);
    console.log(`  Role: ${boss.role}`);
    console.log('  Bootstrap mechanism is now permanently locked.');
    console.log('===========================================================');
  } catch (err) {
    console.error(`[ERROR] Bootstrap failed: ${err.message}`);
  } finally {
    await closeDB();
    process.exit(0);
  }
}

runBootstrap();
