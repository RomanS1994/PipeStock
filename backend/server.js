import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadEnvFile } from './config/load-env.js';
import { assertRuntimeEnv } from './config/runtime-env.js';
import { prisma } from './db/prisma.js';
import { sendHttpError } from './lib/errors.js';
import { applySecurityHeaders, handleCors, sendJson } from './lib/http.js';
import { routeRequest } from './routes/index.js';

const serverDir = path.dirname(fileURLToPath(import.meta.url));
loadEnvFile(path.join(serverDir, '.env'));

const PORT = Number(process.env.PORT || process.env.BACKEND_PORT || 3001);
const HOST = '0.0.0.0';

try {
  assertRuntimeEnv();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const server = http.createServer(async (request, response) => {
  applySecurityHeaders(response);

  try {
    if (handleCors(request, response)) return;

    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) {
      await routeRequest(request, response, { url, pathName: url.pathname });
      return;
    }

    if ((request.method === 'GET' || request.method === 'HEAD') && url.pathname === '/') {
      if (request.method === 'HEAD') {
        response.writeHead(200, { 'Cache-Control': 'no-store' });
        response.end();
        return;
      }

      sendJson(response, 200, {
        ok: true,
        service: 'PipeStock API',
        health: '/api/health',
      });
      return;
    }

    sendJson(response, 404, { error: 'Route not found' });
  } catch (error) {
    sendHttpError(response, error);
  }
});

async function startServer() {
  await prisma.$connect();
  server.listen(PORT, HOST, () => {
    console.log(`PipeStock is running on http://${HOST}:${PORT}`);
  });
}

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}. Closing PipeStock...`);

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => shutdown(signal));
}

startServer().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
