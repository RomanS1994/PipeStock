import { HttpError } from '../lib/errors.js';
import { handleAuthRoutes } from './auth.js';
import { handleMeRoutes } from './me.js';
import { handleProjectRoutes } from './projects.js';
import { handlePublicRoutes } from './public.js';

const routeHandlers = [
  handlePublicRoutes,
  handleAuthRoutes,
  handleMeRoutes,
  handleProjectRoutes,
];

export async function routeRequest(request, response, context = {}) {
  const url = context.url || new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const routeContext = {
    url,
    pathName: context.pathName || url.pathname,
  };

  for (const handleRoute of routeHandlers) {
    if (await handleRoute(request, response, routeContext)) return;
  }

  throw new HttpError(404, 'Route not found');
}
