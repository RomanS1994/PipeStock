import { HttpError } from '../lib/errors.js';
import { handlePublicRoutes } from './public.js';

const routeHandlers = [handlePublicRoutes];

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
