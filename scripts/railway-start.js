const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./database.db';
}

const sqlitePrefix = 'file:';
if (process.env.DATABASE_URL.startsWith(sqlitePrefix)) {
  const dbPath = process.env.DATABASE_URL.slice(sqlitePrefix.length);
  if (path.isAbsolute(dbPath)) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
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
