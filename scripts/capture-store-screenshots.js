#!/usr/bin/env node
/**
 * Capture Play Store screenshots (light + dark) of the full Plarem flow.
 *
 * Prerequisites:
 *   - Device connected (adb)
 *   - Debug app installed (com.plarem)
 *   - Metro running for debug builds
 *
 * Usage: node scripts/capture-store-screenshots.js
 * Output: dist/store-screenshots/{light,dark}/
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist', 'store-screenshots');
const SERIAL = process.env.ANDROID_SERIAL || '';
const PACKAGE = 'com.plarem';
const ACTIVITY = `${PACKAGE}/.MainActivity`;

const adbBase = SERIAL ? ['-s', SERIAL] : [];
const sleep = ms => new Promise(r => setTimeout(r, ms));

const adb = (...args) => {
  execFileSync('adb', [...adbBase, ...args], { stdio: 'pipe' });
};

const adbOut = (...args) =>
  execFileSync('adb', [...adbBase, ...args], { encoding: 'utf8' });

const ensureDir = dir => fs.mkdirSync(dir, { recursive: true });

const dumpUi = () => {
  adb('shell', 'uiautomator', 'dump', '/sdcard/ui.xml');
  return adbOut('shell', 'cat', '/sdcard/ui.xml');
};

/** Parse uiautomator dump for a node whose text/content-desc contains needle.
 * Prefers exact matches, then the lowest (bottom-most) hit — important for
 * tab labels that also appear in body copy ("reminders").
 */
const findCenter = (xml, needle) => {
  const lower = needle.toLowerCase();
  const chunks = xml.split('<node ');
  const hits = [];
  for (const chunk of chunks) {
    const textM = chunk.match(/\btext="([^"]*)"/);
    const descM = chunk.match(/\bcontent-desc="([^"]*)"/);
    const boundsM = chunk.match(/\bbounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
    if (!boundsM) {
      continue;
    }
    const text = textM?.[1] ?? '';
    const desc = descM?.[1] ?? '';
    const label = `${text} ${desc}`.trim();
    if (!label.toLowerCase().includes(lower)) {
      continue;
    }
    const x1 = Number(boundsM[1]);
    const y1 = Number(boundsM[2]);
    const x2 = Number(boundsM[3]);
    const y2 = Number(boundsM[4]);
    if (x2 - x1 < 4 || y2 - y1 < 4) {
      continue;
    }
    const exact =
      text.toLowerCase() === lower || desc.toLowerCase() === lower;
    hits.push({
      x: Math.round((x1 + x2) / 2),
      y: Math.round((y1 + y2) / 2),
      label,
      exact,
      y2,
    });
  }
  if (hits.length === 0) {
    return null;
  }
  hits.sort((a, b) => {
    if (a.exact !== b.exact) {
      return a.exact ? -1 : 1;
    }
    return b.y2 - a.y2; // prefer bottom-most
  });
  return hits[0];
};

const tap = (x, y) => adb('shell', 'input', 'tap', String(x), String(y));

const tapLabel = async (needle, retries = 6) => {
  for (let i = 0; i < retries; i += 1) {
    const xml = dumpUi();
    const hit = findCenter(xml, needle);
    if (hit) {
      console.log(`  tap "${needle}" @ ${hit.x},${hit.y}`);
      tap(hit.x, hit.y);
      await sleep(1000);
      return true;
    }
    await sleep(600);
  }
  console.log(`  ! could not find "${needle}"`);
  return false;
};

const typeText = text => {
  adb('shell', 'input', 'text', text.replace(/ /g, '%s'));
};

const screenshot = (dir, name) => {
  const remote = '/sdcard/plarem-shot.png';
  const local = path.join(dir, `${name}.png`);
  adb('shell', 'screencap', '-p', remote);
  adb('pull', remote, local);
  try {
    adb('shell', 'rm', remote);
  } catch {
    // ignore
  }
  console.log(`  ✓ ${path.relative(ROOT, local)}`);
};

