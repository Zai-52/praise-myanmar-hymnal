// scripts/bump-version.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const JSON_PATH = path.join(ROOT, 'assets', 'hymns.json');
const DB_TS_PATH = path.join(ROOT, 'src', 'db', 'database.ts');
const HASH_CACHE = path.join(ROOT, '.last_json_hash');

// 1. Check if json exists
if (!fs.existsSync(JSON_PATH)) {
  console.error('❌ Error: assets/hymns.json not found.');
  process.exit(1);
}

// 2. Hash the current JSON content
const content = fs.readFileSync(JSON_PATH, 'utf8');
const currentHash = crypto.createHash('md5').update(content).digest('hex');

// 3. Check against last run
let lastHash = '';
if (fs.existsSync(HASH_CACHE)) {
  lastHash = fs.readFileSync(HASH_CACHE, 'utf8').trim();
}

if (currentHash === lastHash) {
  console.log('✅ No changes detected in hymns.json. Skipping.');
  process.exit(0);
}

// 4. Read current version
let dbCode = fs.readFileSync(DB_TS_PATH, 'utf8');
const match = dbCode.match(/export const BUNDLED_DATA_VERSION = (\d+)/);

if (!match) {
  console.error('❌ Error: Could not find BUNDLED_DATA_VERSION in database.ts');
  process.exit(1);
}

const currentVersion = parseInt(match[1], 10);
const nextVersion = currentVersion + 1;

// 5. Update code
const newDbCode = dbCode.replace(/export const BUNDLED_DATA_VERSION = \d+/, `export const BUNDLED_DATA_VERSION = ${nextVersion}`);
fs.writeFileSync(DB_TS_PATH, newDbCode);

// 6. Save new hash
fs.writeFileSync(HASH_CACHE, currentHash);

console.log(`🚀 Changes detected in hymns.json!`);
console.log(`   Bumped version to: ${nextVersion}`);
console.log(`   👉 Restart the app to re-seed the database.`);