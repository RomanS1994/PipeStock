import { prisma } from '../db/prisma.js';
import { HttpError } from '../lib/errors.js';
import { verifyAccessToken } from './tokens.js';

function readBearerToken(request) {
  const value = String(request.headers.authorization || '');
  return value.startsWith('Bearer ') ? value.slice(7).trim() : '';
}

export async function requireAuth(request) {
  const payload = verifyAccessToken(readBearerToken(request));
  if (!payload) throw new HttpError(401, 'Authentication required');

  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    include: {
      user: {
        include: {
          memberships: {
            where: { deletedAt: null },
            include: { company: true },
          },
        },
      },
    },
  });

  if (!session || session.userId !== payload.userId || session.expiresAt <= new Date() || session.user.deletedAt) {
    throw new HttpError(401, 'Session expired');
  }

  return session.user;
}

export function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    name: user.name,
    phone: user.phone,
    profile: user.profile || {},
    memberships: (user.memberships || []).map(membership => ({
      id: membership.id,
      role: membership.role,
      status: membership.status,
      company: membership.company ? {
        id: membership.company.id,
        name: membership.company.name,
        slug: membership.company.slug,
        joinCode: membership.role === 'MANAGER' ? membership.company.joinCode : undefined,
      } : null,
    })),
  };
}
