import { spawnSync } from 'node:child_process';

if (!process.env.DATABASE_URL) {
  console.log('Skipping Prisma generate: DATABASE_URL is not configured.');
  process.exit(0);
}

const result = spawnSync('npx', ['prisma', 'generate'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
