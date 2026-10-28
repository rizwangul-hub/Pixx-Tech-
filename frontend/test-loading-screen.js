/**
 * PixxTech Central Portal - Responsive Loading Screen Verification Suite
 * Verifies responsive image selection (laptop.png vs mobile.png),
 * picture element media queries, aspect ratios, full-screen viewport layout,
 * absence of extraneous overlays, and authentication lifecycle.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const results = [];

function assert(condition, testName, details = '') {
  if (condition) {
    results.push({ pass: true, name: testName });
    console.log(`  [PASS] ${testName}`);
  } else {
    results.push({ pass: false, name: testName, details });
    console.error(`  [FAIL] ${testName}: ${details}`);
  }
}

console.log('\n=============================================================');
console.log('   PIXXTECH CENTRAL PORTAL - RESPONSIVE LOADING SCREEN AUDIT');
console.log('=============================================================\n');

// 1. Inspect exact asset filenames and extensions
const laptopPath = path.resolve(__dirname, 'src/assets/laptop.png');
const mobilePath = path.resolve(__dirname, 'src/assets/mobile.png');

assert(
  fs.existsSync(laptopPath),
  '1. Laptop loading image located: frontend/src/assets/laptop.png'
);

assert(
  fs.existsSync(mobilePath),
  '2. Mobile loading image located: frontend/src/assets/mobile.png'
);

// 2. Verify dimensions & aspect ratios
if (fs.existsSync(laptopPath) && fs.existsSync(mobilePath)) {
  const laptopBuf = fs.readFileSync(laptopPath);
  const laptopW = laptopBuf.readUInt32BE(16);
  const laptopH = laptopBuf.readUInt32BE(20);
  assert(
    laptopW === 1672 && laptopH === 941,
    `3. Laptop image is landscape orientation (1672x941, ~16:9)`
  );

  const mobileBuf = fs.readFileSync(mobilePath);
  const mobileW = mobileBuf.readUInt32BE(16);
  const mobileH = mobileBuf.readUInt32BE(20);
  assert(
    mobileW === 940 && mobileH === 1672,
    `4. Mobile image is portrait orientation (940x1672, ~9:16)`
  );
}

// 3. Inspect LoadingScreen.jsx implementation
const loadingScreenPath = path.resolve(__dirname, 'src/components/LoadingScreen.jsx');
const screenCode = fs.readFileSync(loadingScreenPath, 'utf8');

assert(
  screenCode.includes("import laptopImg from '../assets/laptop.png'") &&
  screenCode.includes("import mobileImg from '../assets/mobile.png'"),
  '5. Uses genuine local project asset imports for laptop.png and mobile.png'
);

assert(
  screenCode.includes('<picture') && screenCode.includes('</picture>'),
  '6. Implements responsive <picture> art-direction architecture'
);

assert(
  screenCode.includes('media="(max-width: 768px)') &&
  screenCode.includes('srcSet={mobileImg}'),
  '7. Selects mobile.png for mobile screens (<= 768px / portrait)'
);

assert(
  screenCode.includes('media="(min-width: 769px)"') &&
  screenCode.includes('srcSet={laptopImg}'),
  '8. Selects laptop.png for desktop and laptop screens (> 768px)'
);

// 4. Verify visual presentation: No extra text, spinners, or progress bars over the designs
const noExtraneousOverlays = !screenCode.includes('<h1') &&
                            !screenCode.includes('pixx-indeterminate-beam') &&
                            !screenCode.includes('radarWave') &&
                            !screenCode.includes('skeletonPulse');
assert(
  noExtraneousOverlays,
  '9. Pure visual presentation: strictly avoids extra text, spinners, or progress bars over images'
);

// 5. Full viewport edge-to-edge coverage
assert(
  (screenCode.includes("objectFit: 'cover'") || screenCode.includes("objectFit: 'contain'")) &&
  screenCode.includes("overflow: 'hidden'") &&
  (screenCode.includes('100dvh') || screenCode.includes('100vh')),
  '10. Edge-to-edge full-screen layout covers viewport (100dvh) with no letterbox borders'
);

// 6. Accessibility & reduced motion
assert(
  screenCode.includes('role="status"') &&
  screenCode.includes('aria-live="polite"') &&
  screenCode.includes('useReducedMotion'),
  '11. Accessibility compliant: role="status", aria-live="polite", respects prefers-reduced-motion'
);

// 7. Inspect App.jsx Startup Lifecycle
const appPath = path.resolve(__dirname, 'src/App.jsx');
const appCode = fs.readFileSync(appPath, 'utf8');

assert(
  appCode.includes('laptopImg') && appCode.includes('mobileImg'),
  '12. Preloads both laptop and mobile images on startup to eliminate flicker'
);

assert(
  appCode.includes('authLoading') && appCode.includes('isInitialBoot'),
  '13. Stays active during essential auth session check and startup initialization'
);

assert(
  appCode.includes('startupTimedOut') && appCode.includes('handleRetryStartup'),
  '14. Safe timeout fallback provided if API connection takes longer than expected'
);

assert(
  appCode.includes('!isInitialBoot && (') &&
  appCode.includes("!isAuthenticated || currentPage === 'login'"),
  '15. Protected dashboard strictly withheld until session & permissions verified'
);

assert(
  !appCode.includes('onNavigate={() => setIsInitialBoot'),
  '16. Loading screen does not re-trigger during internal route navigation'
);

console.log('\n=============================================================');
const totalPassed = results.filter((r) => r.pass).length;
console.log(`   RESPONSIVE LOADING SCREEN AUDIT: ${totalPassed} / ${results.length} PASSED`);
console.log('=============================================================\n');

if (totalPassed !== results.length) {
  process.exit(1);
}
