#!/usr/bin/env node
/**
 * Copies the release APK into dist/ with a stable filename for sideloading / tester distribution.
 */
const fs = require('fs');
const path = require('path');

const version = require('../package.json').version;
const source = path.join(
  __dirname,
  '..',
  'android',
  'app',
  'build',
  'outputs',
  'apk',
  'release',
  'app-release.apk',
);
const distDir = path.join(__dirname, '..', 'dist');
const target = path.join(distDir, `plarem-${version}-release.apk`);
const latest = path.join(distDir, 'plarem-release.apk');

if (!fs.existsSync(source)) {
  console.error(`Release APK not found. Run: npm run android:release\n  Expected: ${source}`);
  process.exit(1);
}

fs.mkdirSync(distDir, { recursive: true });
fs.copyFileSync(source, target);
fs.copyFileSync(source, latest);

const sizeMb = (fs.statSync(target).size / (1024 * 1024)).toFixed(1);
console.log(`Copied ${sizeMb} MB → ${path.relative(process.cwd(), target)}`);
console.log(`Latest alias → ${path.relative(process.cwd(), latest)}`);
