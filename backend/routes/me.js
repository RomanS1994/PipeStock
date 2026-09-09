import { requireAuth, serializeUser } from '../auth/current-user.js';
import { sendJson } from '../lib/http.js';

export async function handleMeRoutes(request, response, { pathName }) {
  if (request.method === 'GET' && pathName === '/api/me') {
    const user = await requireAuth(request);
    sendJson(response, 200, { user: serializeUser(user) });
    return true;
  }

  return false;
}
