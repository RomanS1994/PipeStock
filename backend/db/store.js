import { prisma } from './prisma.js';

export async function getDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, database: 'postgresql' };
  } catch (error) {
    return {
      ok: false,
      database: 'postgresql',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
