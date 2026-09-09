const COOKIE_NAME = 'pipestock_refresh_token';

function parseCookies(header) {
  return Object.fromEntries(String(header || '').split(';').map(item => item.trim()).filter(Boolean).map(item => {
    const index = item.indexOf('=');
    return index === -1 ? [item, ''] : [item.slice(0, index), decodeURIComponent(item.slice(index + 1))];
  }));
}

export function readRefreshToken(request) {
  return parseCookies(request.headers.cookie)[COOKIE_NAME] || '';
}

export function setRefreshCookie(response, token, maxAgeSeconds) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}${secure}`);
}

export function clearRefreshCookie(response) {
  setRefreshCookie(response, '', 0);
}
