const fs = require('fs');
const path = require('path');

const PLACEHOLDER = '__CACHE_VERSION__';
const swPath = path.join(__dirname, '..', 'public', 'sw.js');

// Use Vercel's commit SHA (short) so each deploy gets a new cache; fallback to timestamp for local
const version =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
  `local-${Date.now()}`;

let content = fs.readFileSync(swPath, 'utf8');
if (!content.includes(PLACEHOLDER)) {
  console.warn('inject-sw-version: __CACHE_VERSION__ not found in sw.js, skipping');
  process.exit(0);
}
content = content.split(PLACEHOLDER).join(version);
fs.writeFileSync(swPath, content);
console.log('inject-sw-version: set cache version to', version);
