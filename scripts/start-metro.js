#!/usr/bin/env node
/**
 * Metro workers set FORCE_COLOR; Cursor/CI often sets NO_COLOR.
 * Having both set triggers a Node warning on every worker spawn.
 */
delete process.env.NO_COLOR;

const { spawn } = require('child_process');
const path = require('path');

const child = spawn(
  process.execPath,
  [path.join(__dirname, '..', 'node_modules', 'react-native', 'cli.js'), 'start', ...process.argv.slice(2)],
  { stdio: 'inherit', env: process.env },
);

child.on('exit', code => {
  process.exit(code ?? 1);
});
