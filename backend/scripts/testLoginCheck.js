const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { connectDB, closeDB } = require('../config/db');
const User = require('../models/User');

async function testAll() {
  await connectDB();
  const checks = [
    { id: 'kamran@gmail.com', pass: 'kamran123' },
    { id: 'kamran', pass: 'kamran123' },
    { id: 'kamran@pixxtech.com', pass: 'PixxTech2026!' },
    { id: 'fahad@gmail.com', pass: 'fahad123' },
    { id: 'khurshid@gmail.com', pass: 'khurshid123' },
    { id: 'rizwan@gmail.com', pass: 'rizwan123' },
    { id: 'sarfraz', pass: 'password123' },
    { id: 'sarfraz@pixxtechnologies.com', pass: 'password123' },
  ];
  for (const c of checks) {
    const u = await User.findOne({
      $or: [{ email: c.id }, { username: c.id }, { alternateEmails: c.id }],
    }).select('+passwordHash');
    const ok = u ? await u.comparePassword(c.pass) : false;
    console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${c.id} with '${c.pass}'`);
  }
  await closeDB();
}

testAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
