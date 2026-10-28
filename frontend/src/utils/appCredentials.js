import bicycleLogo from '../assets/website/bicycle.png';
import pakLogo from '../assets/website/pak.png';
import rotaLogo from '../assets/website/rota.png';
import taskLogo from '../assets/website/task.png';
import ukLogo from '../assets/website/uk.png';

// Direct Map of Website Logos from assets/website/
export const WEBSITE_LOGOS = {
  'bicycle-purchase-system': bicycleLogo,
  'pakistan-expense-tracker': pakLogo,
  'rota-system': rotaLogo,
  'task-manager': taskLogo,
  'uk-company': ukLogo,
};

// Retrieve high-resolution website logo with automatic fallback
export const getAppLogo = (app = {}) => {
  if (app.logoUrl && !app.logoUrl.includes('placeholder')) {
    return app.logoUrl;
  }
  const slug = (app.slug || '').toLowerCase();
  if (WEBSITE_LOGOS[slug]) return WEBSITE_LOGOS[slug];

  const lower = (app.name || app.code || '').toLowerCase();
  if (lower.includes('bicycle')) return bicycleLogo;
  if (lower.includes('pakistan') || lower.includes('pak') || lower.includes('expense')) return pakLogo;
  if (lower.includes('rota')) return rotaLogo;
  if (lower.includes('task')) return taskLogo;
  if (lower.includes('uk') || lower.includes('company')) return ukLogo;

  return null;
};

// Central Directory of Specific Application Credentials
export const APP_CREDENTIALS = {
  'bicycle-purchase-system': {
    kamran: { email: 'kamran@gmail.com', pass: 'kamran123', role: 'ADMIN' },
    fahad: { email: 'fahad@gmail.com', pass: 'fahad123', role: 'ADMIN' },
    khurshid: { email: 'khurshid@gmail.com', pass: 'khurshid123', role: 'ADMIN' },
    rizwan: { email: 'rizwan@gmail.com', pass: 'rizwan123', role: 'ADMIN' },
  },
  'task-manager': {
    kamran: { email: 'kamran@gmail.com', pass: 'kamran123', role: 'Admin (Boss)' },
    fahad: { email: 'fahad@pixxtechnologiees.com', pass: 'fahad123', role: 'Admin' },
    khurshid: { email: 'khurshid@gmail.com', pass: 'khurshid123', role: 'Admin' },
    rizwan: { email: 'rizwan@gmail.com', pass: 'rizwan123', role: 'Admin' },
  },
  'rota-system': {
    kamran: { username: 'kamran', pass: 'password123', role: 'Full Admin' },
    fahad: { username: 'fahad', pass: 'fahad123', role: 'Full Admin' },
    khurshid: { username: 'khurshid', pass: 'password123', role: 'Full Admin' },
    rizwan: { username: 'rizwan', email: 'rizwan@gmail.com', pass: 'rizwan123', role: 'Full Admin' },
    sarfraz: { username: 'sarfraz', pass: 'password123', role: 'Attendance Checker' },
  },
  'uk-company': {
    kamran: { email: 'kamran@gmail.com', pass: 'kamran123', role: 'Full Admin (All Companies)' },
    fahad: { email: 'fahad@gmail.com', pass: 'fahad123', role: 'Full Admin (All Companies)' },
    khurshid: { email: 'khurshid@gmail.com', pass: 'khurshid123', role: 'Full Admin (All Companies)' },
    rizwan: { email: 'rizwan@gmail.com', pass: 'rizwan123', role: 'Full Admin (All Companies)' },
  },
  'pakistan-expense-tracker': {
    kamran: { email: 'kamran@pixxtechnologies.com', pass: 'kamran123', role: 'ADMIN' },
    fahad: { email: 'fahad@pixxtechnologies.com', pass: 'fahad123', role: 'ADMIN' },
    khurshid: { email: 'khurshid@pixxtechnologies.com', pass: 'khurshid123', role: 'ADMIN' },
    rizwan: { email: 'rizwan@gmail.com', pass: 'rizwan123', role: 'ADMIN' },
    sarfraz: { email: 'sarfraz@pixxtechnologies.com', pass: 'password123', role: 'DATA_ENTRY' },
  },
};

// Verified Live Vercel Deployments
export const LIVE_URLS = {
  'pakistan-expense-tracker': 'https://pixxtech-expense-tracker-fz2h.vercel.app',
  'uk-company': 'https://uk-companies.vercel.app',
  'rota-system': 'https://rota-system-eka1-eight.vercel.app',
  'bicycle-purchase-system': 'https://bicycle-uuue.vercel.app',
  'task-manager': 'https://task-manager-flame-five-73.vercel.app',
};

// Resolve destination live URL
export const getDestinationUrl = (app = {}) => {
  if (app.url && !app.url.includes('.internal') && !app.url.startsWith('CONFIG_PLACEHOLDER')) {
    return app.url;
  }
  const slug = app.slug || '';
  if (slug && LIVE_URLS[slug]) {
    return LIVE_URLS[slug];
  }
  const lower = (app.name || app.code || '').toLowerCase();
  if (lower.includes('rota')) return LIVE_URLS['rota-system'];
  if (lower.includes('bicycle')) return LIVE_URLS['bicycle-purchase-system'];
  if (lower.includes('pakistan') || lower.includes('expense')) return LIVE_URLS['pakistan-expense-tracker'];
  if (lower.includes('uk')) return LIVE_URLS['uk-company'];
  if (lower.includes('task')) return LIVE_URLS['task-manager'];

  return app.url || '';
};

// Determine user's credentials for an app
export const getUserAppCredentials = (currentUser, app = {}) => {
  if (!currentUser) return null;
  const nameLower = (currentUser.name || '').toLowerCase();
  const emailLower = (currentUser.email || '').toLowerCase();
  const userLower = (currentUser.username || '').toLowerCase();

  let userKey = '';
  if (nameLower.includes('kamran') || emailLower.includes('kamran') || userLower.includes('kamran')) userKey = 'kamran';
  else if (nameLower.includes('fahad') || emailLower.includes('fahad') || userLower.includes('fahad')) userKey = 'fahad';
  else if (nameLower.includes('khurshid') || emailLower.includes('khurshid') || userLower.includes('khurshid')) userKey = 'khurshid';
  else if (nameLower.includes('rizwan') || emailLower.includes('rizwan') || userLower.includes('rizwan')) userKey = 'rizwan';
  else if (nameLower.includes('sarfraz') || emailLower.includes('sarfraz') || userLower.includes('sarfraz')) userKey = 'sarfraz';
  else if (nameLower.includes('admin') || emailLower.includes('admin') || userLower.includes('admin')) userKey = 'admin';

  const slug = (app.slug || '').toLowerCase();
  let appKey = slug;
  if (!APP_CREDENTIALS[appKey]) {
    const lower = (app.name || app.code || '').toLowerCase();
    if (lower.includes('bicycle')) appKey = 'bicycle-purchase-system';
    else if (lower.includes('pakistan') || lower.includes('expense')) appKey = 'pakistan-expense-tracker';
    else if (lower.includes('rota')) appKey = 'rota-system';
    else if (lower.includes('task')) appKey = 'task-manager';
    else if (lower.includes('uk')) appKey = 'uk-company';
  }

  const appMap = APP_CREDENTIALS[appKey];
  if (appMap && userKey && appMap[userKey]) {
    return appMap[userKey];
  }

  return {
    email: currentUser.email || 'user@pixxtech.internal',
    pass: 'pixxtech123',
    role: currentUser.role || 'Member',
  };
};
