const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { connectDB, closeDB } = require('../config/db');
const User = require('../models/User');
const Software = require('../models/Software');
const { ROLES, APP_SLUGS } = require('../config/roles');

const ACCOUNTS = [
  {
    name: 'Kamran Ijaz',
    username: 'kamran',
    email: 'kamran@gmail.com',
    alternateEmails: ['kamran@pixxtechnologies.com', 'kamran@pixxtech.com'],
    password: 'kamran123',
    role: ROLES.BOSS,
    allowedSlugs: Object.values(APP_SLUGS),
  },
  {
    name: 'Fahad Rasheed',
    username: 'fahad',
    email: 'fahad@gmail.com',
    alternateEmails: ['fahad@pixxtechnologiees.com', 'fahad@pixxtechnologies.com', 'fahad@pixxtech.com'],
    password: 'fahad123',
    role: ROLES.MANAGER,
    allowedSlugs: Object.values(APP_SLUGS),
  },
  {
    name: 'Khurshid Anwar',
    username: 'khurshid',
    email: 'khurshid@gmail.com',
    alternateEmails: ['khurshid@pixxtechnologies.com', 'khurshid@pixxtech.com'],
    password: 'khurshid123',
    role: ROLES.ASSISTANT_MANAGER,
    allowedSlugs: Object.values(APP_SLUGS),
  },
  {
    name: 'Rizwan',
    username: 'rizwan',
    email: 'rizwan@gmail.com',
    alternateEmails: ['rizwan@pixxtechnologies.com', 'rizwan@pixxtech.com'],
    password: 'rizwan123',
    role: ROLES.SOFTWARE_DEVELOPER,
    allowedSlugs: Object.values(APP_SLUGS),
  },
  {
    name: 'Sarfraz Khan',
    username: 'sarfraz',
    email: 'sarfraz@pixxtechnologies.com',
    alternateEmails: ['sarfraz@gmail.com', 'sarfraz@pixxtech.com'],
    password: 'password123',
    role: ROLES.ACCOUNTANT,
    allowedSlugs: [APP_SLUGS.PAKISTAN_EXPENSE, APP_SLUGS.ROTA_SYSTEM],
  },
];

async function syncUsers() {
  await connectDB();
  console.log('\n===========================================================');
  console.log('   SYNCING USER ACCOUNTS WITH ENTERPRISE CREDENTIALS');
  console.log('===========================================================\n');

  const allSoftware = await Software.find();
  const softwareBySlug = {};
  allSoftware.forEach((s) => {
    softwareBySlug[s.slug] = s._id;
  });

  const salt = await bcrypt.genSalt(10);

  for (const acc of ACCOUNTS) {
    const passwordHash = await bcrypt.hash(acc.password, salt);
    const allowedSoftwareIds = acc.allowedSlugs
      .map((slug) => softwareBySlug[slug])
      .filter(Boolean);

    // Search by username or any of their emails
    const existing = await User.findOne({
      $or: [
        { username: acc.username },
        { email: acc.email },
        { alternateEmails: acc.email },
        { name: acc.name },
      ],
    });

    if (existing) {
      existing.name = acc.name;
      existing.email = acc.email;
      existing.username = acc.username;
      existing.alternateEmails = acc.alternateEmails;
      existing.passwordHash = passwordHash;
      existing.role = acc.role;
      existing.allowedSoftware = allowedSoftwareIds;
      existing.isActive = true;
      existing.passwordChangedAt = new Date();
      await existing.save();
      console.log(`  [UPDATED] ${acc.name} (${acc.email}) | User: ${acc.username} | Pass: ${acc.password} | Role: ${acc.role}`);
    } else {
      await User.create({
        name: acc.name,
        email: acc.email,
        username: acc.username,
        alternateEmails: acc.alternateEmails,
        passwordHash,
        role: acc.role,
        allowedSoftware: allowedSoftwareIds,
        isActive: true,
        passwordChangedAt: new Date(),
      });
      console.log(`  [CREATED] ${acc.name} (${acc.email}) | User: ${acc.username} | Pass: ${acc.password} | Role: ${acc.role}`);
    }
  }

  console.log('\n===========================================================');
  console.log('   USER SYNC COMPLETED SUCCESSFULLY');
  console.log('===========================================================\n');

  await closeDB();
}

syncUsers().catch((err) => {
  console.error('Error syncing users:', err);
  process.exit(1);
});
