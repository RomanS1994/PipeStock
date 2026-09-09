export function sendJson(response, statusCode, payload) {
  if (response.writableEnded) return;

  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(payload));
}

function getAllowedOrigins() {
  return String(process.env.CLIENT_ORIGIN || '')
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
