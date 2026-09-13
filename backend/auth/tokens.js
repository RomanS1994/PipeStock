import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { getAccessTokenTtlMinutes, getAuthTokenSecret, getRefreshTokenTtlHours } from '../config/runtime-env.js';

const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_SALT_BYTES = 16;
const REFRESH_TOKEN_BYTES = 48;

function signPayload(payload) {
  return createHmac('sha256', getAuthTokenSecret()).update(payload).digest('base64url');
}

export function hashPassword(password) {
  const salt = randomBytes(PASSWORD_SALT_BYTES).toString('hex');
  const hash = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || '').split(':');
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, PASSWORD_KEY_LENGTH);
  const stored = Buffer.from(hash, 'hex');
  return stored.length === derived.length && timingSafeEqual(stored, derived);
}

export function createRefreshToken() {
  return randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
}

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function createAccessToken({ userId, sessionId }, now = Date.now()) {
  const expiresAt = now + getAccessTokenTtlMinutes() * 60_000;
  const payload = Buffer.from(JSON.stringify({ typ: 'access', sub: userId, sid: sessionId, exp: Math.floor(expiresAt / 1000) })).toString('base64url');
  return { token: `${payload}.${signPayload(payload)}`, expiresAt: new Date(expiresAt).toISOString() };
}

export function verifyAccessToken(token, { allowExpired = false } = {}) {
  const [payload, signature] = String(token || '').split('.');
  if (!payload || !signature) return null;
  const expected = signPayload(payload);
  const source = Buffer.from(signature);
  const target = Buffer.from(expected);
  if (source.length !== target.length || !timingSafeEqual(source, target)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (parsed.typ !== 'access' || !parsed.sub || !parsed.sid || !parsed.exp) return null;
    if (!allowExpired && parsed.exp * 1000 <= Date.now()) return null;
    return { userId: parsed.sub, sessionId: parsed.sid, expiresAt: new Date(parsed.exp * 1000).toISOString() };
  } catch {
    return null;
  }
}

export function getRefreshExpiry(now = Date.now()) {
  return new Date(now + getRefreshTokenTtlHours() * 60 * 60_000);
}
