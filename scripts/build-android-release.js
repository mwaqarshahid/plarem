#!/usr/bin/env node
/**
 * Build a standalone release APK (JS bundle embedded — no Metro required).
 * Output: android/app/build/outputs/apk/release/app-release.apk
 */
const { spawnSync } = require('child_process');
const path = require('path');

const isWin = process.platform === 'win32';
const gradle = isWin ? 'gradlew.bat' : './gradlew';
const androidDir = path.join(__dirname, '..', 'android');

const sync = spawnSync('node', ['scripts/sync-env.js'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  shell: isWin,
});
if (sync.status !== 0) {
  process.exit(sync.status ?? 1);
}

const result = spawnSync(
  gradle,
  ['assembleRelease', '--no-daemon', '-PreactNativeArchitectures=arm64-v8a'],
  {
    cwd: androidDir,
    stdio: 'inherit',
    shell: isWin,
  },
);

process.exit(result.status ?? 1);
