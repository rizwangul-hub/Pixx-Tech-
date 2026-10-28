/**
 * PixxTech Central Portal - Database Seeder
 * Populates the 5 enterprise software applications and default team accounts
 * into MongoDB Atlas.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { connectDB, closeDB } = require('../config/db');
const User = require('../models/User');
const Software = require('../models/Software');
const { ROLES, APP_SLUGS } = require('../config/roles');

const SEED_APPLICATIONS = [
  {
    name: 'Pakistan Expense Tracker',
    slug: 'pakistan-expense-tracker',
    category: 'Finance & Accounting',
    description: 'Corporate expenditure tracking, localized tax calculation, currency conversions, and receipt auditing for Pakistan operations.',
    url: 'https://pak-expense.pixxtech.internal',
    sortOrder: 1,
    isActive: true,
    ssoEnabled: true,
    ssoProtocol: 'JWT_BEARER',
    clientId: 'pak-expense-tracker',
    redirectUris: ['http://localhost:5000/api/auth/sso/callback', 'https://pak-expense.pixxtech.internal/sso/callback'],
    integrationStatus: 'testing',
    attributeMapping: { email: 'email', username: 'username', role: { Boss: 'ADMIN', Manager: 'ADMIN', Developer: 'ADMIN', Accountant: 'DATA_ENTRY' } },
  },
  {
    name: 'UK Company',
    slug: 'uk-company',
    category: 'Corporate Administration',
    description: 'UK entity governance, statutory filing workflows, Companies House registry sync, and corporate compliance oversight.',
    url: 'https://uk-company.pixxtech.internal',
    sortOrder: 2,
    isActive: true,
    ssoEnabled: true,
    ssoProtocol: 'JWT_BEARER',
    clientId: 'uk-company',
    redirectUris: ['https://uk-company.pixxtech.internal/sso/callback'],
    integrationStatus: 'testing',
    attributeMapping: { email: 'email', username: 'username', role: { Boss: 'admin', Manager: 'manager', Developer: 'operator' } },
  },
  {
    name: 'Rota System',
    slug: 'rota-system',
    category: 'Workforce & Shifts',
    description: 'Automated staff shift scheduling, attendance tracking, holiday allowances, and team rota conflict resolution.',
    url: 'https://rota.pixxtech.internal',
    sortOrder: 3,
    isActive: true,
    ssoEnabled: true,
    ssoProtocol: 'JWT_BEARER',
    clientId: 'rota-system',
    redirectUris: ['https://rota.pixxtech.internal/sso/callback'],
    integrationStatus: 'testing',
    attributeMapping: { email: 'email', username: 'username', role: { Boss: 'ADMIN', Manager: 'ADMIN', Developer: 'ADMIN', Accountant: 'ATTENDANCE_OPERATOR' } },
  },
  {
    name: 'Bicycle Purchase System',
    slug: 'bicycle-purchase-system',
    category: 'Procurement & Logistics',
    description: 'Fleet inventory ordering, vendor quote comparison, purchase approval chains, and delivery verification.',
    url: 'https://bicycle-procurement.pixxtech.internal',
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
    url: 'https://tasks.pixxtech.internal',
    sortOrder: 5,
    isActive: true,
    ssoEnabled: true,
    ssoProtocol: 'JWT_BEARER',
    clientId: 'task-manager',
    redirectUris: ['https://tasks.pixxtech.internal/sso/callback'],
    integrationStatus: 'testing',
    attributeMapping: { email: 'email', username: 'username', role: { Boss: 'Admin', Manager: 'Manager', Developer: 'Member' } },
  },
];

const DEFAULT_USERS = [
  {
    name: 'Kamran Ijaz',
    email: 'kamran@pixxtech.com',
    username: 'kamran',
    password: 'PixxTech2026!',
    role: ROLES.BOSS,
    allowedSlugs: Object.values(APP_SLUGS),
  },
  {
    name: 'Fahad Rasheed',
    email: 'fahad@pixxtech.com',
    username: 'fahad',
    password: 'PixxTech2026!',
    role: ROLES.MANAGER,
    allowedSlugs: Object.values(APP_SLUGS),
  },
  {
    name: 'Khurshid Anwar',
    email: 'khurshid@pixxtech.com',
    username: 'khurshid',
    password: 'PixxTech2026!',
    role: ROLES.ASSISTANT_MANAGER,
    allowedSlugs: Object.values(APP_SLUGS),
  },
  {
    name: 'Sarfraz Khan',
    email: 'sarfraz@pixxtech.com',
    username: 'sarfraz',
    password: 'PixxTech2026!',
    role: ROLES.ACCOUNTANT,
    // Strictly allowed only for Pakistan Expense Tracker and Rota System
    allowedSlugs: [APP_SLUGS.PAKISTAN_EXPENSE, APP_SLUGS.ROTA_SYSTEM],
  },
  {
    name: 'Rizwan',
    email: 'rizwan@pixxtech.com',
    username: 'rizwan',
    password: 'PixxTech2026!',
    role: ROLES.SOFTWARE_DEVELOPER,
    allowedSlugs: Object.values(APP_SLUGS),
  },
];

async function seed() {
  console.log('===========================================================');
  console.log('   PIXXTECH CENTRAL PORTAL - DATABASE INITIALIZATION');
  console.log('===========================================================');

  await connectDB();

  try {
    // 1. Seed Software Applications
    console.log('\n[1/2] Seeding Software Applications...');
    for (const app of SEED_APPLICATIONS) {
      const existing = await Software.findOne({ slug: app.slug });
      if (!existing) {
        await Software.create(app);
        console.log(`  + Created Software: ${app.name} (${app.slug})`);
      } else {
        console.log(`  = Already exists: ${app.name}`);
      }
    }

    const allSoftware = await Software.find();
    const softwareBySlug = {};
    allSoftware.forEach((s) => {
      softwareBySlug[s.slug] = s._id;
    });

    // 2. Seed Team User Accounts
    console.log('\n[2/2] Seeding Team User Accounts...');
    const salt = await bcrypt.genSalt(10);

    for (const member of DEFAULT_USERS) {
      const normalizedEmail = member.email.toLowerCase().trim();
      const existing = await User.findOne({ email: normalizedEmail });

      const allowedSoftwareIds = member.allowedSlugs
        .map((slug) => softwareBySlug[slug])
        .filter(Boolean);

      if (!existing) {
        const passwordHash = await bcrypt.hash(member.password, salt);
        await User.create({
          name: member.name,
          email: normalizedEmail,
          username: member.username,
          passwordHash,
          role: member.role,
          allowedSoftware: allowedSoftwareIds,
          isActive: true,
          passwordChangedAt: new Date(),
        });
        console.log(`  + Created Account: ${member.name} (${normalizedEmail}) - Role: ${member.role}`);
      } else {
        console.log(`  = User already exists: ${member.name} (${normalizedEmail})`);
      }
    }

    console.log('\n===========================================================');
    console.log('   DATABASE SEEDING COMPLETED SUCCESSFULLY');
    console.log('===========================================================');
  } catch (err) {
    console.error('[ERROR] Seeding failed:', err.message);
  } finally {
    await closeDB();
    process.exit(0);
  }
}

seed();
