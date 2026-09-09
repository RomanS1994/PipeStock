function readPositiveNumber(name, fallback) {
  const raw = Number(process.env[name] || fallback);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

export function getAuthTokenSecret() {
  return String(process.env.AUTH_TOKEN_SECRET || '').trim();
}

export function getAccessTokenTtlMinutes() {
  return readPositiveNumber('ACCESS_TOKEN_TTL_MINUTES', 60);
}

export function getRefreshTokenTtlHours() {
  return readPositiveNumber('REFRESH_TOKEN_TTL_HOURS', 720);
}

export function assertRuntimeEnv() {
  const required = ['DATABASE_URL', 'AUTH_TOKEN_SECRET'];
  const missing = required.filter(key => !String(process.env[key] || '').trim());

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (getAuthTokenSecret().length < 32) {
    throw new Error('AUTH_TOKEN_SECRET must contain at least 32 characters');
  }
}
