import { prisma } from '../db/prisma.js';
import { HttpError } from '../lib/errors.js';
import { readJsonBody, sendJson } from '../lib/http.js';
import { createInviteCode } from '../lib/invite-code.js';
import {
  assertAuthEmail,
  assertAuthPassword,
  assertCompanyName,
  assertJoinCode,
  assertPersonName,
  assertPhone,
} from '../auth/input-validation.js';
import {
  hasActiveCompanyMembership,
  hasActiveCompanyMembershipInTx,
  hasPriorCompanyMembership,
  lockUserForMembershipChange,
} from '../auth/membership-policy.js';
import { consumeRateLimit, resetRateLimit } from '../auth/rate-limit.js';
import { clearRefreshCookie, readRefreshToken, setRefreshCookie } from '../auth/session-cookie.js';
import { createAccessToken, createRefreshToken, getRefreshExpiry, hashPassword, hashToken, verifyAccessToken, verifyPassword } from '../auth/tokens.js';
import { requireAuth, serializeUser } from '../auth/current-user.js';

const JOIN_CODE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MINUTE_MS = 60_000;
const LOGIN_WINDOW_MS = 10 * MINUTE_MS;
const REGISTER_WINDOW_MS = 60 * MINUTE_MS;
const JOIN_WINDOW_MS = 15 * MINUTE_MS;

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeText(value) {
  return String(value || '').trim();
}

function readBearerToken(request) {
  const value = String(request.headers.authorization || '');
  return value.startsWith('Bearer ') ? value.slice(7).trim() : '';
}

function getClientRateKey(request) {
  const forwardedHeader = request.headers['x-forwarded-for'];
  const forwarded = String(Array.isArray(forwardedHeader) ? forwardedHeader[0] : forwardedHeader || '')
    .split(',')[0]
    .trim();
  const remote = String(request.socket?.remoteAddress || '').trim();
  return forwarded || remote || 'unknown';
}

function enforceRateLimit({ scope, key, limit, windowMs }) {
  const result = consumeRateLimit({ scope, key, limit, windowMs });
  if (result.allowed) return;
  const retryAfterSeconds = Math.max(1, Math.ceil(result.retryAfterMs / 1000));
  throw new HttpError(429, `Too many attempts. Try again in ${retryAfterSeconds} seconds`);
}

function slugify(value) {
  const base = normalizeText(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return base || 'company';
}

async function uniqueJoinCode(tx) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const joinCode = createInviteCode();
    if (!(await tx.company.findUnique({ where: { joinCode } }))) return joinCode;
  }
  throw new HttpError(503, 'Could not generate company code');
}

