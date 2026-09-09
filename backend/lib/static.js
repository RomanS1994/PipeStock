import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import path from 'node:path';

import { HttpError } from './errors.js';

const CONTENT_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
]);

function resolvePublicPath(distDir, pathName) {
  const decodedPath = decodeURIComponent(pathName || '/');
  const relativePath = decodedPath.replace(/^\/+/, '');
  const candidate = path.resolve(distDir, relativePath || 'index.html');
  const relativeCandidate = path.relative(distDir, candidate);

  if (relativeCandidate.startsWith('..') || path.isAbsolute(relativeCandidate)) {
    throw new HttpError(400, 'Invalid path');
  }

  return candidate;
}

async function isFile(filePath) {
  try {
    await access(filePath);
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

function writeFileResponse(request, response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const isHashedAsset = filePath.includes(`${path.sep}assets${path.sep}`);

  response.writeHead(200, {
    'Content-Type': CONTENT_TYPES.get(extension) || 'application/octet-stream',
    'Cache-Control': isHashedAsset
      ? 'public, max-age=31536000, immutable'
      : 'no-cache',
  });

  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  createReadStream(filePath).pipe(response);
}

export async function serveWebApp(request, response, { distDir, pathName }) {
  if (!['GET', 'HEAD'].includes(request.method || '')) {
    throw new HttpError(405, 'Method not allowed');
  }

  const requestedFile = resolvePublicPath(distDir, pathName);
  if (await isFile(requestedFile)) {
    writeFileResponse(request, response, requestedFile);
    return;
  }

  const indexFile = path.join(distDir, 'index.html');
  if (!(await isFile(indexFile))) {
    throw new HttpError(503, 'Frontend build is not available');
  }

  writeFileResponse(request, response, indexFile);
}
