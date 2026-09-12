import { prisma } from '../db/prisma.js';
import { HttpError } from '../lib/errors.js';
import { readJsonBody, sendJson } from '../lib/http.js';
import { createInviteCode } from '../lib/invite-code.js';
import { hasActiveCompanyMembership } from '../auth/membership-policy.js';
import { clearRefreshCookie, readRefreshToken, setRefreshCookie } from '../auth/session-cookie.js';
import { createAccessToken, createRefreshToken, getRefreshExpiry, hashPassword, hashToken, verifyPassword } from '../auth/tokens.js';
import { requireAuth, serializeUser } from '../auth/current-user.js';

const JOIN_CODE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeText(value) {
  return String(value || '').trim();
}

function assertEmail(email) {
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, 'Enter a valid email address');
}

function assertPassword(password) {
  if (String(password || '').length < 8) throw new HttpError(400, 'Password must contain at least 8 characters');
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
  const body = await readJsonBody(request);
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  const name = normalizeText(body.name);
  const companyName = normalizeText(body.companyName);
  const phone = normalizeText(body.phone) || null;

  assertEmail(email);
  assertPassword(password);
  if (!name) throw new HttpError(400, 'Name is required');
  if (!companyName) throw new HttpError(400, 'Company name is required');

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
    const session = await issueSession(tx, user.id);
    return { session, user: await loadUser(tx, user.id) };
  });

  authResponse(response, 201, result.session, result.user);
}

async function registerEmployee(request, response) {
  const body = await readJsonBody(request);
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  const name = normalizeText(body.name);
  const phone = normalizeText(body.phone) || null;

  assertEmail(email);
  assertPassword(password);
  if (!name) throw new HttpError(400, 'Name is required');

  const result = await prisma.$transaction(async tx => {
    if (await tx.user.findUnique({ where: { email } })) throw new HttpError(409, 'An account with this email already exists');
    if (phone && await tx.user.findUnique({ where: { phone } })) throw new HttpError(409, 'An account with this phone already exists');

    const user = await tx.user.create({
      data: { email, passwordHash: hashPassword(password), name, firstName: name.split(/\s+/)[0] || name, lastName: name.split(/\s+/).slice(1).join(' '), phone },
    });
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
  if (!joinCode) throw new HttpError(400, 'Company code is required');

  const user = await prisma.$transaction(async tx => {
    const company = await tx.company.findUnique({ where: { joinCode } });
    if (!company) throw new HttpError(404, 'Company code was not found');
    if (company.joinCodeRevokedAt) throw new HttpError(410, 'Company code was revoked');
    if (!company.joinCodeExpiresAt || company.joinCodeExpiresAt <= new Date()) {
      throw new HttpError(410, 'Company code has expired');
    }

    const existing = await tx.companyMembership.findUnique({ where: { companyId_userId: { companyId: company.id, userId: current.id } } });
    if (!existing) await tx.companyMembership.create({ data: { companyId: company.id, userId: current.id, role: 'EMPLOYEE' } });
    else if (existing.deletedAt || existing.status !== 'ACTIVE') await tx.companyMembership.update({ where: { id: existing.id }, data: { deletedAt: null, status: 'ACTIVE', role: 'EMPLOYEE' } });
    return loadUser(tx, current.id);
  });

  sendJson(response, 200, { user: serializeUser(user) });
}

async function login(request, response) {
  const body = await readJsonBody(request);
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing || existing.deletedAt || !verifyPassword(password, existing.passwordHash)) throw new HttpError(401, 'Invalid email or password');

  const result = await prisma.$transaction(async tx => ({ session: await issueSession(tx, existing.id), user: await loadUser(tx, existing.id) }));
  authResponse(response, 200, result.session, result.user);
}

async function refresh(request, response) {
  const refreshToken = readRefreshToken(request);
  if (!refreshToken) throw new HttpError(401, 'Refresh session is missing');
  const session = await prisma.session.findUnique({ where: { tokenHash: hashToken(refreshToken) } });
  if (!session || session.expiresAt <= new Date()) {
    clearRefreshCookie(response);
    throw new HttpError(401, 'Refresh session expired');
  }

  const result = await prisma.$transaction(async tx => {
    await tx.session.delete({ where: { id: session.id } });
    const nextSession = await issueSession(tx, session.userId);
    return { session: nextSession, user: await loadUser(tx, session.userId) };
  });
  authResponse(response, 200, result.session, result.user);
}

async function logout(request, response) {
  const refreshToken = readRefreshToken(request);
  if (refreshToken) await prisma.session.deleteMany({ where: { tokenHash: hashToken(refreshToken) } });
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