async function uniqueSlug(tx, companyName) {
  const base = slugify(companyName);
  let slug = base;
  let suffix = 1;
  while (await tx.company.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

async function loadUser(tx, userId) {
  return tx.user.findUnique({
    where: { id: userId },
    include: { memberships: { where: { deletedAt: null }, include: { company: true } } },
  });
}

async function lockCompanyInvite(tx, joinCode) {
  const rows = await tx.$queryRaw`
    SELECT "id", "joinCodeExpiresAt", "joinCodeRevokedAt"
    FROM "companies"
    WHERE "joinCode" = ${joinCode}
    FOR UPDATE
  `;
  if (!rows.length) throw new HttpError(404, 'Company code was not found');

  const company = rows[0];
  if (company.joinCodeRevokedAt) throw new HttpError(410, 'Company code was revoked');
  if (!company.joinCodeExpiresAt || company.joinCodeExpiresAt <= new Date()) {
    throw new HttpError(410, 'Company code has expired');
  }
  return company;
}

async function revokeRefreshSession(tx, refreshToken) {
  if (!refreshToken) return;
  await tx.session.deleteMany({ where: { tokenHash: hashToken(refreshToken) } });
}

async function issueSession(tx, userId) {
  const refreshToken = createRefreshToken();
  const session = await tx.session.create({
    data: { userId, tokenHash: hashToken(refreshToken), expiresAt: getRefreshExpiry() },
  });
  const access = createAccessToken({ userId, sessionId: session.id });
  return { refreshToken, session, ...access };
}

function authResponse(response, status, session, user) {
  const maxAge = Math.max(0, Math.floor((session.session.expiresAt.getTime() - Date.now()) / 1000));
  setRefreshCookie(response, session.refreshToken, maxAge);
  sendJson(response, status, {
    token: session.token,
    accessTokenExpiresAt: session.expiresAt,
    user: serializeUser(user),
  });
}

async function registerManager(request, response) {
  const previousRefreshToken = readRefreshToken(request);
  const body = await readJsonBody(request);
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  const name = normalizeText(body.name);
  const companyName = normalizeText(body.companyName);
  const phone = normalizeText(body.phone) || null;

  assertAuthEmail(email);
  assertAuthPassword(password);
  assertPersonName(name);
  assertCompanyName(companyName);
  assertPhone(phone);
  enforceRateLimit({
    scope: 'auth:register:client',
    key: getClientRateKey(request),
    limit: 10,
    windowMs: REGISTER_WINDOW_MS,
  });

  const result = await prisma.$transaction(async tx => {
    if (await tx.user.findUnique({ where: { email } })) throw new HttpError(409, 'An account with this email already exists');
    if (phone && await tx.user.findUnique({ where: { phone } })) throw new HttpError(409, 'An account with this phone already exists');

    const user = await tx.user.create({
      data: { email, passwordHash: hashPassword(password), name, firstName: name.split(/\s+/)[0] || name, lastName: name.split(/\s+/).slice(1).join(' '), phone },
    });
    const now = new Date();
    const company = await tx.company.create({
      data: {
        name: companyName,
        slug: await uniqueSlug(tx, companyName),
        joinCode: await uniqueJoinCode(tx),
        joinCodeCreatedAt: now,
        joinCodeExpiresAt: new Date(now.getTime() + JOIN_CODE_TTL_MS),
      },
    });
    await tx.companyMembership.create({ data: { userId: user.id, companyId: company.id, role: 'MANAGER' } });
    await revokeRefreshSession(tx, previousRefreshToken);
    const session = await issueSession(tx, user.id);
    return { session, user: await loadUser(tx, user.id) };
  });

  authResponse(response, 201, result.session, result.user);
}

async function registerEmployee(request, response) {
  const previousRefreshToken = readRefreshToken(request);
  const body = await readJsonBody(request);
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  const name = normalizeText(body.name);
  const phone = normalizeText(body.phone) || null;

  assertAuthEmail(email);
  assertAuthPassword(password);
  assertPersonName(name);
  assertPhone(phone);
  enforceRateLimit({
    scope: 'auth:register:client',
    key: getClientRateKey(request),
    limit: 10,
    windowMs: REGISTER_WINDOW_MS,
  });

  const result = await prisma.$transaction(async tx => {
    if (await tx.user.findUnique({ where: { email } })) throw new HttpError(409, 'An account with this email already exists');
    if (phone && await tx.user.findUnique({ where: { phone } })) throw new HttpError(409, 'An account with this phone already exists');

    const user = await tx.user.create({
      data: { email, passwordHash: hashPassword(password), name, firstName: name.split(/\s+/)[0] || name, lastName: name.split(/\s+/).slice(1).join(' '), phone },
    });
    await revokeRefreshSession(tx, previousRefreshToken);
    const session = await issueSession(tx, user.id);
    return { session, user: await loadUser(tx, user.id) };
  });

  authResponse(response, 201, result.session, result.user);
}

async function joinCompany(request, response) {
  const current = await requireAuth(request);
  if (hasActiveCompanyMembership(current)) {
    throw new HttpError(409, 'User already belongs to an active company');
  }

  const body = await readJsonBody(request);
  const joinCode = normalizeText(body.joinCode).toUpperCase();
  assertJoinCode(joinCode);
  enforceRateLimit({
    scope: 'auth:join:user',
    key: current.id,
    limit: 15,
    windowMs: JOIN_WINDOW_MS,
  });

  const user = await prisma.$transaction(async tx => {
    if (!(await lockUserForMembershipChange(tx, current.id))) {
      throw new HttpError(404, 'User not found');
    }
    if (await hasActiveCompanyMembershipInTx(tx, current.id)) {
      throw new HttpError(409, 'User already belongs to an active company');
    }

    const company = await lockCompanyInvite(tx, joinCode);
    const existing = await tx.companyMembership.findUnique({ where: { companyId_userId: { companyId: company.id, userId: current.id } } });
    if (hasPriorCompanyMembership(existing)) {
      throw new HttpError(409, 'This membership must be reactivated by the company manager');
    }
    await tx.companyMembership.create({ data: { companyId: company.id, userId: current.id, role: 'EMPLOYEE' } });
    return loadUser(tx, current.id);
  });

  resetRateLimit({ scope: 'auth:join:user', key: current.id });
  sendJson(response, 200, { user: serializeUser(user) });
}

async function login(request, response) {
  const previousRefreshToken = readRefreshToken(request);
  const body = await readJsonBody(request);
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  assertAuthEmail(email);
  assertAuthPassword(password);

  const clientKey = getClientRateKey(request);
  enforceRateLimit({
    scope: 'auth:login:client',
    key: clientKey,
    limit: 60,
    windowMs: LOGIN_WINDOW_MS,
  });
  enforceRateLimit({
    scope: 'auth:login:identity',
    key: `${clientKey}:${email}`,
    limit: 10,
    windowMs: LOGIN_WINDOW_MS,
  });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing || existing.deletedAt || !verifyPassword(password, existing.passwordHash)) throw new HttpError(401, 'Invalid email or password');

  const result = await prisma.$transaction(async tx => {
    await revokeRefreshSession(tx, previousRefreshToken);
    return { session: await issueSession(tx, existing.id), user: await loadUser(tx, existing.id) };
  });
  resetRateLimit({ scope: 'auth:login:identity', key: `${clientKey}:${email}` });
  authResponse(response, 200, result.session, result.user);
}

async function refresh(request, response) {
  const refreshToken = readRefreshToken(request);
  if (!refreshToken) throw new HttpError(401, 'Refresh session is missing');
  const tokenHash = hashToken(refreshToken);
  const now = new Date();

  const result = await prisma.$transaction(async tx => {
    const session = await tx.session.findUnique({ where: { tokenHash } });
    if (!session || session.expiresAt <= now) {
      throw new HttpError(401, 'Refresh session expired');
    }

    const nextRefreshToken = createRefreshToken();
    const nextTokenHash = hashToken(nextRefreshToken);
    const nextRefreshExpiry = getRefreshExpiry();
    const rotated = await tx.session.updateMany({
      where: {
        id: session.id,
        userId: session.userId,
        tokenHash,
        expiresAt: { gt: now },
      },
      data: {
        tokenHash: nextTokenHash,
        expiresAt: nextRefreshExpiry,
      },
    });
    if (rotated.count !== 1) {
      throw new HttpError(401, 'Refresh session expired');
    }

    const user = await loadUser(tx, session.userId);
    if (!user || user.deletedAt) throw new HttpError(401, 'Refresh session expired');
    const access = createAccessToken({ userId: session.userId, sessionId: session.id });
    return {
      session: {
        refreshToken: nextRefreshToken,
        session: { ...session, tokenHash: nextTokenHash, expiresAt: nextRefreshExpiry },
        ...access,
      },
      user,
    };
  });

  authResponse(response, 200, result.session, result.user);
}

async function logout(request, response) {
  const refreshToken = readRefreshToken(request);
  const access = verifyAccessToken(readBearerToken(request), { allowExpired: true });

  if (access || refreshToken) {
    await prisma.$transaction(async tx => {
      if (access) {
        await tx.session.deleteMany({
          where: { id: access.sessionId, userId: access.userId },
        });
      }
      await revokeRefreshSession(tx, refreshToken);
    });
  }

  clearRefreshCookie(response);
  sendJson(response, 200, { ok: true });
}

export async function handleAuthRoutes(request, response, { pathName }) {
  if (request.method === 'POST' && pathName === '/api/auth/register-manager') return registerManager(request, response).then(() => true);
  if (request.method === 'POST' && pathName === '/api/auth/register-employee') return registerEmployee(request, response).then(() => true);
  if (request.method === 'POST' && pathName === '/api/auth/join-company') return joinCompany(request, response).then(() => true);
  if (request.method === 'POST' && pathName === '/api/auth/login') return login(request, response).then(() => true);
  if (request.method === 'POST' && pathName === '/api/auth/refresh') return refresh(request, response).then(() => true);
  if (request.method === 'POST' && pathName === '/api/auth/logout') return logout(request, response).then(() => true);
  return false;
}
