const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

function sqlitePathFromUrl(url) {
  if (!url || !url.startsWith('file:')) return null;
  return url.slice('file:'.length);
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./database.db';
  console.log('DATABASE_URL not set; using file:./database.db');
}

const sqlitePath = sqlitePathFromUrl(process.env.DATABASE_URL);
if (sqlitePath && sqlitePath !== ':memory:') {
  const dbPath = path.isAbsolute(sqlitePath)
    ? sqlitePath
    : path.resolve(__dirname, '..', 'prisma', sqlitePath);
  const dbDir = path.dirname(dbPath);
  fs.mkdirSync(dbDir, { recursive: true });
}

const push = spawnSync('npx prisma db push --skip-generate', {
  stdio: 'inherit',
  env: process.env,
  shell: true
});

if (push.error) {
  console.error('Failed to run Prisma schema sync:', push.error);
}

if (push.status !== 0) {
  process.exit(push.status || 1);
}

require('../server');
