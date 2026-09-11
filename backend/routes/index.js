import { HttpError } from '../lib/errors.js';
import { handleAuthRoutes } from './auth.js';
import { handleManagerRoutes } from './manager.js';
import { handleMaterialRoutes } from './materials.js';
import { handleMeRoutes } from './me.js';
import { handleOrderListRoutes } from './order-list.js';
import { handleOrderRoutes } from './orders.js';
import { handleProjectRoutes } from './projects.js';
import { handlePublicRoutes } from './public.js';
import { handleUploadRoutes } from './uploads.js';

const routeHandlers = [
  handlePublicRoutes,
  handleAuthRoutes,
  handleMeRoutes,
  handleUploadRoutes,
  handleProjectRoutes,
  handleManagerRoutes,
  handleMaterialRoutes,
  handleOrderListRoutes,
  handleOrderRoutes,
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
