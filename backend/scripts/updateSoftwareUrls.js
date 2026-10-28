const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { connectDB, closeDB } = require('../config/db');
const Software = require('../models/Software');

const LIVE_URLS = {
  'pakistan-expense-tracker': 'https://pixxtech-expense-tracker-fz2h.vercel.app',
  'uk-company': 'https://uk-companies.vercel.app',
  'rota-system': 'https://rota-system-eka1-eight.vercel.app',
  'bicycle-purchase-system': 'https://bicycle-uuue.vercel.app',
  'task-manager': 'https://task-manager-flame-five-73.vercel.app',
};

async function updateUrls() {
  await connectDB();
  console.log('\nUpdating Software URLs in MongoDB Atlas...');

  for (const [slug, liveUrl] of Object.entries(LIVE_URLS)) {
    const res = await Software.findOneAndUpdate(
      { slug },
      {
        $set: {
          url: liveUrl,
          isActive: true,
          redirectUris: [liveUrl, `${liveUrl}/sso/callback`],
        },
      },
      { new: true }
    );
    if (res) {
      console.log(`  [UPDATED] ${res.name} -> ${res.url}`);
    } else {
      console.log(`  [NOT FOUND] Slug: ${slug}`);
    }
  }

  const all = await Software.find({}, 'name slug url');
  console.log('\nCurrent Software in DB:');
  all.forEach((s) => console.log(`- ${s.name} (${s.slug}): ${s.url}`));

  await closeDB();
}

updateUrls().catch((err) => {
  console.error('Update error:', err);
  process.exit(1);
});
