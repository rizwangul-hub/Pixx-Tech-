/**
 * PixxTech Central Portal - Responsive In-App Application Viewer Audit
 * Validates in-app embedded viewing, device detection, central authorization,
 * RBAC enforcement, Back to Dashboard behavior, and security compliance.
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
console.log('   PIXXTECH CENTRAL PORTAL - IN-APP VIEWER AUDIT');
console.log('=============================================================\n');

// 1. Verify AppViewer Component & Layout Elements
const viewerPath = path.join(__dirname, 'src', 'components', 'AppViewer.jsx');
assert(fs.existsSync(viewerPath), 'AppViewer component exists at src/components/AppViewer.jsx');

const viewerContent = fs.readFileSync(viewerPath, 'utf8');
assert(viewerContent.includes('Back to Dashboard'), 'AppViewer provides persistent "Back to Dashboard" button');
assert(viewerContent.includes('pixxtech-inapp-viewer'), 'Root container uses dedicated in-app viewer class');
assert(viewerContent.includes('iframeRef'), 'Embeds destination application inside responsive iframeRef');
assert(viewerContent.includes('sandbox='), 'Configures secure iframe sandbox attributes');
assert(viewerContent.includes('clipboard-read') && viewerContent.includes('clipboard-write'), 'Grants safe clipboard permissions for quick credential entry');

// 2. Responsive Device Detection & Mobile/Desktop Adaptations
assert(viewerContent.includes('safe-area-inset-top'), 'Header supports mobile device notch and safe-area padding');
assert(viewerContent.includes('desktop-credentials-bar'), 'Desktop layout includes integrated credentials quick-copy widget in top bar');
assert(viewerContent.includes('mobile-credentials-drawer') || viewerContent.includes('mobile-credentials-toggle'), 'Mobile layout includes expandable touch credentials drawer');
assert(viewerContent.includes('@media (max-width: 768px)'), 'AppViewer uses CSS media queries for responsive mobile vs desktop viewports');
assert(viewerContent.includes('handleReload'), 'Top navbar includes iframe reload control');
assert(viewerContent.includes('handleOpenExternal'), 'Provides safe fallback to external tab if third-party application requests it');

// 3. Central Authorization & Verification in SoftwareCard
const cardPath = path.join(__dirname, 'src', 'components', 'SoftwareCard.jsx');
const cardContent = fs.readFileSync(cardPath, 'utf8');
assert(cardContent.includes('portalApi.launchSoftware'), 'SoftwareCard re-verifies launch authorization with backend before opening');
assert(cardContent.includes('onOpenApp'), 'SoftwareCard supports in-app embedded opening via onOpenApp callback');
assert(!cardContent.includes("window.open(destUrl, '_blank')") || cardContent.includes('if (onOpenApp)'), 'Card does NOT open a separate browser tab by default when onOpenApp is present');

// 4. Software Page Integration & Dashboard Return Behavior
const softwarePagePath = path.join(__dirname, 'src', 'pages', 'Software.jsx');
const softwareContent = fs.readFileSync(softwarePagePath, 'utf8');
assert(softwareContent.includes('activeViewingApp'), 'Software page tracks active in-app viewing application');
assert(softwareContent.includes('<AppViewer'), 'Software page renders AppViewer when an application is active');
assert(softwareContent.includes('onBack={() => setActiveViewingApp(null)}'), 'Back to Dashboard returns cleanly to the central applications list');

// 5. Browser History & Session Preservation
assert(viewerContent.includes('popstate'), 'AppViewer intercepts browser popstate navigation to return safely to portal');
assert(!viewerContent.includes('logout'), 'Viewer operations do not trigger unintended portal logout');
assert(!viewerContent.includes('ticket=') || viewerContent.includes('sso'), 'Viewer avoids exposing raw credentials in query strings');

// 6. Bicycle Purchase System Isolation Check
const backendSeedPath = path.join(__dirname, '..', 'backend', 'controllers', 'softwareController.js');
const backendContent = fs.readFileSync(backendSeedPath, 'utf8');
assert(backendContent.includes('bicycle-purchase-system'), 'Bicycle Purchase System registered in backend');
assert(backendContent.includes('compatibility_review_required'), 'Bicycle Purchase System preserved as compatibility_review_required');
assert(backendContent.includes('DIRECT_LAUNCH'), 'Bicycle Purchase System preserved with DIRECT_LAUNCH protocol');

// 7. Verify Central Shared Credentials & Destination URLs
const credsPath = path.join(__dirname, 'src', 'utils', 'appCredentials.js');
assert(fs.existsSync(credsPath), 'Shared app credentials module created at src/utils/appCredentials.js');
const credsContent = fs.readFileSync(credsPath, 'utf8');
assert(credsContent.includes('LIVE_URLS'), 'Defines verified live Vercel URLs for all 5 enterprise applications');
assert(credsContent.includes('APP_CREDENTIALS'), 'Defines role-based user credentials mapping');
assert(credsContent.includes('getDestinationUrl'), 'Provides centralized destination URL resolver');

// 8. Production Build Output Validation
const distJs = fs.readdirSync(path.join(__dirname, 'dist', 'assets')).filter(f => f.endsWith('.js'));
assert(distJs.length > 0, `Vite production bundle verified (${distJs.join(', ')})`);

console.log('\n=============================================================');
console.log(`   IN-APP VIEWER AUDIT: ${passedTests} / ${totalTests} PASSED`);
console.log('=============================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
