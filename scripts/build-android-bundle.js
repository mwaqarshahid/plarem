#!/usr/bin/env node
/**
 * Build a Play Store Android App Bundle (JS bundle embedded — no Metro required).
 * Output: android/app/build/outputs/bundle/release/app-release.aab
 */
const { spawnSync } = require('child_process');
const path = require('path');

const isWin = process.platform === 'win32';
const gradle = isWin ? 'gradlew.bat' : './gradlew';
const androidDir = path.join(__dirname, '..', 'android');
const propsPath = path.join(androidDir, 'keystore.properties');

if (!require('fs').existsSync(propsPath)) {
  console.error('Missing android/keystore.properties. Run: npm run android:keystore');
  process.exit(1);
}

const sync = spawnSync('node', ['scripts/sync-env.js'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  shell: isWin,
});
if (sync.status !== 0) {
  process.exit(sync.status ?? 1);
}

const result = spawnSync(gradle, ['bundleRelease', '--no-daemon'], {
  cwd: androidDir,
  stdio: 'inherit',
  shell: isWin,
});

process.exit(result.status ?? 1);
