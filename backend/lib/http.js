import { HttpError } from './errors.js';

export function applySecurityHeaders(response) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
}

export function sendJson(response, statusCode, payload) {
  if (response.writableEnded) return;

  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(payload));
}

export async function readJsonBody(request, { maxBytes = 32_768 } = {}) {
  let size = 0;
  const chunks = [];

  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw new HttpError(413, 'Request body is too large');
    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'Invalid JSON body');
  }
}

function getAllowedOrigins() {
  const defaultOrigins = [
    'https://pipestock.netlify.app',
    'https://worktrackings.netlify.app',
  ];

  return String(process.env.CLIENT_ORIGIN || defaultOrigins.join(','))
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
}

export function handleCors(request, response) {
  const origin = request.headers.origin || '';
  const allowedOrigins = getAllowedOrigins();

  if (origin && allowedOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  }

  if (request.method === 'OPTIONS') {
    response.writeHead(origin && !allowedOrigins.includes(origin) ? 403 : 204);
    response.end();
    return true;
  }

  return false;
}
