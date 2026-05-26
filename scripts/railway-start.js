const { spawnSync } = require('child_process');
require('dotenv').config();

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
