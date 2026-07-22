#!/usr/bin/env node
/**
 * Copies the release AAB into dist/ for Play Console upload.
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
  'bundle',
  'release',
  'app-release.aab',
);
const distDir = path.join(__dirname, '..', 'dist');
const target = path.join(distDir, `plarem-${version}-release.aab`);
const latest = path.join(distDir, 'plarem-release.aab');

if (!fs.existsSync(source)) {
  console.error(`Release AAB not found. Run: npm run android:bundle\n  Expected: ${source}`);
  process.exit(1);
}

fs.mkdirSync(distDir, { recursive: true });
fs.copyFileSync(source, target);
fs.copyFileSync(source, latest);

const sizeMb = (fs.statSync(target).size / (1024 * 1024)).toFixed(1);
console.log(`Copied ${sizeMb} MB → ${path.relative(process.cwd(), target)}`);
console.log(`Latest alias → ${path.relative(process.cwd(), latest)}`);
console.log('Upload this .aab in Play Console → Production / Testing → Create release.');
