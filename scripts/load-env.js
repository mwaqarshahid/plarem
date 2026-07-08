const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '..', '.env');

/** Parses a simple KEY=VALUE .env file. */
function loadEnv(envPath = ENV_PATH) {
  const env = {};
  if (!fs.existsSync(envPath)) {
    return env;
  }

  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

module.exports = { loadEnv, ENV_PATH };

if (require.main === module) {
  const key = process.argv[2];
  if (!key) {
    process.exit(1);
  }
  const value = loadEnv()[key] ?? '';
  process.stdout.write(value);
}
