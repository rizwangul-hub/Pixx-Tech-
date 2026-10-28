/**
 * PixxTech Central Portal - Personnel Provisioning CLI
 * Phase 3: Setup Team Accounts with Official Roles and Software Permissions
 *
 * Usage:
 *   node backend/scripts/seedPersonnel.js
 * Reads credentials from environment variables:
 *   FAHAD_EMAIL, FAHAD_PASSWORD
 *   KHURSHID_EMAIL, KHURSHID_PASSWORD
 *   SARFRAZ_EMAIL, SARFRAZ_PASSWORD
 *   RIZWAN_EMAIL, RIZWAN_PASSWORD
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Software = require('../models/Software');
const { ROLES, APP_SLUGS } = require('../config/roles');
const { connectDB, closeDB } = require('../config/db');

async function seedPersonnel() {
  console.log('===========================================================');
  console.log('  PIXXTECH CENTRAL PORTAL - PERSONNEL PROVISIONING');
  console.log('===========================================================');

  await connectDB();

  try {
    // Retrieve registered software to map ObjectIds
    const allSoftware = await Software.find();
    const softwareBySlug = {};
    allSoftware.forEach((s) => {
      softwareBySlug[s.slug] = s._id;
    });

    const members = [
      {
        name: 'Fahad Rasheed',
        email: process.env.FAHAD_EMAIL,
        password: process.env.FAHAD_PASSWORD,
        role: ROLES.MANAGER,
        allowedSlugs: Object.values(APP_SLUGS),
      },
      {
        name: 'Khurshid Anwar',
        email: process.env.KHURSHID_EMAIL,
        password: process.env.KHURSHID_PASSWORD,
        role: ROLES.ASSISTANT_MANAGER,
        allowedSlugs: Object.values(APP_SLUGS),
      },
      {
        name: 'Sarfraz Khan',
        email: process.env.SARFRAZ_EMAIL,
        password: process.env.SARFRAZ_PASSWORD,
        role: ROLES.ACCOUNTANT,
        // Accountant only has access to Pakistan Expense Tracker and Rota System
        allowedSlugs: [APP_SLUGS.PAKISTAN_EXPENSE, APP_SLUGS.ROTA_SYSTEM],
      },
      {
        name: 'Rizwan',
        email: process.env.RIZWAN_EMAIL,
        password: process.env.RIZWAN_PASSWORD,
        role: ROLES.SOFTWARE_DEVELOPER,
        allowedSlugs: Object.values(APP_SLUGS),
      },
    ];

    for (const member of members) {
      if (!member.email || !member.password) {
        console.log(`[SKIP] No environment credentials configured for ${member.name}. Skipping.`);
        continue;
      }

      const normalizedEmail = member.email.toLowerCase().trim();
      const existing = await User.findOne({ email: normalizedEmail });

      const allowedSoftwareIds = member.allowedSlugs
        .map((slug) => softwareBySlug[slug])
        .filter(Boolean);

      if (existing) {
        existing.role = member.role;
        existing.allowedSoftware = allowedSoftwareIds;
        await existing.save();
        console.log(`[UPDATED] Existing user ${member.name} (${normalizedEmail}) updated with role ${member.role}.`);
      } else {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(member.password, salt);
        await User.create({
          name: member.name,
          email: normalizedEmail,
          passwordHash,
          role: member.role,
          allowedSoftware: allowedSoftwareIds,
          isActive: true,
          passwordChangedAt: new Date(),
        });
        console.log(`[CREATED] User ${member.name} (${normalizedEmail}) created with role ${member.role}.`);
      }
    }

    console.log('===========================================================');
    console.log('Personnel provisioning completed.');
  } catch (err) {
    console.error(`[ERROR] Provisioning failed: ${err.message}`);
  } finally {
    await closeDB();
    process.exit(0);
  }
}

seedPersonnel();