const copySplash = (mode, dir) => {
  const src = path.join(
    ROOT,
    'brand',
    'export',
    'splash',
    `splash-${mode}-portrait-phone.png`,
  );
  const dest = path.join(dir, '01-splash.png');
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  ✓ ${path.relative(ROOT, dest)} (from brand kit)`);
  }
};

const setSystemNightMode = mode => {
  // Forces system (and app "System" theme) light/dark for onboarding shots.
  adb('shell', 'cmd', 'uimode', 'night', mode === 'dark' ? 'yes' : 'no');
};

const grantAppPermissions = () => {
  const permissions = [
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.ACCESS_BACKGROUND_LOCATION',
    'android.permission.POST_NOTIFICATIONS',
  ];
  for (const permission of permissions) {
    try {
      adb('shell', 'pm', 'grant', PACKAGE, permission);
    } catch {
      // Older API / already granted
    }
  }
  try {
    adb('shell', 'appops', 'set', PACKAGE, 'ACCESS_BACKGROUND_LOCATION', 'allow');
  } catch {
    // ignore
  }
  try {
    adb('shell', 'dumpsys', 'deviceidle', 'whitelist', `+${PACKAGE}`);
  } catch {
    // ignore
  }
};

const launchFresh = async () => {
  try {
    adb('shell', 'am', 'force-stop', PACKAGE);
  } catch {
    // ignore
  }
  adb('shell', 'pm', 'clear', PACKAGE);
  await sleep(600);
  grantAppPermissions();
  try {
    adb('reverse', 'tcp:8081', 'tcp:8081');
  } catch {
    // ignore
  }
  adb('shell', 'am', 'start', '-n', ACTIVITY);
  await sleep(9000);
};

const dismissSystemDialogs = async () => {
  // Only act on the system permission controller — not in-app buttons that
  // also say "While using the app".
  for (let i = 0; i < 3; i += 1) {
    const xml = dumpUi();
    if (!xml.includes('com.android.permissioncontroller')) {
      return;
    }
    if (xml.toLowerCase().includes('while using')) {
      await tapLabel('While using the app');
      await sleep(700);
      continue;
    }
    if (xml.toLowerCase().includes('allow all the time')) {
      await tapLabel('Allow all the time');
      await sleep(700);
      continue;
    }
    if (/\ballow\b/i.test(xml)) {
      await tapLabel('Allow');
      await sleep(700);
      continue;
    }
    return;
  }
};

/** Capture each onboarding step, then grant the permission (not skip). */
const grantOnboardingCapturing = async dir => {
  const steps = [
    { file: '02-onboarding-welcome', after: 'Continue' },
    { file: '03-onboarding-location', after: 'Allow while using the app' },
    { file: '04-onboarding-background', after: 'Allow all the time' },
    { file: '05-onboarding-battery', after: 'Allow background activity' },
    { file: '06-onboarding-notifications', after: 'Allow notifications' },
  ];

  for (const step of steps) {
    await sleep(700);
    screenshot(dir, step.file);
    await tapLabel(step.after);
    await sleep(500);
    await dismissSystemDialogs();
    // Battery / OEM dialogs: press back if a system settings activity stole focus
    const xml = dumpUi();
    if (!xml.includes(PACKAGE) && !xml.includes('onboarding')) {
      try {
        adb('shell', 'input', 'keyevent', '4');
        await sleep(600);
        adb('shell', 'am', 'start', '-n', ACTIVITY);
        await sleep(1500);
      } catch {
        // ignore
      }
    }
  }
};

const captureAppFlow = async (dir, mode) => {
  console.log(`\n=== ${mode.toUpperCase()} ===`);
  ensureDir(dir);
  setSystemNightMode(mode);
  await sleep(400);
  copySplash(mode, dir);

  await launchFresh();
  await grantOnboardingCapturing(dir);

  await sleep(1200);
  screenshot(dir, '07-home-empty');

  // Lock appearance to this mode inside the app as well
  await tapLabel('Settings');
  await sleep(800);
  await tapLabel(mode === 'light' ? 'Light' : 'Dark');
  await sleep(700);
  screenshot(dir, '08-settings');

  await tapLabel('Reminders');
  await sleep(700);
  screenshot(dir, '09-home');

  // FAB uses accessibilityLabel "Create reminder"
  const openedForm = await tapLabel('Create reminder');
  if (!openedForm) {
    // Fallback: bottom-right FAB coordinates (1080×2400 logical)
    console.log('  tap FAB fallback @ 930,2046');
    tap(930, 2046);
    await sleep(1200);
  } else {
    await sleep(400);
  }
  screenshot(dir, '10-new-reminder');

  // Fill title for a richer store shot
  let xml = dumpUi();
  const titleField =
    findCenter(xml, 'Buy eggs') ||
    findCenter(xml, 'e.g.') ||
    findCenter(xml, 'Title');
  if (titleField) {
    tap(titleField.x, titleField.y);
    await sleep(400);
    typeText('Buy_milk');
    await sleep(400);
    try {
      adb('shell', 'input', 'keyevent', '4');
    } catch {
      // ignore
    }
    await sleep(500);
    screenshot(dir, '11-new-reminder-filled');
  }

  await tapLabel('Choose a location');
  await sleep(3000);
  screenshot(dir, '12-location-picker');

  // Prefer the in-app back control
  xml = dumpUi();
  if (findCenter(xml, 'Go back')) {
    await tapLabel('Go back');
  } else {
    try {
      adb('shell', 'input', 'keyevent', '4');
    } catch {
      // ignore
    }
  }
  await sleep(800);

  try {
    adb('shell', 'input', 'keyevent', '4');
  } catch {
    // ignore
  }
  await sleep(700);
  screenshot(dir, '13-home-final');
};

async function main() {
  console.log('Capturing Play Store screenshots…');
  const devices = adbOut('devices');
  if (!/\tdevice\b/.test(devices)) {
    throw new Error('No authorized Android device found');
  }
  console.log(`Using: ${SERIAL || 'default adb device'}`);

  await captureAppFlow(path.join(OUT, 'dark'), 'dark');
  await captureAppFlow(path.join(OUT, 'light'), 'light');

  // Restore system night mode to auto
  try {
    adb('shell', 'cmd', 'uimode', 'night', 'auto');
  } catch {
    // ignore
  }

  console.log(`\nDone → ${path.relative(ROOT, OUT)}/`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
