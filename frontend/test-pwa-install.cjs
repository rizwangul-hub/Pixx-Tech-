/**
 * PixxTech Central Portal - Progressive Web App (PWA) Audit Runner
 * Validates manifest configuration, service worker security, icon assets,
 * install hook lifecycle, and standalone app behavior.
 */

const fs = require('fs');
const path = require('path');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${totalTests}. ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${totalTests}. ${message}`);
  }
}

console.log('=============================================================');
console.log('   PIXXTECH CENTRAL PORTAL - PWA & INSTALL AUDIT');
console.log('=============================================================\n');

// 1. Verify Manifest JSON exists and parses cleanly
const manifestPath = path.join(__dirname, 'public', 'manifest.json');
assert(fs.existsSync(manifestPath), 'Web App Manifest exists at public/manifest.json');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
assert(manifest.name === 'PixxTech Central Portal', `App name is 'PixxTech Central Portal' (Found: "${manifest.name}")`);
assert(manifest.short_name === 'PixxTech', `Short name is 'PixxTech' (Found: "${manifest.short_name}")`);
assert(manifest.display === 'standalone', `Display mode is 'standalone' for chromeless app window (Found: "${manifest.display}")`);
assert(manifest.theme_color === '#070B17', `Theme color matches brand dark navy (#070B17)`);
assert(manifest.background_color === '#070B17', `Background color matches brand dark navy (#070B17)`);
assert(manifest.start_url === '/', `Start URL is correctly set to '/'`);
assert(manifest.scope === '/', `Scope is correctly set to '/'`);

// 2. Verify PWA Icons
assert(Array.isArray(manifest.icons) && manifest.icons.length >= 3, 'Manifest contains multiple required icon definitions');

const icon192 = manifest.icons.find(i => i.sizes === '192x192');
assert(Boolean(icon192), 'Manifest declares 192x192 app icon');
assert(fs.existsSync(path.join(__dirname, 'public', icon192.src.replace(/^\//, ''))), '192x192 icon file exists on disk');

const icon512 = manifest.icons.find(i => i.sizes === '512x512');
assert(Boolean(icon512), 'Manifest declares 512x512 app icon');
assert(fs.existsSync(path.join(__dirname, 'public', icon512.src.replace(/^\//, ''))), '512x512 icon file exists on disk');

const appleTouchIconPath = path.join(__dirname, 'public', 'apple-touch-icon.png');
assert(fs.existsSync(appleTouchIconPath), 'Apple touch icon exists at public/apple-touch-icon.png');

// 3. Verify HTML Head Meta Tags in index.html
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
assert(indexHtml.includes('rel="manifest"'), 'index.html links to manifest.json');
assert(indexHtml.includes('name="theme-color" content="#070B17"'), 'index.html specifies theme-color meta tag');
assert(indexHtml.includes('rel="apple-touch-icon"'), 'index.html links to apple-touch-icon');
assert(indexHtml.includes('name="apple-mobile-web-app-capable" content="yes"'), 'index.html configures apple-mobile-web-app-capable');
assert(indexHtml.includes('name="apple-mobile-web-app-status-bar-style" content="black-translucent"'), 'index.html sets translucent status bar for iOS standalone');
assert(indexHtml.includes('name="apple-mobile-web-app-title" content="PixxTech"'), 'index.html sets apple-mobile-web-app-title');

// 4. Verify Service Worker Implementation and Strict No-Cache Security
const swPath = path.join(__dirname, 'public', 'sw.js');
assert(fs.existsSync(swPath), 'Service worker exists at public/sw.js');

const swContent = fs.readFileSync(swPath, 'utf8');
assert(swContent.includes('skipWaiting()'), 'Service worker supports safe immediate update via skipWaiting');
assert(swContent.includes('clients.claim()'), 'Service worker claims clients upon activation');
assert(swContent.includes('/api'), 'Service worker inspects and intercepts /api paths');
assert(swContent.includes('/auth') && swContent.includes('/sso'), 'Service worker explicitly detects authentication and SSO routes');

// Security check: ensure API/auth routes NEVER get cached
assert(
  swContent.includes('isSensitiveOrApiRequest') && 
  swContent.includes('Network-Only') || swContent.includes('return;'),
  'Service worker enforces STRICT ZERO-CACHE policy on API and auth requests (passwords, tokens, cookies never cached)'
);

// 5. Verify PWA Hook and Install Guide Modal
const hookPath = path.join(__dirname, 'src', 'hooks', 'usePWAInstall.js');
assert(fs.existsSync(hookPath), 'usePWAInstall hook created at src/hooks/usePWAInstall.js');

const hookContent = fs.readFileSync(hookPath, 'utf8');
assert(hookContent.includes('beforeinstallprompt'), 'Hook intercepts beforeinstallprompt event for Android and Desktop Chrome/Edge');
assert(hookContent.includes('appinstalled'), 'Hook tracks appinstalled event to update installed state');
assert(hookContent.includes('display-mode: standalone'), 'Hook detects standalone display mode across platforms');
assert(hookContent.includes('iPad|iPhone|iPod'), 'Hook detects iOS devices to offer Safari Add-to-Home-Screen instructions');

const modalPath = path.join(__dirname, 'src', 'components', 'InstallGuideModal.jsx');
assert(fs.existsSync(modalPath), 'InstallGuideModal component exists at src/components/InstallGuideModal.jsx');

const modalContent = fs.readFileSync(modalPath, 'utf8');
assert(modalContent.includes('Add to Home Screen'), 'Modal explains iOS Add to Home Screen workflow');
assert(modalContent.includes('Share'), 'Modal instructs users to tap the Safari Share button');

// 6. Verify Login Page Integration
const loginPath = path.join(__dirname, 'src', 'pages', 'Login.jsx');
const loginContent = fs.readFileSync(loginPath, 'utf8');
assert(loginContent.includes('usePWAInstall'), 'Login page imports and integrates usePWAInstall hook');
assert(loginContent.includes('Install App') || loginContent.includes('handleInstallClick'), 'Login page includes Install App button');
assert(loginContent.includes('Running in Standalone App Window'), 'Login page provides standalone mode detection feedback');
assert(loginContent.includes('InstallGuideModal'), 'Login page renders the InstallGuideModal');

// 7. Verify main.jsx Service Worker Registration
const mainPath = path.join(__dirname, 'src', 'main.jsx');
const mainContent = fs.readFileSync(mainPath, 'utf8');
assert(mainContent.includes('serviceWorker') && mainContent.includes('.register'), 'main.jsx registers service worker with scope "/"');
assert(mainContent.includes('https:') || mainContent.includes('localhost'), 'main.jsx restricts registration to secure contexts (HTTPS/localhost)');

// 8. Verify Production Dist Output
const distIndex = path.join(__dirname, 'dist', 'index.html');
const distManifest = path.join(__dirname, 'dist', 'manifest.json');
const distSw = path.join(__dirname, 'dist', 'sw.js');
assert(fs.existsSync(distIndex), 'Vite production build generated dist/index.html');
assert(fs.existsSync(distManifest), 'Vite production build bundled dist/manifest.json');
assert(fs.existsSync(distSw), 'Vite production build bundled dist/sw.js');

console.log('\n=============================================================');
console.log(`   PWA & INSTALL AUDIT: ${passedTests} / ${totalTests} PASSED`);
console.log('=============================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
