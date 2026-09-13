import { getDatabaseHealth } from '../db/store.js';
import { sendJson } from '../lib/http.js';

export async function handlePublicRoutes(request, response, { pathName }) {
  if (request.method === 'GET' && pathName === '/api/health') {
    const health = await getDatabaseHealth();

    if (!health.ok && health.error) {
      console.error('Database health check failed:', health.error);
    }

    sendJson(response, health.ok ? 200 : 503, {
      ok: health.ok,
      database: health.database,
      time: new Date().toISOString(),
    });
    return true;
  }

  return false;
}
