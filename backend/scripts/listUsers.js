const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { connectDB, closeDB } = require('../config/db');
const User = require('../models/User');

async function listUsers() {
  await connectDB();
  const users = await User.find({}, 'name email username role isActive');
  console.log('TOTAL USERS IN DATABASE:', users.length);
  users.forEach((u) => {
    console.log(`- Name: ${u.name} | Email: ${u.email} | Username: ${u.username || 'N/A'} | Role: ${u.role} | Active: ${u.isActive}`);
  });
  await closeDB();
}

listUsers().catch((err) => {
  console.error('Error listing users:', err);
  process.exit(1);
});
