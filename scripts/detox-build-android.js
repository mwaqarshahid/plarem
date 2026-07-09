#!/usr/bin/env node
/**
 * Cross-platform Android Detox build (assembleDebug + androidTest).
 * Usage: node scripts/detox-build-android.js [debug|release]
 */
const { spawnSync } = require('child_process');
const path = require('path');

const buildType = (process.argv[2] || 'debug').toLowerCase();
const isWin = process.platform === 'win32';
const gradle = isWin ? 'gradlew.bat' : './gradlew';
const androidDir = path.join(__dirname, '..', 'android');
const assembleApp = buildType === 'release' ? 'assembleRelease' : 'assembleDebug';
const testBuildType = buildType === 'release' ? 'release' : 'debug';

const result = spawnSync(
  gradle,
  [assembleApp, 'assembleAndroidTest', `-DtestBuildType=${testBuildType}`],
  { cwd: androidDir, stdio: 'inherit', shell: isWin },
);

process.exit(result.status ?? 1);
